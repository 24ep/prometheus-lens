
"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { AssetListItem } from '@/components/common/asset-list-item';
import { mockAssetsData, mockFoldersData, addFolder, updateFolder as updateMockFolder, deleteFolder, updateAssetDetails } from '@/lib/mock-data';
import type { Asset, AssetFolder } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Filter, Edit2, Trash2, Folder as FolderIcon, ChevronDown, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AssetDetailsDialog } from '@/components/assets/asset-details-dialog';
import { CreateItemTypeDialog } from '@/components/folders/create-item-type-dialog';
import { ManageFolderDialog } from '@/components/folders/manage-folder-dialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AssetConnectionWizard } from '@/components/assets/asset-connection-wizard';
import { cn } from '@/lib/utils';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';


interface FolderNavItemProps {
  folder: AssetFolder;
  allFolders: AssetFolder[];
  level: number;
  onSelectFolder: (folderId: string) => void;
  onEditFolder: (folder: AssetFolder) => void;
  onDeleteFolder: (folder: AssetFolder) => void;
  selectedFolderId?: string | null;
  assetCounts: Record<string, number>; // FolderId -> count of assets (including subfolders)
  initiallyOpen?: boolean;
}

const FolderNavItem: React.FC<FolderNavItemProps> = ({
  folder,
  allFolders,
  level,
  onSelectFolder,
  onEditFolder,
  onDeleteFolder,
  selectedFolderId,
  assetCounts,
  initiallyOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const childFolders = allFolders.filter(f => f.parentId === folder.id).sort((a,b) => a.name.localeCompare(b.name));
  const hasChildren = childFolders.length > 0;
  const isActive = selectedFolderId === folder.id;
  const count = assetCounts[folder.id] || 0;

  useEffect(() => {
    // If a folder is selected and it's this one or a child, ensure it's open
     if (selectedFolderId) {
        let currentFolder = allFolders.find(f => f.id === selectedFolderId);
        let shouldOpen = false;
        while(currentFolder) {
            if (currentFolder.id === folder.id) {
                shouldOpen = true;
                break;
            }
            currentFolder = currentFolder.parentId ? allFolders.find(f => f.id === currentFolder!.parentId) : undefined;
        }
        if(shouldOpen && !isOpen) setIsOpen(true);
    } else {
        setIsOpen(initiallyOpen); // Default open state if no selection forces it
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolderId, folder.id, allFolders, initiallyOpen]); // isOpen removed from deps to avoid loop


  return (
    <div className="my-0.5">
      <div 
        className={cn(
          "flex justify-between items-center py-1.5 px-2 rounded-md group text-sm",
          isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/60"
        )}
        style={{ paddingLeft: `${0.5 + level * 1}rem` }}
      >
        <div 
            className="flex items-center gap-1.5 flex-grow min-w-0 cursor-pointer" 
            onClick={() => onSelectFolder(folder.id)}
            role="button" 
            tabIndex={0} 
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectFolder(folder.id)} 
        >
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent selecting folder when toggling expand
              if (hasChildren) setIsOpen(!isOpen);
            }}
            className={cn(
              "p-0.5 rounded-sm hover:bg-muted-foreground/10",
              !hasChildren && "opacity-0 pointer-events-none" // Hide if no children
            )}
            aria-label={hasChildren ? (isOpen ? "Collapse folder" : "Expand folder") : undefined}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <div className="w-4 h-4 shrink-0"></div> 
            )}
          </button>
          <FolderIcon className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate" title={folder.name}>{folder.name}</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <span className={cn("text-xs mr-1", isActive ? "text-primary/80" : "text-muted-foreground")}>({count})</span>
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEditFolder(folder);}} aria-label={`Edit folder ${folder.name}`}>
              <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder);}} aria-label={`Delete folder ${folder.name}`}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>
      </div>
      {isOpen && hasChildren && (
        <div className="mt-0.5">
          {childFolders.map(child => (
            <FolderNavItem
              key={child.id}
              folder={child}
              allFolders={allFolders}
              level={level + 1}
              onSelectFolder={onSelectFolder}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
              selectedFolderId={selectedFolderId}
              assetCounts={assetCounts}
              initiallyOpen={false} // Children initially closed unless selection forces them open
            />
          ))}
        </div>
      )}
    </div>
  );
};


