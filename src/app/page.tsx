"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { AssetCard } from '@/components/common/asset-card';
import { AssetListItem } from '@/components/common/asset-list-item';
import { mockAssetsData, mockFoldersData, addFolder, updateFolder, deleteFolder, updateAssetTags } from '@/lib/mock-data';
import type { Asset, AssetFolder } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, Filter, LayoutGrid, List, Edit2, Trash2, FolderPlus, PackagePlus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { AssetDetailsDialog } from '@/components/assets/asset-details-dialog';
import { CreateItemTypeDialog } from '@/components/folders/create-item-type-dialog';
import { ManageFolderDialog } from '@/components/folders/manage-folder-dialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Local state for mock data to reflect changes
  const [assets, setAssets] = useState<Asset[]>(mockAssetsData);
  const [folders, setFolders] = useState<AssetFolder[]>(mockFoldersData);

  // Dialog states
  const [isAssetDetailsDialogOpen, setIsAssetDetailsDialogOpen] = useState(false);
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState<Asset | null>(null);
  
  const [isCreateItemTypeDialogOpen, setIsCreateItemTypeDialogOpen] = useState(false);
  const [isManageFolderDialogOpen, setIsManageFolderDialogOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<AssetFolder | null>(null);
  const [isConfirmDeleteFolderDialogOpen, setIsConfirmDeleteFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<AssetFolder | null>(null);


  useEffect(() => {
    // This effect can be used to re-sync if mockData changes externally,
    // but for now, we manage 'assets' and 'folders' in local state.
    setAssets(mockAssetsData);
    setFolders(mockFoldersData);
  }, []);


  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesFolder = selectedFolderFilter === 'all' || asset.folderId === selectedFolderFilter || (selectedFolderFilter === 'unfiled' && !asset.folderId);
      return matchesSearch && matchesFolder;
    });
  }, [searchTerm, selectedFolderFilter, assets]);

  const assetsByFolder = useMemo(() => {
    if (selectedFolderFilter !== 'all') {
      const folderIdToFilter = selectedFolderFilter === 'unfiled' ? 'unfiled' : selectedFolderFilter;
      const folder = folderIdToFilter === 'unfiled' ? { id: 'unfiled', name: 'Uncategorized' } : folders.find(f => f.id === folderIdToFilter);
      return folder ? { [folder.id]: { name: folder.name, assets: filteredAssets, id: folder.id } } : {};
    }
    
    const grouped: Record<string, { name: string; id: string; assets: Asset[] }> = {};
    filteredAssets.forEach(asset => {
      const folderId = asset.folderId || 'unfiled';
      const folderName = folders.find(f => f.id === asset.folderId)?.name || 'Uncategorized';
      if (!grouped[folderId]) {
        grouped[folderId] = { name: folderName, id: folderId, assets: [] };
      }
      grouped[folderId].assets.push(asset);
    });
    // Ensure all folders (even empty ones) are shown if "All Folders" is selected
    if (selectedFolderFilter === 'all') {
      folders.forEach(folder => {
        if (!grouped[folder.id]) {
          grouped[folder.id] = { name: folder.name, id: folder.id, assets: [] };
        }
      });
      if (!grouped['unfiled']) {
         grouped['unfiled'] = { name: 'Uncategorized', id: 'unfiled', assets: [] };
      }
    }
    return grouped;
  }, [filteredAssets, selectedFolderFilter, folders]);

  const handleOpenAssetDetails = (asset: Asset) => {
    setSelectedAssetForDetails(asset);
    setIsAssetDetailsDialogOpen(true);
  };

  const handleSaveAssetTags = (assetId: string, newTags: string[]) => {
    const updatedAsset = updateAssetTags(assetId, newTags);
    if (updatedAsset) {
      setAssets(prevAssets => prevAssets.map(a => a.id === assetId ? updatedAsset : a));
      toast({ title: "Tags Updated", description: `Tags for ${updatedAsset.name} saved.` });
    }
  };

  const handleCreateItemTypeSelection = (type: 'asset' | 'folder') => {
    setIsCreateItemTypeDialogOpen(false);
    if (type === 'asset') {
      router.push('/assets/new');
    } else {
      setFolderToEdit(null); // Ensure it's a create operation
      setIsManageFolderDialogOpen(true);
    }
  };
  
  const handleSaveFolder = (folderData: { id?: string; name: string; parentId?: string }) => {
    if (folderData.id) { // Editing existing folder
      const updated = updateFolder(folderData.id, folderData.name);
      if (updated) {
        setFolders(prev => prev.map(f => f.id === updated.id ? updated : f));
        toast({ title: "Folder Updated", description: `Folder "${updated.name}" saved.`});
      }
    } else { // Creating new folder
      const newF = addFolder(folderData.name, folderData.parentId);
      setFolders(prev => [...prev, newF]);
      toast({ title: "Folder Created", description: `Folder "${newF.name}" added.`});
    }
    setIsManageFolderDialogOpen(false);
    setFolderToEdit(null);
  };

  const handleEditFolder = (folder: AssetFolder) => {
    setFolderToEdit(folder);
    setIsManageFolderDialogOpen(true);
  };

  const handleDeleteFolder = (folder: AssetFolder) => {
    setFolderToDelete(folder);
    setIsConfirmDeleteFolderDialogOpen(true);
  };

  const confirmDeleteFolder = () => {
    if (folderToDelete) {
      const success = deleteFolder(folderToDelete.id);
      if (success) {
        setFolders(prev => prev.filter(f => f.id !== folderToDelete.id));
        // Assets within the deleted folder become unfiled, so we need to refresh asset state
        setAssets(mockAssetsData.filter(_ => true)); // Re-fetch or re-filter assets
        toast({ title: "Folder Deleted", description: `Folder "${folderToDelete.name}" removed.`});
      } else {
        toast({ title: "Error", description: "Could not delete folder.", variant: "destructive"});
      }
    }
    setIsConfirmDeleteFolderDialogOpen(false);
    setFolderToDelete(null);
  };

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Asset Dashboard</h1>
          <p className="text-muted-foreground">Overview of your monitored assets and folders.</p>
        </div>
        <Button onClick={() => setIsCreateItemTypeDialogOpen(true)}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Item
        </Button>
      </div>

      <div className="mb-6 p-4 rounded-lg glassmorphic">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
          <Input 
            placeholder="Search assets (name, type, tag)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background/70 focus:bg-background"
          />
          <Select value={selectedFolderFilter} onValueChange={setSelectedFolderFilter}>
            <SelectTrigger className="w-full md:w-auto bg-background/70 focus:bg-background">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by folder..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              {folders.map(folder => (
                <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
              ))}
              <SelectItem value="unfiled">Uncategorized</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-start md:justify-end">
            <Button 
              variant={viewMode === 'list' ? "default" : "outline"} 
              size="icon" 
              onClick={() => setViewMode('list')} 
              className="mr-2"
              aria-label="List view"
            >
              <List className="h-5 w-5"/>
            </Button>
            <Button 
              variant={viewMode === 'grid' ? "default" : "outline"} 
              size="icon" 
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-5 w-5"/>
            </Button>
          </div>
        </div>
      </div>
      
      {Object.entries(assetsByFolder).length === 0 && (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground font-semibold">No assets or folders found.</p>
          <p className="text-muted-foreground">Try adjusting your filters or add a new item.</p>
        </div>
      )}

      {Object.entries(assetsByFolder).map(([folderId, group]) => (
        <div key={folderId} className="mb-8">
          {selectedFolderFilter === 'all' && (
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-border/50">
              <h2 className="text-2xl font-headline font-semibold text-foreground">{group.name} ({group.assets.length})</h2>
              {group.id !== 'unfiled' && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditFolder(folders.find(f=>f.id === group.id)!)} aria-label="Edit folder">
                    <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteFolder(folders.find(f=>f.id === group.id)!)} aria-label="Delete folder">
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          )}
          {group.assets.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {group.assets.map(asset => (
                  <AssetCard key={asset.id} asset={asset} onDetailsClick={handleOpenAssetDetails} />
                ))}
              </div>
            ) : (
              <div className="space-y-3 border border-border/50 rounded-lg p-3 glassmorphic">
                {group.assets.map(asset => (
                  <AssetListItem key={asset.id} asset={asset} onDetailsClick={handleOpenAssetDetails} />
                ))}
              </div>
            )
          ) : (
             selectedFolderFilter !== 'all' && ( 
              <div className="text-center py-6">
                <p className="text-lg text-muted-foreground">No assets in this folder matching your search.</p>
              </div>
             )
          )}
           {selectedFolderFilter === 'all' && group.assets.length === 0 && (
             <div className="text-sm text-center py-4 text-muted-foreground">This folder is empty.</div>
           )}
        </div>
      ))}

      {selectedAssetForDetails && (
        <AssetDetailsDialog
          asset={selectedAssetForDetails}
          isOpen={isAssetDetailsDialogOpen}
          onOpenChange={setIsAssetDetailsDialogOpen}
          onSaveTags={handleSaveAssetTags}
        />
      )}

      <CreateItemTypeDialog
        isOpen={isCreateItemTypeDialogOpen}
        onOpenChange={setIsCreateItemTypeDialogOpen}
        onSelectType={handleCreateItemTypeSelection}
      />

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
          onConfirm={confirmDeleteFolder}
          title={`Delete Folder: ${folderToDelete.name}`}
          description="Are you sure you want to delete this folder? Assets in this folder will become uncategorized. This action cannot be undone."
        />
      )}

    </AppLayout>
  );
}
