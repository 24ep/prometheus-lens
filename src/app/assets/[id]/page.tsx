
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { Asset, AssetFolder } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Edit, ExternalLink, TestTubeDiagonal, Download, Settings2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getMockInstructions } from '@/lib/asset-utils';
import { EditAssetConfigurationDialog } from '@/components/assets/edit-asset-configuration-dialog';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function AssetDetailsPage() {
  const params = useParams();
  const assetId = params.id as string;
  const { toast } = useToast();

  const [asset, setAsset] = useState<Asset | null | undefined>(undefined); // undefined for loading state
  const [folder, setFolder] = useState<AssetFolder | null>(null);
  const [isEditConfigOpen, setIsEditConfigOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssetAndFolderData = useCallback(async () => {
    setIsLoading(true);
    if (!assetId) {
        setAsset(null); // No ID, so no asset
        setIsLoading(false);
        return;
    }
    try {
      const assetRes = await fetch(`/api/assets/${assetId}`);
      if (!assetRes.ok) {
        if (assetRes.status === 404) {
          setAsset(null);
        } else {
          throw new Error(`Failed to fetch asset: ${assetRes.statusText}`);
        }
      } else {
        const fetchedAsset: Asset = await assetRes.json();
        setAsset(fetchedAsset);
        if (fetchedAsset.folderId) {
          const folderRes = await fetch(`/api/folders/${fetchedAsset.folderId}`);
          if (folderRes.ok) {
            const fetchedFolder: AssetFolder = await folderRes.json();
            setFolder(fetchedFolder);
          } else {
            console.warn(`Failed to fetch folder ${fetchedAsset.folderId}`);
            setFolder(null);
          }
        } else {
          setFolder(null);
        }
      }
    } catch (error) {
      console.error("Error fetching asset details:", error);
      toast({ title: "Error", description: `Could not load asset: ${(error as Error).message}`, variant: "destructive" });
      setAsset(null); // Error state
    } finally {
      setIsLoading(false);
    }
  }, [assetId, toast]);

  useEffect(() => {
    fetchAssetAndFolderData();
  }, [fetchAssetAndFolderData]);

  const handleSaveConfiguration = async (id: string, newConfiguration: Record<string, any>) => {
    try {
        const response = await fetch(`/api/assets/${id}/configuration`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newConfiguration),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to save configuration: ${response.statusText}`);
        }
        const updatedAsset: Asset = await response.json();
        setAsset(updatedAsset); // Update local state
        toast({ title: "Configuration Saved", description: `Configuration for ${updatedAsset.name} has been updated.`});
    } catch (error) {
        console.error("Error saving configuration:", error);
        toast({ title: "Error", description: (error as Error).message, variant: "destructive"});
    }
    setIsEditConfigOpen(false);
  };

  const handleTestConnection = () => {
    alert("Mock Test Connection: Simulating validation for " + asset?.name);
  };

  const handleDownloadYaml = () => {
    if (!asset || !asset.configuration) {
      toast({ title: "Error", description: "Asset configuration not available for download.", variant: "destructive"});
      return;
    }

    const filename = `${asset.name.toLowerCase().replace(/\s+/g, '_') || 'prometheus_config'}.yaml`;
    const yamlContent = JSON.stringify({ scrape_configs: [asset.configuration] }, null, 2);
    
    const blob = new Blob([yamlContent], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (isLoading || asset === undefined) { // Check for isLoading or initial undefined state
    return (
      <AppLayout>
        <div className="container mx-auto py-10 text-center">
          <p>Loading asset details...</p>
        </div>
      </AppLayout>
    );
  }

  if (!asset) {
    return (
      <AppLayout>
        <div className="container mx-auto py-10 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="font-headline">Asset Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">The asset you are looking for does not exist or could not be loaded.</p>
              <Link href="/">
                <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const instructionSteps = getMockInstructions(asset.type);

  return (
    <AppLayout>
      <div className="container mx-auto py-4">
         <div className="mb-6">
           <Link href="/">
             <Button variant="outline" size="sm" className="mb-4">
               <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
             </Button>
           </Link>
          <CardHeader className="px-0 pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div>
                    <CardTitle className="font-headline text-3xl">{asset.name}</CardTitle>
                    <CardDescription className="text-base">{asset.type} Asset Details</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    <Button variant="outline" onClick={() => setIsEditConfigOpen(true)}>
                        <Edit className="mr-2 h-4 w-4"/>Edit Configuration
                    </Button>
                     <Button variant="outline" onClick={handleTestConnection}>
                        <TestTubeDiagonal className="mr-2 h-4 w-4"/>Test Connection (Mock)
                    </Button>
                    {asset.grafanaLink && (
                         <a href={asset.grafanaLink} target="_blank" rel="noopener noreferrer">
                            <Button><ExternalLink className="mr-2 h-4 w-4"/>Open in Grafana</Button>
                         </a>
                    )}
                    {!asset.grafanaLink && (
                        <Button disabled><ExternalLink className="mr-2 h-4 w-4"/>Grafana N/A</Button>
                    )}
                </div>
            </div>
          </CardHeader>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Connection Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Status: <Badge variant={asset.status === 'connected' ? 'default' : asset.status === 'error' ? 'destructive' : 'secondary'} className="capitalize">{asset.status}</Badge></p>
                        <p className="mt-2">Last Checked: {new Date(asset.lastChecked).toLocaleString()}</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Setup & Configuration</CardTitle>
                        <CardDescription>Instructions to connect this asset and its current Prometheus configuration.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-5 w-5 text-primary"/>
                                <h3 className="font-headline text-lg">Connection Instructions</h3>
                            </div>
                            {instructionSteps.length > 0 ? (
                                <ScrollArea className="h-72 w-full rounded-md p-1">
                                    <div className="text-sm space-y-6">
                                        {instructionSteps.map((stepHtml, index) => (
                                        <React.Fragment key={index}>
                                            <div dangerouslySetInnerHTML={{ __html: stepHtml }} />
                                            {index < instructionSteps.length - 1 && <Separator className="my-4" />}
                                        </React.Fragment>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <p className="text-sm text-muted-foreground">No specific instructions available for this asset type.</p>
                            )}
                        </div>

                        <Separator />

                        <div>
                            <div className="flex flex-row justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <Settings2 className="h-5 w-5 text-primary"/>
                                    <h3 className="font-headline text-lg">Prometheus Configuration</h3>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleDownloadYaml} disabled={!asset.configuration}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download YAML
                                </Button>
                            </div>
                            <ScrollArea className="h-48 w-full rounded-md border p-3 bg-muted/30">
                                <pre className="text-sm font-code whitespace-pre-wrap">
                                    {JSON.stringify({ scrape_configs: [asset.configuration] }, null, 2)}
                                </pre>
                            </ScrollArea>
                             <Button variant="outline" size="sm" onClick={() => setIsEditConfigOpen(true)} className="mt-3">
                                <Edit className="mr-2 h-4 w-4"/>Edit Configuration
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p><strong>ID:</strong> {asset.id}</p>
                        <p><strong>Type:</strong> {asset.type}</p>
                        {folder && <p><strong>Folder:</strong> {folder.name}</p>}
                        {!asset.folderId && <p><strong>Folder:</strong> <span className="text-muted-foreground">Uncategorized</span></p>}
                        <div>
                            <strong>Tags:</strong>
                            {asset.tags && asset.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {asset.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                </div>
                            ) : (<span className="text-muted-foreground"> No tags</span>)
                            }
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
      {asset && (
        <EditAssetConfigurationDialog
            asset={asset}
            isOpen={isEditConfigOpen}
            onOpenChange={setIsEditConfigOpen}
            onSaveConfiguration={handleSaveConfiguration}
        />
      )}
    </AppLayout>
  );
}
