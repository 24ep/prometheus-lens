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

export function ManageFolderDialog({ isOpen, onOpenChange, onSave, existingFolder, allFolders }: ManageFolderDialogProps) {
  const { toast } = useToast();
  const [folderName, setFolderName] = useState('');
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const NO_PARENT_VALUE = "___NO_PARENT___";


  useEffect(() => {
    if (existingFolder) {
      setFolderName(existingFolder.name);
      setParentId(existingFolder.parentId);
    } else {
      setFolderName('');
      setParentId(undefined);
    }
  }, [existingFolder, isOpen]); // Reset form when dialog opens or existingFolder changes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim() === '') {
      toast({ title: "Validation Error", description: "Folder name cannot be empty.", variant: "destructive" });
      return;
    }
    onSave({
      id: existingFolder?.id,
      name: folderName,
      parentId: parentId === NO_PARENT_VALUE ? undefined : parentId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glassmorphic">
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
              <Label htmlFor="folderName">Folder Name</Label>
              <Input 
                id="folderName" 
                value={folderName} 
                onChange={(e) => setFolderName(e.target.value)} 
                placeholder="e.g., Production Databases"
                required 
              />
            </div>
            <div>
              <Label htmlFor="parentId">Parent Folder (Optional)</Label>
              <Select
                value={parentId === undefined ? "" : parentId}
                onValueChange={(value) => setParentId(value === NO_PARENT_VALUE ? undefined : value)}
              >
                <SelectTrigger id="parentId">
                  <SelectValue placeholder="Select parent folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT_VALUE}>None (Root Level)</SelectItem>
                  {allFolders
                    .filter(folder => folder.id !== existingFolder?.id) // Cannot be its own parent
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
