
"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { AssetListItem } from '@/components/common/asset-list-item';
import { mockAssetsData, mockFoldersData, addFolder, updateFolder as updateMockFolder, deleteFolder, updateAssetDetails } from '@/lib/mock-data';
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

  // Update isOpen if initiallyOpen prop changes (e.g. due to filter selection)
  useEffect(() => {
    setIsOpen(initiallyOpen);
  }, [initiallyOpen]);

  return (
    <div style={{ paddingLeft: level > 0 ? `${level * 1.5}rem` : '0' }} className="my-0.5">
      <div className="flex justify-between items-center py-1.5 px-2 rounded-md hover:bg-muted/60 group">
        <div 
            className="flex items-center gap-1.5 flex-grow min-w-0 cursor-pointer" 
            onClick={() => hasContent && setIsOpen(!isOpen)} 
            role="button" 
            tabIndex={0} 
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && hasContent && setIsOpen(!isOpen)} 
        >
          {hasContent ? (
            isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <div className="w-4 h-4 shrink-0"></div> 
          )}
          <FolderIcon className="h-5 w-5 text-primary shrink-0" />
          <span className="font-headline font-medium text-base truncate" title={folder.name}>{folder.name}</span>
          <span className="text-xs text-muted-foreground ml-1">({assetsInFolder.length})</span>
        </div>
        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditFolder(folder)} aria-label={`Edit folder ${folder.name}`}>
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteFolder(folder)} aria-label={`Delete folder ${folder.name}`}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
      {isOpen && (
        <div className="mt-0.5 border-l-2 border-muted/70 pl-2.5 ml-[calc(0.5rem+7px)]"> {/* Indent content under folder icon, adjust ml */}
          {childFolders.map(child => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              allFolders={allFolders}
              level={0} 
              assetsInFolder={filteredAssets.filter(a => a.folderId === child.id)}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              onAssetDetailsClick={onAssetDetailsClick}
              initiallyOpen={false} // Child folders open based on their own state or interaction
            />
          ))}
          {assetsInFolder.length > 0 && (
            <div className="space-y-1 py-1">
              {assetsInFolder.map(asset => (
                <AssetListItem key={asset.id} asset={asset} onDetailsClick={onAssetDetailsClick} />
              ))}
            </div>
          )}
           {assetsInFolder.length === 0 && childFolders.length === 0 && hasContent && ( // Only show if folder was supposed to have content but is now empty due to filters
             <p className="text-xs text-muted-foreground py-1 px-2 italic">No items match current filters in this folder.</p>
           )}
           {!hasContent && (
             <p className="text-xs text-muted-foreground py-1 px-2 italic">This folder is empty.</p>
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
    setAssets([...mockAssetsData]); 
    setFolders([...mockFoldersData].sort((a, b) => a.name.localeCompare(b.name))); 
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

  const handleSaveAssetDetails = (assetId: string, details: { tags: string[], grafanaLink?: string }) => {
    updateAssetDetails(assetId, details);
    refreshData(); 
    if (selectedAssetForDetails && selectedAssetForDetails.id === assetId) {
       const updatedAssetFromMock = mockAssetsData.find(a => a.id === assetId);
       if (updatedAssetFromMock) setSelectedAssetForDetails(updatedAssetFromMock);
    }
  };

  const handleAssetConfigurationSave = (updatedAssetFromDialog: Asset) => {
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
      const success = deleteFolder(folderToDelete.id); 
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
  
  const isFolderOrDescendantSelected = useCallback((folderId: string, selectedFilterId: string, allFolders: AssetFolder[]): boolean => {
    if (folderId === selectedFilterId) return true;
    const children = allFolders.filter(f => f.parentId === folderId);
    for (const child of children) {
        if (isFolderOrDescendantSelected(child.id, selectedFilterId, allFolders)) return true;
    }
    return false;
  }, []);

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
              {folders.filter(f => !f.parentId).sort((a,b) => a.name.localeCompare(b.name)).map(folder => ( 
                <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
              ))}
              <SelectItem value="unfiled">Uncategorized Assets</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {(folders.length === 0 && uncategorizedAssets.length === 0 && searchTerm === '') && (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground font-semibold">No assets or folders found.</p>
          <p className="text-muted-foreground">Try adding a new item.</p>
        </div>
      )}

      <div className="space-y-1"> {/* Reduced space-y for tighter tree */}
        {rootFolders.map(folder => {
           if (selectedFolderFilter !== 'all' && selectedFolderFilter !== 'unfiled' && !isFolderOrDescendantSelected(folder.id, selectedFolderFilter, folders) && !folders.find(f => f.id === selectedFolderFilter)?.parentId === folder.id) {
             // If a specific folder filter is active, only show the branch containing that folder or if it's a direct child for context
             let show = false;
             let current = folders.find(f => f.id === selectedFolderFilter);
             while(current) {
                if (current.id === folder.id) {
                    show = true;
                    break;
                }
                current = current.parentId ? folders.find(f => f.id === current!.parentId) : undefined;
             }
             if (!show && !(folders.find(f => f.id === selectedFolderFilter)?.parentId === folder.id)) return null;
           }
           
           const assetsDirectlyInFolder = filteredAssets.filter(a => a.folderId === folder.id);

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
              initiallyOpen={selectedFolderFilter === 'all' || folder.id === selectedFolderFilter || (selectedFolderFilter !== 'unfiled' && isFolderOrDescendantSelected(folder.id, selectedFolderFilter, folders))}
            />
           );
        })}

        {uncategorizedAssets.length > 0 && (selectedFolderFilter === 'all' || selectedFolderFilter === 'unfiled') && (
          <div className="mt-3 pt-2 border-t border-dashed">
            <div className="flex justify-between items-center mb-1 py-1.5 px-2 rounded-md">
              <div className="flex items-center gap-2">
                 <FolderIcon className="h-5 w-5 text-muted-foreground/80" />
                <h2 className="font-headline font-medium text-base text-muted-foreground">Uncategorized Assets ({uncategorizedAssets.length})</h2>
              </div>
            </div>
            <div className="space-y-1 pl-3 ml-[calc(0.5rem+7px)] border-l-2 border-transparent">
              {uncategorizedAssets.map(asset => (
                <AssetListItem key={asset.id} asset={asset} onDetailsClick={handleOpenAssetDetails} />
              ))}
            </div>
          </div>
        )}
        
        {filteredAssets.length === 0 && (searchTerm !== '' || (selectedFolderFilter !== 'all' && selectedFolderFilter !== 'unfiled' && rootFolders.every(folder => !isFolderOrDescendantSelected(folder.id, selectedFolderFilter, folders)) && uncategorizedAssets.length === 0) ) && (
            <div className="text-center py-10">
            <p className="text-lg text-muted-foreground">No assets found matching your current filters.</p>
            {searchTerm && <p className="text-sm text-muted-foreground">Search term: "{searchTerm}"</p>}
            </div>
        )}

      </div>


      {selectedAssetForDetails && (
        <AssetDetailsDialog
          asset={selectedAssetForDetails}
          allFolders={folders}
          isOpen={isAssetDetailsDialogOpen}
          onOpenChange={setIsAssetDetailsDialogOpen}
          onSaveDetails={handleSaveAssetDetails}
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
