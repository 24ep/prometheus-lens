
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { User, Group, Permission } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { availablePermissions } from '@/lib/mock-data'; // Import available permissions
import { ScrollArea } from '@/components/ui/scroll-area';

interface ManageUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (userData: Omit<User, 'id'> | User) => void;
  existingUser?: User | null;
  allGroups: Group[];
}

export function ManageUserDialog({ isOpen, onOpenChange, onSave, existingUser, allGroups }: ManageUserDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<User['role']>('Viewer');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (existingUser) {
        setName(existingUser.name);
        setEmail(existingUser.email);
        setRole(existingUser.role);
        setSelectedGroupIds(existingUser.groupIds || []);
        setSelectedPermissionIds(existingUser.permissionIds || []);
      } else {
        setName('');
        setEmail('');
        setRole('Viewer');
        setSelectedGroupIds([]);
        setSelectedPermissionIds([]);
      }
    }
  }, [existingUser, isOpen]);

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissionIds(prev =>
      prev.includes(permissionId) ? prev.filter(id => id !== permissionId) : [...prev, permissionId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '' || email.trim() === '') {
      toast({ title: "Validation Error", description: "Name and email cannot be empty.", variant: "destructive" });
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
        toast({ title: "Validation Error", description: "Please enter a valid email address.", variant: "destructive" });
        return;
    }

    const userData = {
      name,
      email,
      role,
      groupIds: selectedGroupIds,
      permissionIds: selectedPermissionIds, // Include permissions
    };

    if (existingUser?.id) {
      onSave({ ...userData, id: existingUser.id });
    } else {
      onSave(userData);
    }
    onOpenChange(false); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">
              {existingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {existingUser ? `Update details for ${existingUser.name}.` : 'Enter details for the new user.'}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] py-4 pr-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="userName">Name</Label>
                <Input id="userName" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="userEmail">Email</Label>
                <Input id="userEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="userRole">Role</Label>
                <Select value={role} onValueChange={(value: User['role']) => setRole(value)}>
                  <SelectTrigger id="userRole">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Editor">Editor</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {allGroups.length > 0 && (
                <div>
                  <Label>Member of Groups</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto rounded-md border p-2">
                    {allGroups.map(group => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={selectedGroupIds.includes(group.id)}
                          onCheckedChange={() => handleGroupToggle(group.id)}
                        />
                        <Label htmlFor={`group-${group.id}`} className="font-normal">{group.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label>Permissions</Label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto rounded-md border p-2">
                  {availablePermissions.map((permission: Permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={selectedPermissionIds.includes(permission.id)}
                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                        className="mt-1" // Align checkbox with the first line of text
                      />
                      <div className="flex flex-col">
                        <Label htmlFor={`permission-${permission.id}`} className="font-normal leading-snug">{permission.name}</Label>
                        <p className="text-xs text-muted-foreground leading-snug">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{existingUser ? 'Save Changes' : 'Add User'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
