
"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { mockAssetsData, mockFoldersData, updateAssetConfiguration as updateMockAssetConfiguration } from '@/lib/mock-data';
import type { Asset } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Edit, ExternalLink, TestTubeDiagonal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getMockInstructions } from '@/lib/asset-utils';
import { EditAssetConfigurationDialog } from '@/components/assets/edit-asset-configuration-dialog';
import { useToast } from '@/hooks/use-toast';

export default function AssetDetailsPage() {
  const params = useParams();
  const assetId = params.id as string;
  const { toast } = useToast();

  const [asset, setAsset] = useState<Asset | null | undefined>(undefined);
  const [isEditConfigOpen, setIsEditConfigOpen] = useState(false);

  useEffect(() => {
    const foundAsset = mockAssetsData.find(a => a.id === assetId);
    setAsset(foundAsset || null);
  }, [assetId]);

  const handleSaveConfiguration = (id: string, newConfiguration: Record<string, any>) => {
    const updatedAsset = updateMockAssetConfiguration(id, newConfiguration);
    if (updatedAsset) {
      setAsset(updatedAsset);
      toast({ title: "Configuration Saved", description: `Configuration for ${updatedAsset.name} has been updated.`});
    } else {
      toast({ title: "Error", description: "Failed to save configuration.", variant: "destructive"});
    }
    setIsEditConfigOpen(false);
  };

  const handleTestConnection = () => {
    alert("Mock Test Connection: Simulating validation for " + asset?.name);
  };
  
  if (asset === undefined) {
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
  const folder = asset.folderId ? mockFoldersData.find(f => f.id === asset.folderId) : null;

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
                        <CardTitle className="font-headline text-xl">Prometheus Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-48 w-full rounded-md border p-3 bg-muted/30">
                            <pre className="text-sm font-code whitespace-pre-wrap">
                                {JSON.stringify({ scrape_configs: [asset.configuration] }, null, 2)}
                            </pre>
                        </ScrollArea>
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
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {instructionSteps.length > 0 ? (
                            <ScrollArea className="h-60 w-full rounded-md p-1">
                                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground pl-1">
                                    {instructionSteps.map((step, index) => (
                                    <li key={index} dangerouslySetInnerHTML={{ __html: step.replace(/```yaml\n([\s\S]*?)\n```/g, '<pre class="bg-muted/50 p-2 rounded-md text-xs font-code my-1 whitespace-pre-wrap">$1</pre>').replace(/`([^`]+)`/g, '<code class="bg-muted/50 px-1 py-0.5 rounded-sm text-xs font-code">$1</code>') }}></li>
                                    ))}
                                </ol>
                            </ScrollArea>
                        ) : (
                            <p className="text-sm text-muted-foreground">No specific instructions available for this asset type.</p>
                        )}
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
