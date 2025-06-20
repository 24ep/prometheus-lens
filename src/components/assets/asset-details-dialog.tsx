
"use client";

import type { Asset } from '@/types';
import { mockAssetsData } from '@/lib/mock-data'; // For metadata, can be removed if not needed
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Edit, ExternalLink, X, PlusCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AssetDetailsDialogProps {
  asset: Asset | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaveTags: (assetId: string, tags: string[]) => void;
}

export function AssetDetailsDialog({ asset, isOpen, onOpenChange, onSaveTags }: AssetDetailsDialogProps) {
  const { toast } = useToast();
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (asset?.tags) {
      setCurrentTags([...asset.tags]);
    } else {
      setCurrentTags([]);
    }
  }, [asset]);

  if (!asset) return null;

  const handleAddTag = () => {
    if (tagInput.trim() === '') return;
    const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t !== '');
    const uniqueNewTags = newTags.filter(t => !currentTags.includes(t));
    if (uniqueNewTags.length > 0) {
      setCurrentTags(prev => [...prev, ...uniqueNewTags]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSaveChanges = () => {
    onSaveTags(asset.id, currentTags);
    onOpenChange(false); // Close dialog after saving
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <DialogTitle className="font-headline text-2xl">{asset.name}</DialogTitle>
              <DialogDescription className="text-base">{asset.type} Asset Details</DialogDescription>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button variant="outline" size="sm" disabled><Edit className="mr-2 h-4 w-4" />Edit Configuration</Button>
              {asset.grafanaLink && (
                <a href={asset.grafanaLink} target="_blank" rel="noopener noreferrer">
                  <Button size="sm"><ExternalLink className="mr-2 h-4 w-4" />Open in Grafana</Button>
                </a>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-180px)]">
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="p-4 rounded-lg border bg-card/50">
                  <h3 className="font-headline text-lg mb-2">Connection Status</h3>
                  <p>Status: <Badge variant={asset.status === 'connected' ? 'default' : asset.status === 'error' ? 'destructive' : 'secondary'} className="capitalize">{asset.status}</Badge></p>
                  <p className="mt-1 text-sm text-muted-foreground">Last Checked: {new Date(asset.lastChecked).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg border bg-card/50">
                  <h3 className="font-headline text-lg mb-2">Prometheus Configuration</h3>
                  <ScrollArea className="h-48 w-full rounded-md border p-3 bg-muted/20">
                      <pre className="text-xs font-code whitespace-pre-wrap">
                          {JSON.stringify({ scrape_configs: [asset.configuration] }, null, 2)}
                      </pre>
                  </ScrollArea>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-lg border bg-card/50">
                <h3 className="font-headline text-lg mb-3">Metadata</h3>
                <div className="space-y-1.5 text-sm">
                    <p><strong>ID:</strong> <span className="text-muted-foreground">{asset.id}</span></p>
                    <p><strong>Type:</strong> <span className="text-muted-foreground">{asset.type}</span></p>
                    {asset.folderId && <p><strong>Folder:</strong> <span className="text-muted-foreground">{mockAssetsData.find(f => f.id === asset.folderId)?.name || asset.folderId}</span></p>}
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card/50">
                <h3 className="font-headline text-lg mb-2">Tags</h3>
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
                    className="h-8 text-xs"
                    onKeyDown={(e) => { if (e.key === 'Enter') { handleAddTag(); e.preventDefault();}}}
                  />
                  <Button type="button" size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleAddTag} aria-label="Add tags">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                 <p className="text-xs text-muted-foreground mt-1.5">Press Enter or click '+' to add.</p>
              </div>

              <div className="p-4 rounded-lg border bg-card/50">
                  <h3 className="font-headline text-lg mb-2">Instructions</h3>
                  <p className="text-sm text-muted-foreground">Specific connection/troubleshooting instructions for '{asset.type}' assets would appear here.</p>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
