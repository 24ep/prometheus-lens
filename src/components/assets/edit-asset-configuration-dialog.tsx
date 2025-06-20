
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Asset } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

interface EditAssetConfigurationDialogProps {
  asset: Asset | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaveConfiguration: (assetId: string, newConfiguration: Record<string, any>) => void;
}

export function EditAssetConfigurationDialog({ asset, isOpen, onOpenChange, onSaveConfiguration }: EditAssetConfigurationDialogProps) {
  const { toast } = useToast();
  const [configString, setConfigString] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (asset?.configuration) {
      try {
        setConfigString(JSON.stringify({ scrape_configs: [asset.configuration] }, null, 2));
        setParseError(null);
      } catch (error) {
        setConfigString('Error stringifying configuration.');
        setParseError('Could not stringify existing configuration.');
      }
    } else {
      setConfigString('');
    }
  }, [asset, isOpen]); // Rerun when asset changes or dialog opens

  if (!asset) return null;

  const handleSave = () => {
    let newConfigObject;
    try {
      const parsedRoot = JSON.parse(configString);
      if (parsedRoot.scrape_configs && Array.isArray(parsedRoot.scrape_configs) && parsedRoot.scrape_configs.length > 0) {
        newConfigObject = parsedRoot.scrape_configs[0]; // We store only the first scrape_config object
      } else {
         // If it's not in the expected wrapped format, assume the user provided the direct config object
        newConfigObject = parsedRoot;
      }
      setParseError(null);
    } catch (error) {
      const typedError = error as Error;
      setParseError(`Invalid JSON: ${typedError.message}`);
      toast({
        title: "Validation Error",
        description: `Configuration is not valid JSON. ${typedError.message}`,
        variant: "destructive",
      });
      return;
    }

    onSaveConfiguration(asset.id, newConfigObject);
    toast({
      title: "Configuration Updated",
      description: `Configuration for ${asset.name} saved successfully.`,
    });
    onOpenChange(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfigString(e.target.value);
    // Optionally, clear parse error on type to give user immediate feedback possibility
    if (parseError) {
        try {
            JSON.parse(e.target.value);
            setParseError(null);
        } catch (error) {
            // Keep existing error or set a new one if it becomes invalid again
            const typedError = error as Error;
            setParseError(`Invalid JSON: ${typedError.message}`);
        }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Edit Configuration: {asset.name}</DialogTitle>
          <DialogDescription>
            Modify the Prometheus scrape configuration for this asset (JSON format).
            The top-level key should typically be `scrape_configs` containing an array of job definitions.
            For simplicity, this editor modifies the first job definition within `scrape_configs`.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          <div>
            <Label htmlFor="configJson" className="sr-only">Configuration JSON</Label>
            <ScrollArea className="h-72 w-full rounded-md border">
              <Textarea 
                id="configJson"
                value={configString}
                onChange={handleTextChange}
                placeholder={`{\n  "scrape_configs": [\n    {\n      "job_name": "${asset.name.toLowerCase().replace(/\s+/g, '_')}",\n      "static_configs": [\n        {\n          "targets": ["localhost:9100"]\n        }\n      ]\n    }\n  ]\n}`}
                className="min-h-[280px] text-xs font-code resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </ScrollArea>
          </div>
          {parseError && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>JSON Parsing Error</AlertTitle>
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={!!parseError}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
