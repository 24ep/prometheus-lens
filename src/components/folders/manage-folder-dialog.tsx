"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AssetFolder } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ManageFolderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (folderData: { id?: string; name: string; parentId?: string }) => void;
  existingFolder?: AssetFolder | null;
  allFolders: AssetFolder[];
}

async function reloadPrometheusConfig(toast) {
  try {
    const res = await fetch('/api/prometheus/reload', { method: 'POST' });
    if (!res.ok) {
      const data = await res.json();
      toast && toast({ title: "Prometheus Reload Failed", description: data.error || "Unknown error", variant: "destructive" });
      return false;
    }
    toast && toast({ title: "Prometheus Reloaded", description: "Configuration updated and Prometheus reloaded." });
    return true;
  } catch (error) {
    toast && toast({ title: "Prometheus Reload Error", description: error.message, variant: "destructive" });
    return false;
  }
}

export function ManageFolderDialog({ isOpen, onOpenChange, onSave, existingFolder, allFolders }: ManageFolderDialogProps) {
  const { toast } = useToast();
  const [folderName, setFolderName] = useState('');
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const NO_PARENT_VALUE = "___NO_PARENT___";


  useEffect(() => {
    if (isOpen) { // Only reset/set when dialog becomes visible or existingFolder changes
      if (existingFolder) {
        setFolderName(existingFolder.name);
        setParentId(existingFolder.parentId);
      } else {
        setFolderName('');
        setParentId(undefined);
      }
    }
  }, [existingFolder, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim() === '') {
      toast({ title: "Validation Error", description: "Folder name cannot be empty.", variant: "destructive" });
      return;
    }
    // Prevent circular dependency for parentId
    if (existingFolder && parentId === existingFolder.id) {
        toast({ title: "Validation Error", description: "A folder cannot be its own parent.", variant: "destructive" });
        return;
    }

    // Check for potential deeper circular dependencies (simplified check)
    let currentParent = parentId;
    const visited = new Set<string>();
    if (existingFolder) visited.add(existingFolder.id);

    while(currentParent) {
        if (visited.has(currentParent)) {
            toast({ title: "Validation Error", description: "Circular parent folder dependency detected.", variant: "destructive" });
            return;
        }
        visited.add(currentParent);
        const parentFolder = allFolders.find(f => f.id === currentParent);
        currentParent = parentFolder?.parentId;
    }


    onSave({
      id: existingFolder?.id,
      name: folderName,
      parentId: parentId === NO_PARENT_VALUE ? undefined : parentId,
    });
    await reloadPrometheusConfig(toast);
    onOpenChange(false); // Close dialog after saving
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) { // Reset form if dialog is closed by clicking outside or Esc
            setFolderName(existingFolder?.name || '');
            setParentId(existingFolder?.parentId);
        }
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">
              {existingFolder ? 'Edit Folder' : 'Create New Folder'}
            </DialogTitle>
            <DialogDescription>
              {existingFolder ? `Update the details for "${existingFolder.name}".` : 'Enter details for the new folder.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="folderNameDialog">Folder Name</Label> {/* Changed id to avoid conflict */}
              <Input 
                id="folderNameDialog" 
                value={folderName} 
                onChange={(e) => setFolderName(e.target.value)} 
                placeholder="e.g., Production Databases"
                required 
              />
            </div>
            <div>
              <Label htmlFor="parentIdDialog">Parent Folder (Optional)</Label> {/* Changed id */}
              <Select
                value={parentId || NO_PARENT_VALUE} // Ensure NO_PARENT_VALUE is used if parentId is undefined
                onValueChange={(value) => setParentId(value === NO_PARENT_VALUE ? undefined : value)}
              >
                <SelectTrigger id="parentIdDialog">
                  <SelectValue placeholder="Select parent folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT_VALUE}>None (Root Level)</SelectItem>
                  {allFolders
                    .filter(folder => folder.id !== existingFolder?.id) // Cannot be its own parent
                    // Add more sophisticated check to prevent circular dependencies if nesting is deep
                    .sort((a,b) => a.name.localeCompare(b.name))
                    .map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{existingFolder ? 'Save Changes' : 'Create Folder'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

