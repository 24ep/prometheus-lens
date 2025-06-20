
"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FolderPlus, PackagePlus } from 'lucide-react';

interface CreateItemTypeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectType: (type: 'asset' | 'folder') => void;
}

export function CreateItemTypeDialog({ isOpen, onOpenChange, onSelectType }: CreateItemTypeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Create New Item</DialogTitle>
          <DialogDescription>
            What would you like to create?
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button variant="outline" className="h-24 flex-col" onClick={() => onSelectType('asset')}>
            <PackagePlus className="h-8 w-8 mb-2 text-primary" />
            New Asset
          </Button>
          <Button variant="outline" className="h-24 flex-col" onClick={() => onSelectType('folder')}>
            <FolderPlus className="h-8 w-8 mb-2 text-primary" />
            New Folder
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
