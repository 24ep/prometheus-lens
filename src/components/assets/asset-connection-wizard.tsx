
"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { assetTypes, type AssetType, type Asset } from '@/types';
import { mockFoldersData } from '@/lib/mock-data';
import { ArrowLeft, ArrowRight, Check, Sparkles, Info, TestTubeDiagonal, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

const formSchema = z.object({
  name: z.string().min(3, { message: "Asset name must be at least 3 characters." }),
  type: z.custom<AssetType>((val) => assetTypes.includes(val as AssetType), {
    message: "Invalid asset type.",
  }),
  folderId: z.string().optional(),
  tags: z.string().optional(), // Comma-separated
  config_param1: z.string().optional(),
  config_param2: z.string().optional(),
  prometheus_config: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const STEPS = [
  { id: 1, name: 'Basic Information' },
  { id: 2, name: 'Configuration' },
  { id: 3, name: 'Instructions & Test' },
];

const assetTypeConfigPlaceholders: Record<AssetType, { param1: string, param2: string }> = {
  Server: { param1: 'Server IP Address (e.g., 192.168.1.100)', param2: 'Node Exporter Port (e.g., 9100)' },
  Network: { param1: 'Device IP / Hostname', param2: 'SNMP Community String' },
  Application: { param1: 'Metrics Endpoint URL (e.g., http://app/metrics)', param2: 'Application Port (optional)' },
  Database: { param1: 'Database Host Address', param2: 'Exporter Port (e.g., 9187 for PostgreSQL)' },
  Kubernetes: { param1: 'API Server URL (e.g., https://kube-api.example.com)', param2: 'Bearer Token (optional)' },
};

const getMockPrometheusConfig = (data: Partial<FormData>): string => {
  if (!data.type || !data.name) return `# Incomplete configuration`;
  const jobName = data.name.toLowerCase().replace(/\s+/g, '_');
  let targets = `'${data.config_param1 || 'TARGET_IP_OR_HOSTNAME'}:${data.config_param2 || 'PORT'}'`;
  if (data.type === 'Application') {
    targets = `'${data.config_param1 || 'METRICS_ENDPOINT'}'`;
  } else if (data.type === 'Kubernetes') {
    return `
scrape_configs:
  - job_name: '${jobName}'
    kubernetes_sd_configs:
      - role: pod
        api_server: ${data.config_param1 || 'YOUR_K8S_API_SERVER'}
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
`;
  }

  return `
scrape_configs:
  - job_name: '${jobName}'
    static_configs:
      - targets: [${targets}]
`;
};

const getMockInstructions = (type?: AssetType): string[] => {
  if (!type) return ["Select an asset type to see specific instructions."];
  switch (type) {
    case 'Server':
      return [
        "Install Node Exporter on the target server.",
        "Ensure the Node Exporter port (default 9100) is accessible from your Prometheus server.",
        "Verify Node Exporter is serving metrics at `/metrics` endpoint (e.g., `http://<server_ip>:9100/metrics`).",
        "Add the generated scrape configuration to your `prometheus.yml` file.",
        "Reload your Prometheus configuration (e.g., `kill -HUP <prometheus_pid>` or via API endpoint)."
      ];
    case 'Application':
      return [
        "Ensure your application exposes a Prometheus metrics endpoint (commonly `/metrics`).",
        "If using a client library (e.g., prometheus-client for Python/Java, prom-client for Node.js), configure it appropriately.",
        "Verify the metrics endpoint is accessible from your Prometheus server.",
        "Add the generated scrape configuration to your `prometheus.yml` file.",
        "Reload your Prometheus configuration."
      ];
    case 'Network':
      return [
        "Ensure SNMP is enabled on the network device.",
        "Verify the SNMP community string and version (v1, v2c, or v3 credentials).",
        "If not scraping the device directly, ensure an SNMP Exporter is running and configured to query the device.",
        "Verify the SNMP Exporter's `/snmp` endpoint (e.g., `http://<exporter_ip>:9116/snmp?module=if_mib&target=<device_ip>`).",
        "Add the generated scrape configuration to `prometheus.yml` (pointing to the SNMP Exporter).",
        "Reload your Prometheus configuration."
      ];
    case 'Database':
        return [
            "Install the appropriate Prometheus exporter for your database type (e.g., `pg_exporter` for PostgreSQL, `mysqld_exporter` for MySQL).",
            "Configure the exporter with connection details for your database instance.",
            "Ensure the exporter port (e.g., 9187 for PostgreSQL, 9104 for MySQL) is accessible from Prometheus.",
            "Verify the exporter is serving metrics at its `/metrics` endpoint.",
            "Add the generated scrape configuration to your `prometheus.yml` file.",
            "Reload your Prometheus configuration."
        ];
    case 'Kubernetes':
        return [
            "Ensure your Kubernetes cluster's API server is accessible by Prometheus.",
            "Determine the appropriate service discovery role (e.g., `pod`, `service`, `node`, `endpoints`).",
            "If required, provide a bearer token or configure TLS settings for authentication.",
            "Apply necessary RBAC rules to allow Prometheus to discover targets (e.g., ClusterRole, ClusterRoleBinding).",
            "Check for annotations like `prometheus.io/scrape: 'true'` and `prometheus.io/port: '<port_number>'` on your pods/services if using `relabel_configs` for filtering.",
            "Add the generated scrape configuration to your `prometheus.yml` file.",
            "Reload your Prometheus configuration."
        ];
    default:
      return [
        "Ensure the asset exposes Prometheus-compatible metrics on a reachable HTTP endpoint.",
        "Add the generated scrape configuration to your `prometheus.yml` file.",
        "Reload Prometheus configuration (e.g., `kill -HUP <prometheus_pid>` or via API endpoint)."
      ];
  }
};


export function AssetConnectionWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: assetTypes[0],
      // folderId will default to undefined
    },
  });

  const watchedType = form.watch('type');
  const watchedName = form.watch('name');
  const watchedConfigParam1 = form.watch('config_param1');
  const watchedConfigParam2 = form.watch('config_param2');

  const generatedConfig = getMockPrometheusConfig({
    type: watchedType,
    name: watchedName,
    config_param1: watchedConfigParam1,
    config_param2: watchedConfigParam2,
  });

  const instructionSteps = getMockInstructions(watchedType);

  const handleNext = async () => {
    const isValid = await form.trigger(
      currentStep === 1 ? ['name', 'type', 'folderId'] :
      currentStep === 2 ? ['config_param1', 'config_param2'] : []
    );
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else if (isValid && currentStep === STEPS.length) {
      onSubmit(form.getValues());
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: FormData) => {
    console.log(data);
    toast({
      title: "Asset Configuration Saved!",
      description: `Asset "${data.name}" of type "${data.type}" has been configured.`,
      variant: 'default',
    });
  };

  const handleTestConnection = () => {
    toast({ title: "Testing Connection...", description: "This is a mock test." });
    setTimeout(() => {
      const success = Math.random() > 0.3;
      toast({
        title: success ? "Connection Successful!" : "Connection Failed",
        description: success ? "Prometheus can reach the configured target." : "Could not connect. Check configuration and network.",
        variant: success ? 'default' : 'destructive',
      });
    }, 1500);
  };

  const configPlaceholders = watchedType ? assetTypeConfigPlaceholders[watchedType] : { param1: '', param2: '' };
  const NO_FOLDER_VALUE = "___NO_FOLDER___";

  return (
    <Card className="w-full max-w-2xl mx-auto glassmorphic">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-primary"/>
            New Asset Connection Wizard
        </CardTitle>
        <CardDescription>Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}</CardDescription>
        <div className="w-full bg-muted rounded-full h-2.5 mt-2">
          <div className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${(currentStep / STEPS.length) * 100}%` }}></div>
        </div>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 min-h-[300px]">
          {currentStep === 1 && (
            <>
              <div>
                <Label htmlFor="name">Asset Name</Label>
                <Input id="name" {...form.register('name')} placeholder="e.g., Production Web Server" />
                {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="type">Asset Type</Label>
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        {assetTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                 {form.formState.errors.type && <p className="text-sm text-destructive mt-1">{form.formState.errors.type.message}</p>}
              </div>
              <div>
                <Label htmlFor="folderId">Folder (Optional)</Label>
                 <Controller
                  name="folderId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === NO_FOLDER_VALUE ? undefined : value);
                      }}
                      value={field.value === undefined ? "" : field.value} // Pass "" to show placeholder if undefined
                    >
                      <SelectTrigger id="folderId">
                        <SelectValue placeholder="Assign to a folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_FOLDER_VALUE}>None</SelectItem>
                        {mockFoldersData.map(folder => (
                          <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (Optional, comma-separated)</Label>
                <Input id="tags" {...form.register('tags')} placeholder="e.g., critical, web, production" />
              </div>
            </>
          )}
          {currentStep === 2 && (
            <>
              <h3 className="text-lg font-medium font-headline">Configure for: {watchedType}</h3>
              <div>
                <Label htmlFor="config_param1">{configPlaceholders.param1.substring(0, configPlaceholders.param1.indexOf('(')-1) || 'Primary Config'}</Label>
                <Input id="config_param1" {...form.register('config_param1')} placeholder={configPlaceholders.param1} />
              </div>
              <div>
                <Label htmlFor="config_param2">{configPlaceholders.param2.substring(0, configPlaceholders.param2.indexOf('(')-1) || 'Secondary Config'}</Label>
                <Input id="config_param2" {...form.register('config_param2')} placeholder={configPlaceholders.param2} />
              </div>
              <div className="pt-2">
                <Label htmlFor="prometheus_config">Generated Prometheus Configuration (Preview)</Label>
                <ScrollArea className="h-40 w-full rounded-md border p-2 bg-muted/30">
                  <pre className="text-xs font-code whitespace-pre-wrap">{generatedConfig}</pre>
                </ScrollArea>
                <p className="text-xs text-muted-foreground mt-1">This is a simplified preview. You may need to adjust it.</p>
              </div>
            </>
          )}
          {currentStep === 3 && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="w-full mb-4">
                    <FileText className="mr-2 h-4 w-4" />
                    View Connection Instructions for {watchedType}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px] glassmorphic">
                  <DialogHeader>
                    <DialogTitle className="font-headline">Connection Instructions: {watchedType}</DialogTitle>
                    <DialogDescription>
                      Follow these steps to connect your {watchedType} asset to Prometheus.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-72 w-full rounded-md border p-3 my-4 bg-background/50">
                    <ol className="list-decimal list-inside space-y-3 text-sm">
                      {instructionSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </ScrollArea>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div>
                <Label>Generated Prometheus Configuration</Label>
                 <ScrollArea className="h-40 w-full rounded-md border p-2 bg-muted/30">
                  <pre className="text-xs font-code whitespace-pre-wrap">{generatedConfig}</pre>
                </ScrollArea>
              </div>
              <Button type="button" variant="outline" onClick={handleTestConnection} className="w-full mt-4">
                <TestTubeDiagonal className="mr-2 h-4 w-4" />
                Test Connection (Mock)
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-6 border-t border-[hsl(var(--glass-border-light))]">
          <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          {currentStep < STEPS.length ? (
            <Button type="button" onClick={handleNext}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit">
              <Check className="mr-2 h-4 w-4" /> Finish & Save
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

