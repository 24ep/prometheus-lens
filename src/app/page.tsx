
"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { AssetListItem } from '@/components/common/asset-list-item';
import { mockAssetsData, mockFoldersData, addFolder, updateFolder as updateMockFolder, deleteFolder, updateAssetTags } from '@/lib/mock-data';
import type { Asset, AssetFolder } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Filter, Edit2, Trash2, Folder as FolderIcon, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { AssetDetailsDialog } from '@/components/assets/asset-details-dialog';
import { CreateItemTypeDialog } from '@/components/folders/create-item-type-dialog';
import { ManageFolderDialog } from '@/components/folders/manage-folder-dialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AssetConnectionWizard } from '@/components/assets/asset-connection-wizard';
import { cn } from '@/lib/utils';

interface FolderTreeItemProps {
  folder: AssetFolder;
  allFolders: AssetFolder[];
  level: number;
  assetsInFolder: Asset[];
  onEditFolder: (folder: AssetFolder) => void;
  onDeleteFolder: (folder: AssetFolder) => void;
  onAssetDetailsClick: (asset: Asset) => void;
  initiallyOpen?: boolean;
}

const FolderTreeItem: React.FC<FolderTreeItemProps> = ({
  folder,
  allFolders,
  level,
  assetsInFolder,
  onEditFolder,
  onDeleteFolder,
  onAssetDetailsClick,
  initiallyOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const childFolders = allFolders.filter(f => f.parentId === folder.id).sort((a,b) => a.name.localeCompare(b.name));

  const hasContent = assetsInFolder.length > 0 || childFolders.length > 0;

  return (
    <div style={{ paddingLeft: `${level * 1.5}rem` }} className="my-1">
      <div className="flex justify-between items-center py-2 px-2 rounded-md hover:bg-muted/60 group">
        <div className="flex items-center gap-1.5 flex-grow min-w-0" onClick={() => hasContent && setIsOpen(!isOpen)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && hasContent && setIsOpen(!isOpen)} >
          {hasContent ? (
            isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <div className="w-4 h-4 shrink-0"></div> // Placeholder for alignment
          )}
          <FolderIcon className="h-5 w-5 text-primary shrink-0" />
          <span className="font-headline font-medium text-lg truncate" title={folder.name}>{folder.name}</span>
          <span className="text-sm text-muted-foreground ml-1">({assetsInFolder.length})</span>
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => onEditFolder(folder)} aria-label={`Edit folder ${folder.name}`}>
            <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDeleteFolder(folder)} aria-label={`Delete folder ${folder.name}`}>
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
      {isOpen && (
        <div className="mt-1 border-l-2 border-muted pl-3 ml-[7px]"> {/* Indent content under folder icon */}
          {childFolders.map(child => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              allFolders={allFolders}
              level={0} // Child folders are visually indented, level 0 for their own asset/subfolder block
              assetsInFolder={allFolders.flatMap(f => f.parentId === child.id ? [] : mockAssetsData.filter(a => a.folderId === child.id))} // simplification
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onAssetDetailsClick={onAssetDetailsClick}
              initiallyOpen={false}
            />
          ))}
          {assetsInFolder.length > 0 && (
            <div className="space-y-1.5 py-1">
              {assetsInFolder.map(asset => (
                <AssetListItem key={asset.id} asset={asset} onDetailsClick={onAssetDetailsClick} />
              ))}
            </div>
          )}
           {assetsInFolder.length === 0 && childFolders.length === 0 && (
             <p className="text-xs text-muted-foreground py-1 px-2 italic">This folder is empty or assets are filtered.</p>
           )}
        </div>
      )}
    </div>
  );
};


