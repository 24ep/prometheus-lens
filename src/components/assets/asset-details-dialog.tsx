
"use client";

import type { Asset, AssetFolder } from '@/types';
import { mockFoldersData, updateAssetConfiguration } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, X, PlusCircle, Edit, Settings2, Info, Tag, ListChecks, FileText, Download, LinkIcon, BookOpen } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMockInstructions } from '@/lib/asset-utils';
import { EditAssetConfigurationDialog } from './edit-asset-configuration-dialog';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface AssetDetailsDialogProps {
  asset: Asset | null;
  allFolders: AssetFolder[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaveDetails: (assetId: string, details: { tags: string[], grafanaLink?: string }) => void;
  onConfigurationSave: (updatedAsset: Asset) => void;
}

export function AssetDetailsDialog({ asset, allFolders, isOpen, onOpenChange, onSaveDetails, onConfigurationSave }: AssetDetailsDialogProps) {
  const { toast } = useToast();
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [grafanaLinkInput, setGrafanaLinkInput] = useState('');
  const [isEditConfigOpen, setIsEditConfigOpen] = useState(false);
  const [currentAssetForEdit, setCurrentAssetForEdit] = useState<Asset | null>(null);

  useEffect(() => {
    if (asset) {
      setCurrentAssetForEdit(asset);
      setCurrentTags(asset.tags ? [...asset.tags] : []);
      setGrafanaLinkInput(asset.grafanaLink || '');
    } else {
      setCurrentTags([]);
      setGrafanaLinkInput('');
      setCurrentAssetForEdit(null);
    }
    setTagInput(''); 
  }, [asset, isOpen]);

  if (!asset) return null;

  const instructionSteps = getMockInstructions(asset.type);
  const folderName = asset.folderId ? allFolders.find(f => f.id === asset.folderId)?.name : 'N/A';

  const handleAddTag = () => {
    if (tagInput.trim() === '') return;
    const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t !== '' && !currentTags.includes(t));
    if (newTags.length > 0) {
      setCurrentTags(prev => [...prev, ...newTags].sort());
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSaveDetailsLocal = () => {
    onSaveDetails(asset.id, { tags: currentTags, grafanaLink: grafanaLinkInput.trim() });
    toast({ title: "Details Updated", description: `Details for ${asset.name} saved.` });
  };

  const handleOpenEditConfig = () => {
    setIsEditConfigOpen(true);
  };
  
  const handleSaveConfiguration = (assetId: string, newConfiguration: Record<string, any>) => {
    const updatedAsset = updateAssetConfiguration(assetId, newConfiguration);
    if (updatedAsset) {
      setCurrentAssetForEdit(updatedAsset); 
      onConfigurationSave(updatedAsset); 
      setGrafanaLinkInput(updatedAsset.grafanaLink || ''); 
      toast({ title: "Configuration Saved", description: `Configuration for ${updatedAsset.name} has been updated.` });
    } else {
      toast({ title: "Error", description: "Failed to save configuration.", variant: "destructive" });
    }
    setIsEditConfigOpen(false);
  };

  const handleDownloadYaml = () => {
    if (!currentAssetForEdit || !currentAssetForEdit.configuration) {
      toast({ title: "Error", description: "Asset configuration not available for download.", variant: "destructive"});
      return;
    }

    const filename = `${currentAssetForEdit.name.toLowerCase().replace(/\s+/g, '_') || 'prometheus_config'}.yaml`;
    const yamlContent = JSON.stringify({ scrape_configs: [currentAssetForEdit.configuration] }, null, 2);
    
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


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl p-0 h-[85vh] flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div>
                <DialogTitle className="font-headline text-2xl">{currentAssetForEdit?.name}</DialogTitle>
                <DialogDescription className="text-base">{currentAssetForEdit?.type} Asset</DialogDescription>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                {currentAssetForEdit?.grafanaLink ? (
                  <a href={currentAssetForEdit.grafanaLink} target="_blank" rel="noopener noreferrer">
                    <Button size="sm"><ExternalLink className="mr-2 h-4 w-4" />Open in Grafana</Button>
                  </a>
                ) : (
                   <Button size="sm" disabled><ExternalLink className="mr-2 h-4 w-4" />Grafana N/A</Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" orientation="vertical" className="flex-grow flex overflow-hidden p-6 pt-2 gap-6">
            <TabsList className="flex flex-col h-full w-1/4 justify-start items-stretch bg-muted/50 p-2 rounded-lg space-y-1">
              <TabsTrigger value="overview" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Info className="mr-2 h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="setup" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BookOpen className="mr-2 h-4 w-4" /> Setup Guide
              </TabsTrigger>
              <TabsTrigger value="metadata" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <ListChecks className="mr-2 h-4 w-4" /> Details & Links
              </TabsTrigger>
              <TabsTrigger value="tags" className="justify-start px-3 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Tag className="mr-2 h-4 w-4" /> Tags
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="w-3/4 pr-2">
              <TabsContent value="overview" className="mt-0 space-y-4">
                <div className="p-4 rounded-lg border bg-card/50">
                    <h3 className="font-headline text-lg mb-2">Connection Status</h3>
                    <div>Status: <Badge variant={currentAssetForEdit?.status === 'connected' ? 'default' : currentAssetForEdit?.status === 'error' ? 'destructive' : 'secondary'} className="capitalize">{currentAssetForEdit?.status}</Badge></div>
                    <p className="mt-1 text-sm text-muted-foreground">Last Checked: {currentAssetForEdit && new Date(currentAssetForEdit.lastChecked).toLocaleString()}</p>
                </div>
                 <div className="p-4 rounded-lg border bg-card/50">
                    <h3 className="font-headline text-lg mb-2">Key Metrics (Placeholder)</h3>
                    <p className="text-sm text-muted-foreground">Key performance indicators and metrics for this asset would appear here.</p>
                     <img src="https://placehold.co/400x200.png" alt="Placeholder metrics chart" data-ai-hint="chart graph" className="w-full h-auto rounded-md mt-2"/>
                </div>
              </TabsContent>

              <TabsContent value="setup" className="mt-0 space-y-6">
                <div className="p-4 rounded-lg border bg-card/50">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-primary"/>
                    <h3 className="font-headline text-lg">Connection Instructions</h3>
                  </div>
                  {instructionSteps.length > 0 ? (
                    <ScrollArea className="h-64 w-full rounded-md p-1">
                        <ol className="list-decimal list-inside space-y-4 text-sm">
                        {instructionSteps.map((step, index) => (
                            <li key={index} className="p-4 border rounded-lg bg-card shadow-sm" dangerouslySetInnerHTML={{ __html: step }}></li>
                        ))}
                        </ol>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific instructions available for this asset type.</p>
                  )}
                </div>
                
                <Separator />

                <div className="p-4 rounded-lg border bg-card/50">
                    <div className="flex flex-row justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-primary"/>
                            <h3 className="font-headline text-lg">Prometheus Configuration</h3>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleOpenEditConfig}>
                                <Edit className="mr-2 h-4 w-4"/>Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownloadYaml} disabled={!currentAssetForEdit?.configuration}>
                              <Download className="mr-2 h-4 w-4" />
                              YAML
                            </Button>
                        </div>
                    </div>
                    <ScrollArea className="h-60 w-full rounded-md border p-3 bg-muted/20">
                        <pre className="text-xs font-code whitespace-pre-wrap">
                            {currentAssetForEdit && JSON.stringify({ scrape_configs: [currentAssetForEdit.configuration] }, null, 2)}
                        </pre>
                    </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="mt-0 space-y-4">
                 <div className="p-4 rounded-lg border bg-card/50">
                    <h3 className="font-headline text-lg mb-3">Asset Details</h3>
                    <div className="space-y-1.5 text-sm">
                        <p><strong>ID:</strong> <span className="text-muted-foreground">{asset.id}</span></p>
                        <p><strong>Type:</strong> <span className="text-muted-foreground">{asset.type}</span></p>
                        <p><strong>Folder:</strong> <span className="text-muted-foreground">{folderName || 'Uncategorized'}</span></p>
                    </div>
                </div>
                <div className="p-4 rounded-lg border bg-card/50">
                    <h3 className="font-headline text-lg mb-2">Grafana Link</h3>
                    <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="grafanaLink"
                            value={grafanaLinkInput}
                            onChange={(e) => setGrafanaLinkInput(e.target.value)}
                            placeholder="https://grafana.example.com/d/..."
                            className="text-sm"
                        />
                    </div>
                     <p className="text-xs text-muted-foreground mt-1.5">Enter the full URL to the Grafana dashboard for this asset. Click 'Save Details' to persist.</p>
                </div>
              </TabsContent>

              <TabsContent value="tags" className="mt-0 space-y-4">
                <div className="p-4 rounded-lg border bg-card/50">
                  <h3 className="font-headline text-lg mb-2">Manage Tags</h3>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {currentTags.length > 0 ? currentTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="group text-xs pr-1.5">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="ml-1 opacity-50 group-hover:opacity-100 focus:opacity-100" aria-label={`Remove tag ${tag}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )) : <p className="text-xs text-muted-foreground italic">No tags assigned.</p>}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="text" 
                      value={tagInput} 
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag(s), comma-separated"
                      className="h-9 text-sm"
                      onKeyDown={(e) => { if (e.key === 'Enter') { handleAddTag(); e.preventDefault();}}}
                    />
                    <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={handleAddTag} aria-label="Add tags">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Press Enter or click '+' to add. Click 'Save Details' below to persist changes.</p>
                </div>
              </TabsContent>

            </ScrollArea>
          </Tabs>
        
          <DialogFooter className="p-6 pt-4 border-t mt-auto">
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveDetailsLocal}>Save Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {currentAssetForEdit && (
        <EditAssetConfigurationDialog
          asset={currentAssetForEdit}
          isOpen={isEditConfigOpen}
          onOpenChange={setIsEditConfigOpen}
          onSaveConfiguration={handleSaveConfiguration}
        />
      )}
    </>
  );
}
