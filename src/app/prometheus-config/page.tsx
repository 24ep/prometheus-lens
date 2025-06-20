
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Asset } from '@/types';
import { Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PrometheusConfigPage() {
  const { toast } = useToast();
  const [aggregatedConfigString, setAggregatedConfigString] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssetConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/assets');
      if (!response.ok) {
        throw new Error('Failed to fetch asset configurations');
      }
      const assetsData: Asset[] = await response.json();

      const validConfigs = assetsData
        .filter(asset => asset.configuration && Object.keys(asset.configuration).length > 0)
        .map(asset => asset.configuration);

      const fullConfig = {
        scrape_configs: validConfigs,
      };

      setAggregatedConfigString(JSON.stringify(fullConfig, null, 2));
    } catch (error) {
      console.error("Error fetching asset configs:", error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      setAggregatedConfigString("Error loading configurations.");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAssetConfigs();
  }, [fetchAssetConfigs]);

  const handleDownloadYaml = () => {
    if (!aggregatedConfigString || aggregatedConfigString.startsWith("Error loading")) {
      toast({ title: "Error", description: "No configuration available to download.", variant: "destructive"});
      return;
    }

    const filename = 'prometheus_full_config.yml';
    const blob = new Blob([aggregatedConfigString], { type: 'application/json' }); 
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download Started", description: "Full configuration YAML downloaded." });
  };

  const handleCopyToClipboard = () => {
    if (!aggregatedConfigString || aggregatedConfigString.startsWith("Error loading")) {
      toast({ title: "Error", description: "No configuration to copy.", variant: "destructive"});
      return;
    }
    navigator.clipboard.writeText(aggregatedConfigString)
      .then(() => {
        toast({ title: "Copied to Clipboard", description: "Configuration copied." });
      })
      .catch(err => {
        toast({ title: "Error", description: "Failed to copy configuration.", variant: "destructive"});
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold text-foreground">Aggregated Prometheus Configuration</h1>
        <p className="text-muted-foreground">
          This page displays a combined JSON representation of the <code>scrape_configs</code> for all your managed assets.
          You can use this to help build your <code>prometheus.yml</code> file.
        </p>
      </div>

      <Card className="glassmorphic">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
                <CardTitle className="font-headline text-xl">Full Scrape Configuration</CardTitle>
                <CardDescription>Review and use the combined configuration below.</CardDescription>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button variant="outline" onClick={handleCopyToClipboard} disabled={isLoading || !aggregatedConfigString || aggregatedConfigString.startsWith("Error loading")}>
                <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
              </Button>
              <Button onClick={handleDownloadYaml} disabled={isLoading || !aggregatedConfigString || aggregatedConfigString.startsWith("Error loading")}>
                <Download className="mr-2 h-4 w-4" /> Download Full YAML
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-var(--header-height,4rem)-22rem)] md:h-[500px] w-full rounded-md border p-3 bg-muted/30">
            <pre className="text-sm font-code whitespace-pre-wrap">
              {isLoading ? "Loading configurations..." : (aggregatedConfigString || "No asset configurations found or processed.")}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