export default function AllAssetsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string | 'all'>('all');
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<AssetFolder[]>([]);

  const [isAssetDetailsDialogOpen, setIsAssetDetailsDialogOpen] = useState(false);
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState<Asset | null>(null);
  
  const [isCreateItemTypeDialogOpen, setIsCreateItemTypeDialogOpen] = useState(false);
  const [isManageFolderDialogOpen, setIsManageFolderDialogOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<AssetFolder | null>(null);
  const [isConfirmDeleteFolderDialogOpen, setIsConfirmDeleteFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<AssetFolder | null>(null);
  const [isAssetWizardOpen, setIsAssetWizardOpen] = useState(false);

  const refreshData = useCallback(() => {
    setAssets([...mockAssetsData]); // Creates a new array reference
    setFolders([...mockFoldersData].sort((a, b) => a.name.localeCompare(b.name))); // New sorted array
  }, []);


  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const getFolderAndSubFolderIds = useCallback((folderId: string, allFolders: AssetFolder[]): string[] => {
    let ids = [folderId];
    const children = allFolders.filter(f => f.parentId === folderId);
    for (const child of children) {
      ids = ids.concat(getFolderAndSubFolderIds(child.id, allFolders));
    }
    return ids;
  }, []);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      let matchesFolder = false;
      if (selectedFolderFilter === 'all') {
        matchesFolder = true;
      } else if (selectedFolderFilter === 'unfiled') {
        matchesFolder = !asset.folderId;
      } else {
        const folderIdsToMatch = getFolderAndSubFolderIds(selectedFolderFilter, folders);
        matchesFolder = asset.folderId ? folderIdsToMatch.includes(asset.folderId) : false;
      }
      return matchesSearch && matchesFolder;
    });
  }, [searchTerm, selectedFolderFilter, assets, folders, getFolderAndSubFolderIds]);

  const rootFolders = useMemo(() => folders.filter(f => !f.parentId).sort((a,b) => a.name.localeCompare(b.name)), [folders]);
  const uncategorizedAssets = useMemo(() => filteredAssets.filter(asset => !asset.folderId), [filteredAssets]);

  const handleOpenAssetDetails = (asset: Asset) => {
    setSelectedAssetForDetails(asset);
    setIsAssetDetailsDialogOpen(true);
  };

  const handleSaveAssetTags = (assetId: string, newTags: string[]) => {
    updateAssetTags(assetId, newTags);
    refreshData(); // Full refresh to ensure UI updates
    if (selectedAssetForDetails && selectedAssetForDetails.id === assetId) {
       const updatedAssetFromMock = mockAssetsData.find(a => a.id === assetId);
       if (updatedAssetFromMock) setSelectedAssetForDetails(updatedAssetFromMock);
    }
  };

  const handleAssetConfigurationSave = (updatedAssetFromDialog: Asset) => {
    // The mockdata function already updates the array. We just need to refresh.
    refreshData();
    if (selectedAssetForDetails && selectedAssetForDetails.id === updatedAssetFromDialog.id) {
       setSelectedAssetForDetails(updatedAssetFromDialog);
    }
  };
  
  const handleCreateItemTypeSelection = (type: 'asset' | 'folder') => {
    setIsCreateItemTypeDialogOpen(false);
    if (type === 'asset') {
      setIsAssetWizardOpen(true);
    } else {
      setFolderToEdit(null); 
      setIsManageFolderDialogOpen(true);
    }
  };

  const handleAssetWizardSave = (savedAsset: Asset) => {
    refreshData(); 
    setIsAssetWizardOpen(false);
    toast({
      title: "Asset Added!",
      description: `Asset "${savedAsset.name}" of type "${savedAsset.type}" has been configured.`,
    });
  };
  
  const handleSaveFolder = (folderData: { id?: string; name: string; parentId?: string }) => {
    if (folderData.id) { 
      const updated = updateMockFolder(folderData.id, folderData.name, folderData.parentId);
      if (updated) {
        toast({ title: "Folder Updated", description: `Folder "${updated.name}" saved.`});
      }
    } else { 
      const newF = addFolder(folderData.name, folderData.parentId);
      toast({ title: "Folder Created", description: `Folder "${newF.name}" added.`});
    }
    refreshData();
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
      const success = deleteFolder(folderToDelete.id); // This also unassigns assets
      if (success) {
        toast({ title: "Folder Deleted", description: `Folder "${folderToDelete.name}" removed.`});
        if (selectedFolderFilter === folderToDelete.id) {
          setSelectedFolderFilter('all'); 
        }
      } else {
        toast({ title: "Error", description: "Could not delete folder. It might not exist.", variant: "destructive"});
      }
      refreshData();
    }
    setIsConfirmDeleteFolderDialogOpen(false);
    setFolderToDelete(null);
  };
  
  const shouldDisplayFolder = (folder: AssetFolder): boolean => {
    if (selectedFolderFilter === 'all') return true;
    if (selectedFolderFilter === 'unfiled') return false; // Don't show any folders if filtering for uncategorized
    // If a specific folder is selected, show it and its ancestors/descendants
    // This logic can be complex for a perfect "show only this branch"
    // For simplicity, we'll show all folders if a specific folder is selected,
    // but assets will be filtered. A better approach might be to only render the selected branch.
    // For now, if a folder filter is active, we still render the whole tree structure,
    // but assets are filtered.
    return true; 
  };


  return (
    <AppLayout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Asset Management</h1>
          <p className="text-muted-foreground">Browse, filter, and manage all your monitored assets and folders.</p>
        </div>
        <Button onClick={() => setIsCreateItemTypeDialogOpen(true)}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Item
        </Button>
      </div>

      <div className="mb-6 p-4 rounded-lg border bg-card">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
          <Input 
            placeholder="Search assets (name, type, tag)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background/70 focus:bg-background"
          />
          <Select value={selectedFolderFilter} onValueChange={setSelectedFolderFilter}>
            <SelectTrigger className="w-full md:w-[280px] bg-background/70 focus:bg-background">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by folder..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders & Assets</SelectItem>
              {folders.filter(f => !f.parentId).sort((a,b) => a.name.localeCompare(b.name)).map(folder => ( // Only root folders in dropdown for simplicity
                <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
              ))}
              <SelectItem value="unfiled">Uncategorized Assets</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {folders.length === 0 && uncategorizedAssets.length === 0 && searchTerm === '' && (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground font-semibold">No assets or folders found.</p>
          <p className="text-muted-foreground">Try adding a new item.</p>
        </div>
      )}

      <div className="space-y-2">
        {rootFolders.map(folder => {
            if (!shouldDisplayFolder(folder) && selectedFolderFilter !== 'all') return null;
             const assetsForThisFolderAndSubfolders = filteredAssets.filter(asset => {
                if (!asset.folderId) return false;
                if (selectedFolderFilter === 'all' || selectedFolderFilter === 'unfiled') {
                     // Handled by getFolderAndSubFolderIds in filteredAssets if specific folder selected
                    return asset.folderId === folder.id || folders.find(f => f.id === asset.folderId)?.parentId === folder.id; // Basic check
                }
                const folderIdsToMatch = getFolderAndSubFolderIds(selectedFolderFilter, folders);
                return folderIdsToMatch.includes(asset.folderId || "");
            });
            const assetsDirectlyInFolder = filteredAssets.filter(a => a.folderId === folder.id);

            if (selectedFolderFilter !== 'all' && selectedFolderFilter !== 'unfiled' && folder.id !== selectedFolderFilter && !getFolderAndSubFolderIds(selectedFolderFilter, folders).includes(folder.id) ) {
                 // If filtering by a specific folder, only show that folder's tree or if this folder is an ancestor/descendant
                 // This logic can be tricky. For now, let's ensure if specific folder is selected, we only show its branch.
                 // This means we might need to adjust how rootFolders are iterated or how FolderTreeItem decides to render.
                 // For now, if a folder is selected, and this is not it or its parent, don't render.
                 // This is an approximation and might hide unrelated root folders.
                 // A better way would be for FolderTreeItem to know if it's part of the selected branch.
            }


           return (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              allFolders={folders}
              level={0}
              assetsInFolder={assetsDirectlyInFolder}
              onEditFolder={handleEditFolder}
              onDeleteFolder={handleDeleteFolder}
              onAssetDetailsClick={handleOpenAssetDetails}
              initiallyOpen={selectedFolderFilter === folder.id || selectedFolderFilter === 'all'}
            />
           );
        })}

        {uncategorizedAssets.length > 0 && (selectedFolderFilter === 'all' || selectedFolderFilter === 'unfiled') && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2 py-2 px-2 rounded-md">
              <div className="flex items-center gap-2">
                 <FolderIcon className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-headline font-medium text-lg text-muted-foreground">Uncategorized Assets ({uncategorizedAssets.length})</h2>
              </div>
            </div>
            <div className="space-y-1.5 pl-4 ml-[7px] border-l-2 border-transparent"> {/* Align with folder content */}
              {uncategorizedAssets.map(asset => (
                <AssetListItem key={asset.id} asset={asset} onDetailsClick={handleOpenAssetDetails} />
              ))}
            </div>
          </div>
        )}
        
        {filteredAssets.length === 0 && searchTerm !== '' && (
            <div className="text-center py-10">
            <p className="text-lg text-muted-foreground">No assets found matching your search term "{searchTerm}".</p>
            </div>
        )}

      </div>


      {selectedAssetForDetails && (
        <AssetDetailsDialog
          asset={selectedAssetForDetails}
          allFolders={folders}
          isOpen={isAssetDetailsDialogOpen}
          onOpenChange={setIsAssetDetailsDialogOpen}
          onSaveTags={handleSaveAssetTags}
          onConfigurationSave={handleAssetConfigurationSave}
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

      {isAssetWizardOpen && (
        <Dialog open={isAssetWizardOpen} onOpenChange={setIsAssetWizardOpen}>
          <DialogContent className="sm:max-w-2xl p-0">
            <AssetConnectionWizard 
              onSaveComplete={handleAssetWizardSave}
            />
          </DialogContent>
        </Dialog>
      )}

    </AppLayout>
  );
}
