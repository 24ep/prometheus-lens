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
import { ArrowLeft, ArrowRight, Check, Sparkles, Info, TestTubeDiagonal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  name: z.string().min(3, { message: "Asset name must be at least 3 characters." }),
  type: z.custom<AssetType>((val) => assetTypes.includes(val as AssetType), {
    message: "Invalid asset type.",
  }),
  folderId: z.string().optional(),
  tags: z.string().optional(), // Comma-separated
  // Configuration fields will be dynamic, so not strictly typed here for simplicity
  // For a real app, use z.discriminatedUnion for type-specific configs
  config_param1: z.string().optional(), // Example: IP Address / Metrics Endpoint
  config_param2: z.string().optional(), // Example: Port / Job Name
  prometheus_config: z.string().optional(), // For manual YAML input or generated output
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
      - role: pod # or node, service, etc.
        api_server: ${data.config_param1 || 'YOUR_K8S_API_SERVER'}
        # bearer_token: ${data.config_param2 || 'YOUR_BEARER_TOKEN'} # if needed
    relabel_configs:
      # Example relabeling, adjust as needed
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
    # Add more specific configurations based on asset type
    # metrics_path: /metrics # default, adjust if needed
    # scheme: http # default, adjust if https
`;
};

const getMockInstructions = (type?: AssetType): string => {
  if (!type) return "Select an asset type to see specific instructions.";
  switch (type) {
    case 'Server':
      return "1. Install Node Exporter on the server.\n2. Ensure port (default 9100) is open.\n3. Add the generated scrape config to your prometheus.yml.";
    case 'Application':
      return "1. Expose a /metrics endpoint in your application (e.g., using a Prometheus client library).\n2. Add the generated scrape config to prometheus.yml.";
    case 'Network':
      return "1. Ensure SNMP is enabled on the network device.\n2. Use the correct community string.\n3. Install and configure SNMP Exporter if not scraping directly.\n4. Add scrape config to prometheus.yml pointing to SNMP Exporter or device.";
    default:
      return "1. Ensure the asset exposes Prometheus metrics.\n2. Add the generated scrape config to your prometheus.yml.\n3. Reload Prometheus configuration: `kill -HUP <prometheus_pid>` or via API.";
  }
};


export function AssetConnectionWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: assetTypes[0], // Default to first asset type
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

  const handleNext = async () => {
    const isValid = await form.trigger(
      currentStep === 1 ? ['name', 'type'] : 
      currentStep === 2 ? ['config_param1', 'config_param2'] : []
    );
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else if (isValid && currentStep === STEPS.length) {
      // Final submission
      onSubmit(form.getValues());
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: FormData) => {
    console.log(data); // Mock submission
    toast({
      title: "Asset Configuration Saved!",
      description: `Asset "${data.name}" of type "${data.type}" has been configured.`,
      variant: 'default',
    });
    // Potentially redirect or reset form
  };
  
  const handleTestConnection = () => {
    toast({ title: "Testing Connection...", description: "This is a mock test." });
    setTimeout(() => {
      const success = Math.random() > 0.3; // Simulate success/failure
      toast({
        title: success ? "Connection Successful!" : "Connection Failed",
        description: success ? "Prometheus can reach the configured target." : "Could not connect. Check configuration and network.",
        variant: success ? 'default' : 'destructive',
      });
    }, 1500);
  };
  
  const configPlaceholders = watchedType ? assetTypeConfigPlaceholders[watchedType] : { param1: '', param2: '' };

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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="folderId">
                        <SelectValue placeholder="Assign to a folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
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
              <div>
                <Label className="flex items-center"><Info className="w-4 h-4 mr-2 text-primary"/> Connection Instructions for {watchedType}</Label>
                <ScrollArea className="h-32 w-full rounded-md border p-3 bg-muted/30 mt-1">
                    <pre className="text-sm whitespace-pre-wrap">{getMockInstructions(watchedType)}</pre>
                </ScrollArea>
              </div>
              <div>
                <Label>Generated Prometheus Configuration</Label>
                 <ScrollArea className="h-40 w-full rounded-md border p-2 bg-muted/30">
                  <pre className="text-xs font-code whitespace-pre-wrap">{generatedConfig}</pre>
                </ScrollArea>
              </div>
              <Button type="button" variant="outline" onClick={handleTestConnection} className="w-full">
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
