"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { mockAssetsData } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Edit, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AssetDetailsPage() {
  const params = useParams();
  const assetId = params.id as string;

  // In a real app, fetch asset data here based on assetId
  const asset = mockAssetsData.find(a => a.id === assetId);

  if (!asset) {
    return (
      <AppLayout>
        <div className="container mx-auto py-10 text-center">
          <Card className="max-w-md mx-auto glassmorphic">
            <CardHeader>
              <CardTitle className="font-headline">Asset Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">The asset you are looking for does not exist or could not be loaded.</p>
              <Link href="/" passHref>
                <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-4">
         <div className="mb-6">
           <Link href="/" passHref>
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
                <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button variant="outline"><Edit className="mr-2 h-4 w-4"/>Edit Configuration</Button>
                    {asset.grafanaLink && (
                         <a href={asset.grafanaLink} target="_blank" rel="noopener noreferrer">
                            <Button><ExternalLink className="mr-2 h-4 w-4"/>Open in Grafana</Button>
                         </a>
                    )}
                </div>
            </div>
          </CardHeader>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card className="glassmorphic">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Connection Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Status: <Badge variant={asset.status === 'connected' ? 'default' : asset.status === 'error' ? 'destructive' : 'secondary'} className="capitalize">{asset.status}</Badge></p>
                        <p className="mt-2">Last Checked: {new Date(asset.lastChecked).toLocaleString()}</p>
                    </CardContent>
                </Card>
                 <Card className="glassmorphic">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Prometheus Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-60 w-full rounded-md border p-3 bg-muted/30">
                            <pre className="text-sm font-code whitespace-pre-wrap">
                                {JSON.stringify({ scrape_configs: [asset.configuration] }, null, 2)}
                            </pre>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card className="glassmorphic">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p><strong>ID:</strong> {asset.id}</p>
                        <p><strong>Type:</strong> {asset.type}</p>
                        {asset.folderId && <p><strong>Folder:</strong> {mockAssetsData.find(f => f.id === asset.folderId)?.name || asset.folderId}</p>}
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
                <Card className="glassmorphic">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Specific connection/troubleshooting instructions for '{asset.type}' assets would appear here.</p>
                        {/* Example: <p>Ensure Node Exporter is running on port 9100.</p> */}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
