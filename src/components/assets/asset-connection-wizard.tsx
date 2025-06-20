
"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea'; // Not used directly for wizard fields now
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { assetTypes, type AssetType, type Asset, type FormData as WizardFormData } from '@/types';
import { mockFoldersData, addAsset } from '@/lib/mock-data';
import { getMockPrometheusConfig, getMockInstructions, assetTypeConfigPlaceholders } from '@/lib/asset-utils';
import { ArrowLeft, ArrowRight, Check, Sparkles, Info, TestTubeDiagonal, FileText } from 'lucide-react';
// import { cn } from '@/lib/utils'; // Not used in this file anymore
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
import { useRouter } from 'next/navigation';


const formSchema = z.object({
  name: z.string().min(3, { message: "Asset name must be at least 3 characters." }),
  type: z.custom<AssetType>((val) => assetTypes.includes(val as AssetType), {
    message: "Invalid asset type.",
  }),
  folderId: z.string().optional(),
  tags: z.string().optional(), // Comma-separated
  config_param1: z.string().optional(), // Example: IP/Hostname or API Endpoint
  config_param2: z.string().optional(), // Example: Port or Token
  // prometheus_config: z.string().optional(), // This will be generated
});

// Using WizardFormData from types.ts to align
type CurrentFormData = WizardFormData;

const STEPS = [
  { id: 1, name: 'Basic Information' },
  { id: 2, name: 'Configuration Details' },
  { id: 3, name: 'Review & Test' },
];


