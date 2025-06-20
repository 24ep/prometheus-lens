
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { AssetFolder } from '@/types';
import { PlusCircle, Edit2, Trash2, Folder as FolderIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { ManageFolderDialog } from '@/components/folders/manage-folder-dialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SettingsFolderTreeItemProps {
  folder: AssetFolder;
  allFolders: AssetFolder[];
  level: number;
  onEditFolder: (folder: AssetFolder) => void;
  onDeleteFolder: (folder: AssetFolder) => void;
  initiallyOpen?: boolean;
}

const SettingsFolderTreeItem: React.FC<SettingsFolderTreeItemProps> = ({
  folder,
  allFolders,
  level,
  onEditFolder,
  onDeleteFolder,
  initiallyOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const childFolders = allFolders.filter(f => f.parentId === folder.id).sort((a,b) => a.name.localeCompare(b.name));
  const hasChildren = childFolders.length > 0;

  return (
    <div style={{ paddingLeft: `${level * 1.5}rem` }} className="my-1">
      <div className="flex justify-between items-center py-2 px-2 rounded-md hover:bg-muted/60 group">
         <div className="flex items-center gap-1.5 flex-grow min-w-0" onClick={() => hasChildren && setIsOpen(!isOpen)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && hasChildren && setIsOpen(!isOpen)}>
          {hasChildren ? (
            isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <div className="w-4 h-4 shrink-0"></div>
          )}
          <FolderIcon className="h-5 w-5 text-primary shrink-0" />
          <span className="font-medium truncate" title={folder.name}>{folder.name}</span>
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => onEditFolder(folder)} aria-label={`Edit folder ${folder.name}`}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDeleteFolder(folder)} aria-label={`Delete folder ${folder.name}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {isOpen && hasChildren && (
        <div className="mt-1 border-l-2 border-muted pl-3 ml-[7px]">
          {childFolders.map(child => (
            <SettingsFolderTreeItem
              key={child.id}
              folder={child}
              allFolders={allFolders}
              level={0} 
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              initiallyOpen={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};


export default function SettingsPage() {
  const { toast } = useToast();
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [isManageFolderDialogOpen, setIsManageFolderDialogOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<AssetFolder | null>(null);
  const [isConfirmDeleteFolderDialogOpen, setIsConfirmDeleteFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<AssetFolder | null>(null);

  const [defaultPrometheusUrl, setDefaultPrometheusUrl] = useState("http://localhost:9090");
  const [defaultScrapeInterval, setDefaultScrapeInterval] = useState("15s");


  const refreshFolders = useCallback(async () => {
    setIsLoadingFolders(true);
    try {
      const response = await fetch('/api/folders');
      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }
      const data: AssetFolder[] = await response.json();
      setFolders(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching folders:", error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      setFolders([]);
    } finally {
      setIsLoadingFolders(false);
    }
  }, [toast]);


  useEffect(() => {
    refreshFolders();
  }, [refreshFolders]);

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

  const handleSaveFolder = async (folderData: { id?: string; name: string; parentId?: string }) => {
    const url = folderData.id ? `/api/folders/${folderData.id}` : '/api/folders';
    const method = folderData.id ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderData.name, parentId: folderData.parentId }),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Failed to save folder');
      }
      const savedFolder: AssetFolder = await response.json();
      
      if (folderData.id) {
        setFolders(prev => prev.map(f => f.id === savedFolder.id ? savedFolder : f).sort((a,b) => a.name.localeCompare(b.name)));
        toast({ title: "Folder Updated", description: `Folder "${savedFolder.name}" saved.` });
      } else {
        setFolders(prev => [...prev, savedFolder].sort((a,b) => a.name.localeCompare(b.name)));
        toast({ title: "Folder Created", description: `Folder "${savedFolder.name}" added.` });
      }
    } catch (error) {
      console.error("Error saving folder:", error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
    setIsManageFolderDialogOpen(false);
    setFolderToEdit(null);
  };

  const confirmDeleteFolderAction = async () => {
    if (folderToDelete) {
       try {
        const response = await fetch(`/api/folders/${folderToDelete.id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorResult = await response.json();
          throw new Error(errorResult.error || "Could not delete folder.");
        }
        toast({ title: "Folder Deleted", description: `Folder "${folderToDelete.name}" removed.`});
        await refreshFolders(); // Re-fetch folders to update list and any parent/child relationships
      } catch (error) {
         console.error("Error deleting folder:", error);
         toast({ title: "Error", description: (error as Error).message, variant: "destructive"});
      }
    }
    setIsConfirmDeleteFolderDialogOpen(false);
    setFolderToDelete(null);
  };

  const rootFolders = useMemo(() => folders.filter(f => !f.parentId).sort((a,b) => a.name.localeCompare(b.name)), [folders]);

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
                    Enable dark theme across the application. (Handled by theme toggle in sidebar)
                  </span>
                </Label>
                <Switch id="darkModeToggle" aria-label="Toggle dark mode" disabled checked={typeof document !== 'undefined' && document.documentElement.classList.contains('dark')} />
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
                <Input id="defaultDashboardView" value="List View (Current Default)" disabled />
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
                <Input 
                  id="prometheusUrl" 
                  value={defaultPrometheusUrl}
                  onChange={(e) => setDefaultPrometheusUrl(e.target.value)}
                  placeholder="http://localhost:9090" 
                />
                 <p className="text-xs text-muted-foreground">Global fallback if not specified per asset.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultScrapeInterval">Default Scrape Interval</Label>
                <Input 
                  id="defaultScrapeInterval" 
                  value={defaultScrapeInterval}
                  onChange={(e) => setDefaultScrapeInterval(e.target.value)}
                  placeholder="e.g., 15s, 1m"
                />
                 <p className="text-xs text-muted-foreground">Global default scrape interval for assets (e.g., '15s', '1m'). Overridden by asset-specific configuration.</p>
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
              {isLoadingFolders ? (
                <p className="text-muted-foreground text-center py-4">Loading folders...</p>
              ) : folders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No folders created yet.</p>
              ) : (
                <ScrollArea className="h-80">
                  <div className="space-y-1 pr-2">
                    {rootFolders.map(folder => (
                      <SettingsFolderTreeItem
                        key={folder.id}
                        folder={folder}
                        allFolders={folders}
                        level={0}
                        onEditFolder={handleEditFolder}
                        onDeleteFolder={handleDeleteFolder}
                        initiallyOpen={true} 
                      />
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
