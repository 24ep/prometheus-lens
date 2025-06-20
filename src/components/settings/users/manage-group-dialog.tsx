
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { Group } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ManageGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (groupData: Omit<Group, 'id'> | Group) => void;
  existingGroup?: Group | null;
}

export function ManageGroupDialog({ isOpen, onOpenChange, onSave, existingGroup }: ManageGroupDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingGroup) {
        setName(existingGroup.name);
        setDescription(existingGroup.description || '');
      } else {
        setName('');
        setDescription('');
      }
    }
  }, [existingGroup, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') {
      toast({ title: "Validation Error", description: "Group name cannot be empty.", variant: "destructive" });
      return;
    }

    const groupData = {
      name,
      description,
    };

    if (existingGroup?.id) {
      onSave({ ...groupData, id: existingGroup.id });
    } else {
      onSave(groupData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">
              {existingGroup ? 'Edit Group' : 'Create New Group'}
            </DialogTitle>
            <DialogDescription>
              {existingGroup ? `Update details for group "${existingGroup.name}".` : 'Enter details for the new group.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input id="groupName" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="groupDescription">Description (Optional)</Label>
              <Textarea 
                id="groupDescription" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Briefly describe the purpose of this group"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{existingGroup ? 'Save Changes' : 'Create Group'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
