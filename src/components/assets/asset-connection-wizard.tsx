
"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { assetTypes, type AssetType, type Asset, type FormData as WizardFormData } from '@/types';
import { mockFoldersData, addAsset } from '@/lib/mock-data';
import { getMockPrometheusConfig, getMockInstructions, assetTypeConfigPlaceholders } from '@/lib/asset-utils';
import { ArrowLeft, ArrowRight, Check, Sparkles, TestTubeDiagonal, Download } from 'lucide-react'; // FileText removed, Download added
import { ScrollArea } from '../ui/scroll-area';
// Dialog related imports for nested dialog (if any were still used, but instructions dialog is removed) are no longer needed for instructions
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';


const formSchema = z.object({
  name: z.string().min(3, { message: "Asset name must be at least 3 characters." }),
  type: z.custom<AssetType>((val) => assetTypes.includes(val as AssetType), {
    message: "Invalid asset type.",
  }),
  folderId: z.string().optional(),
  tags: z.string().optional(), // Comma-separated
  config_param1: z.string().optional(),
  config_param2: z.string().optional(),
});

type CurrentFormData = WizardFormData;

const STEPS = [
  { id: 1, name: 'Basic Information' },
  { id: 2, name: 'Configuration Details' },
  { id: 3, name: 'Review & Download' }, // Updated step name
];

interface AssetConnectionWizardProps {
  onSaveComplete: (savedAsset: Asset) => void;
}