export function AssetConnectionWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<CurrentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: assetTypes[0], // Default to the first asset type
    },
  });

  const watchedType = form.watch('type');
  const watchedName = form.watch('name');
  const watchedConfigParam1 = form.watch('config_param1');
  const watchedConfigParam2 = form.watch('config_param2');

  const generatedConfigObject = (() => {
    const configString = getMockPrometheusConfig({
        type: watchedType,
        name: watchedName,
        config_param1: watchedConfigParam1,
        config_param2: watchedConfigParam2,
      });
    try {
        // Assuming getMockPrometheusConfig returns a string that is a full YAML/JSON structure
        // For Prometheus, it's usually YAML, but we are simplifying to JSON-like object structure
        // and then the actual asset.configuration will store one job_def.
        // This part needs careful handling based on actual getMockPrometheusConfig output.
        // For now, let's parse it as if it's a JSON string of the whole config
        // and extract the first scrape_config job.
        // A simple approach for this mock:
        // A real implementation would use a YAML parser if the string is YAML.
        // Here, we're assuming getMockPrometheusConfig is crafted to produce a parseable representation.
        if (configString.startsWith('# Incomplete configuration')) {
            return { job_name: 'incomplete_config' };
        }
        // Hacky way to convert YAML-like string to a JS object for this mock
        // This is NOT robust for real YAML.
        const jobNameMatch = configString.match(/job_name:\s*'([^']+)'/);
        const targetsMatch = configString.match(/targets:\s*\[([^\]]+)\]/);
        const apiServerMatch = configString.match(/api_server:\s*([^\s]+)/);

        const baseConfig: Record<string, any> = {
            job_name: jobNameMatch ? jobNameMatch[1] : watchedName?.toLowerCase().replace(/\s+/g, '_') || 'new_job'
        };

        if (watchedType === 'Kubernetes') {
            baseConfig.kubernetes_sd_configs = [{ 
                role: 'pod', // default
                api_server: apiServerMatch ? apiServerMatch[1] : watchedConfigParam1 || 'YOUR_K8S_API_SERVER'
            }];
            if (watchedConfigParam2) baseConfig.kubernetes_sd_configs[0].bearer_token_file = "/path/to/token"; // Placeholder if param2 is token
        } else if (targetsMatch) {
            const targets = targetsMatch[1].split(',').map(t => t.trim().replace(/'/g, ''));
            baseConfig.static_configs = [{ targets }];
        } else if (watchedConfigParam1) { // Fallback for Application type if regex fails
             baseConfig.static_configs = [{ targets: [watchedConfigParam1] }];
        }
        
        return baseConfig;

    } catch (e) {
        console.error("Error parsing generated config string:", e);
        return { job_name: 'parsing_error' };
    }
  })();
  
  const generatedConfigStringForDisplay = getMockPrometheusConfig({
    type: watchedType,
    name: watchedName,
    config_param1: watchedConfigParam1,
    config_param2: watchedConfigParam2,
  });


  const instructionSteps = getMockInstructions(watchedType);

  const handleNext = async () => {
    const fieldsToValidate: (keyof CurrentFormData)[] =
      currentStep === 1 ? ['name', 'type', 'folderId', 'tags'] :
      currentStep === 2 ? ['config_param1', 'config_param2'] : [];
    
    const isValid = await form.trigger(fieldsToValidate.length > 0 ? fieldsToValidate : undefined);

    if (isValid) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        // This is the final step, submit the form
        onSubmit(form.getValues());
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: CurrentFormData) => {
    const newAssetData: Omit<Asset, 'id' | 'lastChecked' | 'status'> = {
      name: data.name,
      type: data.type,
      configuration: generatedConfigObject, // Use the parsed object
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      folderId: data.folderId === NO_FOLDER_VALUE ? undefined : data.folderId,
      // grafanaLink can be added later
    };
    
    const savedAsset = addAsset(newAssetData); // Save to mock data

    toast({
      title: "Asset Configuration Saved!",
      description: `Asset "${savedAsset.name}" of type "${savedAsset.type}" has been configured and added.`,
      variant: 'default',
    });
    router.push('/'); // Redirect to dashboard after saving
  };

  const handleTestConnection = () => {
    toast({ title: "Testing Connection...", description: "This is a mock test. Validating configuration..." });
    setTimeout(() => {
      const success = Math.random() > 0.3; // Simulate success/failure
      toast({
        title: success ? "Connection Successful!" : "Connection Failed",
        description: success ? `Prometheus can reach the configured target for ${watchedName}.` : `Could not connect for ${watchedName}. Check configuration and network.`,
        variant: success ? 'default' : 'destructive',
      });
    }, 1500);
  };

  const currentConfigPlaceholders = watchedType ? assetTypeConfigPlaceholders[watchedType] : { param1: 'Primary Config Parameter', param2: 'Secondary Config Parameter' };
  const NO_FOLDER_VALUE = "___NO_FOLDER___";

  return (
    <Card className="w-full max-w-2xl mx-auto">
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
          {currentStep === 1 && ( // Basic Information
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
                      onValueChange={(value) => field.onChange(value === NO_FOLDER_VALUE ? undefined : value)}
                      value={field.value || NO_FOLDER_VALUE}
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
          {currentStep === 2 && ( // Configuration Details
            <>
              <h3 className="text-lg font-medium font-headline">Provide Configuration Details for: <span className="text-primary">{watchedType}</span></h3>
              <p className="text-sm text-muted-foreground mb-4">Enter the specific parameters required to connect to your '{watchedType}' asset.</p>
              <div>
                <Label htmlFor="config_param1">{currentConfigPlaceholders.param1.substring(0, currentConfigPlaceholders.param1.indexOf('(')-1) || 'Primary Config Value'}</Label>
                <Input id="config_param1" {...form.register('config_param1')} placeholder={currentConfigPlaceholders.param1} />
                 {form.formState.errors.config_param1 && <p className="text-sm text-destructive mt-1">{form.formState.errors.config_param1.message}</p>}
              </div>
              <div>
                <Label htmlFor="config_param2">{currentConfigPlaceholders.param2.substring(0, currentConfigPlaceholders.param2.indexOf('(')-1) || 'Secondary Config Value'}</Label>
                <Input id="config_param2" {...form.register('config_param2')} placeholder={currentConfigPlaceholders.param2} />
                {form.formState.errors.config_param2 && <p className="text-sm text-destructive mt-1">{form.formState.errors.config_param2.message}</p>}
              </div>
               <div className="pt-2">
                <Label>Generated Prometheus Configuration (Preview)</Label>
                <ScrollArea className="h-40 w-full rounded-md border p-2 bg-muted/30">
                  <pre className="text-xs font-code whitespace-pre-wrap">{generatedConfigStringForDisplay}</pre>
                </ScrollArea>
                <p className="text-xs text-muted-foreground mt-1">This is a simplified preview. The actual saved configuration will be an object derived from this.</p>
              </div>
            </>
          )}
          {currentStep === 3 && ( // Review & Test
            <>
              <h3 className="text-lg font-medium font-headline">Review Configuration & Instructions</h3>
              <p className="text-sm text-muted-foreground mb-1">Ensure the generated configuration is correct and review the connection steps.</p>
               <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="w-full mb-4">
                    <FileText className="mr-2 h-4 w-4" />
                    View Connection Instructions for {watchedType}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline">Connection Instructions: {watchedType}</DialogTitle>
                    <DialogDescription>
                      Follow these steps to connect your {watchedType} asset to Prometheus.
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-72 w-full rounded-md border p-3 my-4">
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
                <Label>Final Generated Prometheus Configuration (for `prometheus.yml`)</Label>
                 <ScrollArea className="h-40 w-full rounded-md border p-2 bg-muted/30">
                  <pre className="text-xs font-code whitespace-pre-wrap">{generatedConfigStringForDisplay}</pre>
                </ScrollArea>
                 <p className="text-xs text-muted-foreground mt-1">The object stored internally will be the first job definition from `scrape_configs`.</p>
              </div>
              <Button type="button" variant="outline" onClick={handleTestConnection} className="w-full mt-4">
                <TestTubeDiagonal className="mr-2 h-4 w-4" />
                Test Connection (Mock)
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-6 border-t">
          <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          {currentStep < STEPS.length ? (
            <Button type="button" onClick={handleNext}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit">
              <Check className="mr-2 h-4 w-4" /> Finish & Save Asset
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