export default function AllAssetsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string | 'all' | 'unfiled'>('all');
  
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // Default to list view

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
  
  const assetCountsByFolder = useMemo(() => {
    const counts: Record<string, number> = {};
    const allFolderIdsIncludingChildren = (folderId: string): string[] => getFolderAndSubFolderIds(folderId, folders);

    folders.forEach(folder => {
        const idsToCount = allFolderIdsIncludingChildren(folder.id);
        counts[folder.id] = assets.filter(asset => asset.folderId && idsToCount.includes(asset.folderId)).length;
    });
    return counts;
  }, [assets, folders, getFolderAndSubFolderIds]);


  const rootFolders = useMemo(() => folders.filter(f => !f.parentId).sort((a,b) => a.name.localeCompare(b.name)), [folders]);
  const totalAssetsCount = useMemo(() => assets.length, [assets]);
  const uncategorizedAssetsCount = useMemo(() => assets.filter(asset => !asset.folderId).length, [assets]);


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
  
  const handleSelectFolderFilter = (folderId: string | 'all' | 'unfiled') => {
    setSelectedFolderFilter(folderId);
  };


  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-var(--header-height,4rem)-2rem)]"> {/* Main flex container */}
        {/* Left Column: Folder Navigation */}
        <div className="w-64 xl:w-72 border-r bg-card/30 shrink-0">
          <ScrollArea className="h-full p-3">
            <h2 className="text-sm font-semibold text-muted-foreground px-2 mb-2">BROWSE FOLDERS</h2>
            <nav className="space-y-0.5">
              <button
                onClick={() => handleSelectFolderFilter('all')}
                className={cn(
                  "w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-sm hover:bg-muted",
                  selectedFolderFilter === 'all' && "bg-primary/10 text-primary font-medium"
                )}
              >
                <LayoutGrid className="h-4 w-4" /> All Assets <span className="ml-auto text-xs text-muted-foreground">({totalAssetsCount})</span>
              </button>
              <button
                onClick={() => handleSelectFolderFilter('unfiled')}
                className={cn(
                  "w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-sm hover:bg-muted",
                  selectedFolderFilter === 'unfiled' && "bg-primary/10 text-primary font-medium"
                )}
              >
                <FolderIcon className="h-4 w-4" /> Uncategorized <span className="ml-auto text-xs text-muted-foreground">({uncategorizedAssetsCount})</span>
              </button>
              <Separator className="my-2" />
              {rootFolders.map(folder => (
                <FolderNavItem
                  key={folder.id}
                  folder={folder}
                  allFolders={folders}
                  level={0}
                  onSelectFolder={handleSelectFolderFilter}
                  onEditFolder={handleEditFolder}
                  onDeleteFolder={handleDeleteFolder}
                  selectedFolderId={selectedFolderFilter !== 'all' && selectedFolderFilter !== 'unfiled' ? selectedFolderFilter : null}
                  assetCounts={assetCountsByFolder}
                  initiallyOpen={true} 
                />
              ))}
               {folders.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center">No folders created. Create one using 'Add Item'.</p>
              )}
            </nav>
          </ScrollArea>
        </div>

        {/* Right Column: Asset Display */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 pb-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-2xl font-headline font-bold text-foreground">
                  {selectedFolderFilter === 'all' ? 'All Assets' : 
                   selectedFolderFilter === 'unfiled' ? 'Uncategorized Assets' :
                   folders.find(f => f.id === selectedFolderFilter)?.name || 'Assets'}
                </h1>
                 <p className="text-sm text-muted-foreground">
                    {filteredAssets.length} item(s) found.
                    {searchTerm && ` (filtered by "${searchTerm}")`}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input 
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background focus:bg-background h-9 flex-grow sm:flex-grow-0 sm:w-64"
                />
                <Button onClick={() => setIsCreateItemTypeDialogOpen(true)} size="sm" className="h-9">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
                {/* View Mode Toggle - Optional, keeping simple for now
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
                  {viewMode === 'list' ? <LayoutGrid className="h-4 w-4"/> : <List className="h-4 w-4" />}
                </Button>
                */}
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-grow p-4">
            {filteredAssets.length > 0 ? (
              <div className="space-y-2">
                {filteredAssets.map(asset => (
                  <AssetListItem key={asset.id} asset={asset} onDetailsClick={handleOpenAssetDetails} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-lg text-muted-foreground">
                  {searchTerm || (selectedFolderFilter !== 'all' && selectedFolderFilter !== 'unfiled') 
                    ? "No assets match your current filters." 
                    : "No assets or folders found."
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                    {searchTerm && `Search term: "${searchTerm}"`}
                    {(!searchTerm && selectedFolderFilter !== 'all' && selectedFolderFilter !== 'unfiled' && filteredAssets.length === 0 && (assetCountsByFolder[selectedFolderFilter] === 0)) && `This folder is empty.`}
                </p>
                 {(folders.length === 0 && assets.length === 0 && searchTerm === '' && selectedFolderFilter === 'all') && (
                    <Button onClick={() => setIsCreateItemTypeDialogOpen(true)} variant="outline" className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Item
                    </Button>
                 )}
              </div>
            )}
          </ScrollArea>
        </div>
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

        