export function AssetConnectionWizard({ onSaveComplete }: AssetConnectionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<CurrentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: assetTypes[0],
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
    if (configString.startsWith('# Incomplete configuration')) {
        return { job_name: 'incomplete_config' };
    }
    const jobNameMatch = configString.match(/job_name:\s*'([^']+)'/);
    const targetsMatch = configString.match(/targets:\s*\[([^\]]+)\]/);
    const apiServerMatch = configString.match(/api_server:\s*([^\s]+)/);

    const baseConfig: Record<string, any> = {
        job_name: jobNameMatch ? jobNameMatch[1] : watchedName?.toLowerCase().replace(/\s+/g, '_') || 'new_job'
    };

    if (watchedType === 'Kubernetes') {
        baseConfig.kubernetes_sd_configs = [{ 
            role: 'pod', 
            api_server: apiServerMatch ? apiServerMatch[1] : watchedConfigParam1 || 'YOUR_K8S_API_SERVER'
        }];
        if (watchedConfigParam2) baseConfig.kubernetes_sd_configs[0].bearer_token_file = "/path/to/token";
    } else if (targetsMatch) {
        const targets = targetsMatch[1].split(',').map(t => t.trim().replace(/'/g, ''));
        baseConfig.static_configs = [{ targets }];
    } else if (watchedConfigParam1) {
         baseConfig.static_configs = [{ targets: [watchedConfigParam1] }];
    }
    return baseConfig;
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
      configuration: generatedConfigObject,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      folderId: data.folderId === NO_FOLDER_VALUE ? undefined : data.folderId,
    };
    
    const savedAsset = addAsset(newAssetData);
    onSaveComplete(savedAsset);
  };

  const handleTestConnection = () => {
    alert("Mock Test Connection: Simulating validation...");
  };

  const handleDownloadYaml = () => {
    if (!generatedConfigStringForDisplay || generatedConfigStringForDisplay.startsWith('# Incomplete configuration')) {
      alert("Configuration is incomplete or invalid. Cannot download.");
      return;
    }

    const filename = `${watchedName?.toLowerCase().replace(/\s+/g, '_') || 'prometheus_config'}.yaml`;
    const blob = new Blob([generatedConfigStringForDisplay], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentConfigPlaceholders = watchedType ? assetTypeConfigPlaceholders[watchedType] : { param1: 'Primary Config Parameter', param2: 'Secondary Config Parameter' };
  const NO_FOLDER_VALUE = "___NO_FOLDER___";

  return (
    <>
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center font-headline text-2xl">
            <Sparkles className="w-6 h-6 mr-2 text-primary"/>
            New Asset Connection Wizard
        </div>
        <p className="text-sm text-muted-foreground mt-1">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}</p>
        <div className="w-full bg-muted rounded-full h-2.5 mt-3">
          <div className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${(currentStep / STEPS.length) * 100}%` }}></div>
        </div>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6 min-h-[300px] p-6 max-h-[calc(80vh-150px)] overflow-y-auto"> {/* Adjusted max-h slightly */}
          {currentStep === 1 && (
            <>
              <div>
                <Label htmlFor="name-wizard">Asset Name</Label>
                <Input id="name-wizard" {...form.register('name')} placeholder="e.g., Production Web Server" />
                {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="type-wizard">Asset Type</Label>
                <Controller
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="type-wizard">
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
                <Label htmlFor="folderId-wizard">Folder (Optional)</Label>
                 <Controller
                  name="folderId"
                  control={form.control}
                  render={({ field }) => (
                     <Select
                      onValueChange={(value) => field.onChange(value === NO_FOLDER_VALUE ? undefined : value)}
                      value={field.value || NO_FOLDER_VALUE}
                    >
                      <SelectTrigger id="folderId-wizard">
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
                <Label htmlFor="tags-wizard">Tags (Optional, comma-separated)</Label>
                <Input id="tags-wizard" {...form.register('tags')} placeholder="e.g., critical, web, production" />
              </div>
            </>
          )}
          {currentStep === 2 && (
            <>
              <h3 className="text-lg font-medium font-headline">Provide Configuration Details for: <span className="text-primary">{watchedType}</span></h3>
              <p className="text-sm text-muted-foreground mb-4">Enter the specific parameters required to connect to your '{watchedType}' asset.</p>
              <div>
                <Label htmlFor="config_param1-wizard">{currentConfigPlaceholders.param1.substring(0, currentConfigPlaceholders.param1.indexOf('(')-1) || 'Primary Config Value'}</Label>
                <Input id="config_param1-wizard" {...form.register('config_param1')} placeholder={currentConfigPlaceholders.param1} />
                 {form.formState.errors.config_param1 && <p className="text-sm text-destructive mt-1">{form.formState.errors.config_param1.message}</p>}
              </div>
              <div>
                <Label htmlFor="config_param2-wizard">{currentConfigPlaceholders.param2.substring(0, currentConfigPlaceholders.param2.indexOf('(')-1) || 'Secondary Config Value'}</Label>
                <Input id="config_param2-wizard" {...form.register('config_param2')} placeholder={currentConfigPlaceholders.param2} />
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
          {currentStep === 3 && ( 
            <>
              <h3 className="text-lg font-medium font-headline">Review, Download & Test</h3>
              <p className="text-sm text-muted-foreground mb-4">Ensure the generated configuration is correct, review connection steps, and download the YAML if needed.</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label className="font-semibold block mb-1.5">Connection Instructions for {watchedType}</Label>
                  <ScrollArea className="h-72 w-full rounded-md border p-3 bg-muted/20">
                    {instructionSteps.length > 0 ? (
                      <ol className="list-decimal list-inside space-y-3 text-sm">
                        {instructionSteps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-muted-foreground">No specific instructions for this asset type.</p>
                    )}
                  </ScrollArea>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <Label className="font-semibold">Prometheus Configuration</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleDownloadYaml} disabled={generatedConfigStringForDisplay.startsWith('# Incomplete configuration')}>
                      <Download className="mr-2 h-4 w-4" />
                      Download YAML
                    </Button>
                  </div>
                  <ScrollArea className="h-72 w-full rounded-md border p-2 bg-muted/30">
                    <pre className="text-xs font-code whitespace-pre-wrap">{generatedConfigStringForDisplay}</pre>
                  </ScrollArea>
                  <p className="text-xs text-muted-foreground mt-1">This is the content for your `prometheus.yml` file. The object stored internally will be the first job definition from `scrape_configs`.</p>
                </div>
              </div>
              
              <Button type="button" variant="outline" onClick={handleTestConnection} className="w-full mt-6">
                <TestTubeDiagonal className="mr-2 h-4 w-4" />
                Test Connection (Mock)
              </Button>
            </>
          )}
        </div>
        <div className="flex justify-between p-6 pt-4 border-t">
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
        </div>
      </form>
    </>
  );
}
