
"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { mockFoldersData, addFolder, updateFolder as updateMockFolder, deleteFolder as deleteMockFolderFromData } from '@/lib/mock-data';
import type { AssetFolder } from '@/types';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { ManageFolderDialog } from '@/components/folders/manage-folder-dialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SettingsPage() {
  const { toast } = useToast();
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [isManageFolderDialogOpen, setIsManageFolderDialogOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<AssetFolder | null>(null);
  const [isConfirmDeleteFolderDialogOpen, setIsConfirmDeleteFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<AssetFolder | null>(null);

  const refreshFolders = () => {
    setFolders([...mockFoldersData].sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => {
    refreshFolders();
  }, []);

  const handleCreateFolder = () => {
    setFolderToEdit(null);
    setIsManageFolderDialogOpen(true);
  };

  const handleEditFolder = (folder: AssetFolder) => {
    setFolderToEdit(folder);
    setIsManageFolderDialogOpen(true);
  };

  const handleDeleteFolder = (folder: AssetFolder) => {
    setFolderToDelete(folder);
    setIsConfirmDeleteFolderDialogOpen(true);
  };

  const handleSaveFolder = (folderData: { id?: string; name: string; parentId?: string }) => {
    if (folderData.id) {
      const updated = updateMockFolder(folderData.id, folderData.name, folderData.parentId);
      if (updated) {
        toast({ title: "Folder Updated", description: `Folder "${updated.name}" saved.` });
      }
    } else {
      const newF = addFolder(folderData.name, folderData.parentId);
      toast({ title: "Folder Created", description: `Folder "${newF.name}" added.` });
    }
    refreshFolders();
    setIsManageFolderDialogOpen(false);
    setFolderToEdit(null);
  };

  const confirmDeleteFolderAction = () => {
    if (folderToDelete) {
      const success = deleteMockFolderFromData(folderToDelete.id);
      if (success) {
        toast({ title: "Folder Deleted", description: `Folder "${folderToDelete.name}" removed.` });
        refreshFolders();
      } else {
        toast({ title: "Error", description: "Could not delete folder.", variant: "destructive" });
      }
    }
    setIsConfirmDeleteFolderDialogOpen(false);
    setFolderToDelete(null);
  };


  return (
    <AppLayout>
      <div className="container mx-auto py-4">
        <CardHeader className="px-0 pb-4">
          <CardTitle className="font-headline text-3xl">Settings</CardTitle>
          <CardDescription>Manage your application preferences and configurations.</CardDescription>
        </CardHeader>
        
        <div className="space-y-8">
          <Card className="glassmorphic">
            <CardHeader>
              <CardTitle className="font-headline text-xl">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appName">Application Name</Label>
                <Input id="appName" defaultValue="Prometheus Lens" disabled />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="darkModeToggle" className="flex flex-col space-y-1">
                  <span>Dark Mode</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Enable dark theme across the application. (UI Mock)
                  </span>
                </Label>
                <Switch id="darkModeToggle" aria-label="Toggle dark mode" />
              </div>
               <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
                  <span>Email Notifications</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Receive email updates for critical alerts.
                  </span>
                </Label>
                <Switch id="emailNotifications" checked aria-label="Toggle email notifications" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultDashboardView">Default Dashboard View</Label>
                <Input id="defaultDashboardView" value="Grid View" disabled /> 
                <p className="text-xs text-muted-foreground">This setting is currently illustrative.</p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-[hsl(var(--glass-border-light))] pt-6">
                <Button disabled>Save General Settings</Button>
            </CardFooter>
          </Card>

          <Card className="glassmorphic">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Prometheus Integration</CardTitle>
              <CardDescription>Configure global Prometheus settings if applicable.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                <Label htmlFor="prometheusUrl">Default Prometheus URL (Optional)</Label>
                <Input id="prometheusUrl" placeholder="http://localhost:9090" />
                 <p className="text-xs text-muted-foreground">Global fallback if not specified per asset.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultScrapeInterval">Default Scrape Interval</Label>
                <Input id="defaultScrapeInterval" defaultValue="15s" />
              </div>
            </CardContent>
             <CardFooter className="border-t border-[hsl(var(--glass-border-light))] pt-6">
                <Button disabled>Save Integration Settings</Button>
            </CardFooter>
          </Card>
          
          <Card className="glassmorphic">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="font-headline text-xl">Manage Asset Folders</CardTitle>
                <CardDescription>Organize your assets by creating and managing folders.</CardDescription>
              </div>
              <Button onClick={handleCreateFolder}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Folder
              </Button>
            </CardHeader>
            <CardContent>
              {folders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No folders created yet.</p>
              ) : (
                <ScrollArea className="h-72">
                  <div className="space-y-3 pr-3">
                    {folders.map(folder => (
                      <div key={folder.id} className="flex items-center justify-between p-3 border rounded-md bg-background/50">
                        <div>
                          <p className="font-medium">{folder.name}</p>
                          {folder.parentId && (
                            <p className="text-xs text-muted-foreground">
                              Parent: {folders.find(f => f.id === folder.parentId)?.name || 'N/A'}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEditFolder(folder)} aria-label={`Edit folder ${folder.name}`}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteFolder(folder)} aria-label={`Delete folder ${folder.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

           <Card className="glassmorphic">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Account Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">User profile, password changes, and security settings would appear here.</p>
              <Button variant="outline" disabled>Change Password</Button>
              <Button variant="destructive" disabled className="ml-2">Delete Account</Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <ManageFolderDialog
        isOpen={isManageFolderDialogOpen}
        onOpenChange={setIsManageFolderDialogOpen}
        onSave={handleSaveFolder}
        existingFolder={folderToEdit}
        allFolders={folders}
      />
      {folderToDelete && (
        <ConfirmDialog
          isOpen={isConfirmDeleteFolderDialogOpen}
          onOpenChange={setIsConfirmDeleteFolderDialogOpen}
          onConfirm={confirmDeleteFolderAction}
          title={`Delete Folder: ${folderToDelete.name}`}
          description="Are you sure you want to delete this folder? Assets in this folder will become uncategorized. This action cannot be undone."
        />
      )}
    </AppLayout>
  );
}
