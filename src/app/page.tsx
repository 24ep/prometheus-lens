
"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { AssetListItem } from '@/components/common/asset-list-item';
import { AssetTable } from '@/components/common/asset-table';
import type { Asset, AssetFolder, AssetType } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Filter, Edit2, Trash2, Folder as FolderIcon, ChevronDown, ChevronRight, LayoutGrid, List, FileDown, FileUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AssetDetailsDialog } from '@/components/assets/asset-details-dialog';
import { CreateItemTypeDialog } from '@/components/folders/create-item-type-dialog';
import { ManageFolderDialog } from '@/components/folders/manage-folder-dialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AssetConnectionWizard } from '@/components/assets/asset-connection-wizard';
import { cn } from '@/lib/utils';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import * as XLSX from 'xlsx';
import { getMockPrometheusConfig } from '@/lib/asset-utils';


interface FolderNavItemProps {
  folder: AssetFolder;
  allFolders: AssetFolder[];
  level: number;
  onSelectFolder: (folderId: string) => void;
  onEditFolder: (folder: AssetFolder) => void;
  onDeleteFolder: (folder: AssetFolder) => void;
  selectedFolderId?: string | null;
  assetCounts: Record<string, number>; 
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
        setIsOpen(initiallyOpen); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolderId, folder.id, allFolders, initiallyOpen]);


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
              e.stopPropagation(); 
              if (hasChildren) setIsOpen(!isOpen);
            }}
            className={cn(
              "p-0.5 rounded-sm hover:bg-muted-foreground/10",
              !hasChildren && "opacity-0 pointer-events-none" 
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
              initiallyOpen={false} 
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
  const [isLoading, setIsLoading] = useState(true);

  const [isAssetDetailsDialogOpen, setIsAssetDetailsDialogOpen] = useState(false);
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState<Asset | null>(null);

  const [isCreateItemTypeDialogOpen, setIsCreateItemTypeDialogOpen] = useState(false);
  const [isManageFolderDialogOpen, setIsManageFolderDialogOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<AssetFolder | null>(null);
  const [isConfirmDeleteFolderDialogOpen, setIsConfirmDeleteFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<AssetFolder | null>(null);
  const [isAssetWizardOpen, setIsAssetWizardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);


  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assetsRes, foldersRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/folders')
      ]);

      if (!assetsRes.ok) throw new Error(`Failed to fetch assets: ${assetsRes.statusText}`);
      const assetsData: Asset[] = await assetsRes.json();
      setAssets(assetsData);

      if (!foldersRes.ok) throw new Error(`Failed to fetch folders: ${foldersRes.statusText}`);
      const foldersData: AssetFolder[] = await foldersRes.json();
      setFolders(foldersData.sort((a, b) => a.name.localeCompare(b.name)));

    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({ title: "Error Fetching Data", description: (error as Error).message, variant: "destructive" });
      setAssets([]);
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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

  const handleSaveAssetDetails = async (assetId: string, details: { tags: string[], grafanaLink?: string }) => {
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save asset details: ${response.statusText}`);
      }
      const updatedAsset: Asset = await response.json();
      setAssets(prevAssets => prevAssets.map(a => a.id === assetId ? updatedAsset : a));
      if (selectedAssetForDetails && selectedAssetForDetails.id === assetId) {
         setSelectedAssetForDetails(updatedAsset);
      }
      toast({ title: "Asset Details Saved", description: `Details for ${updatedAsset.name} updated.`});
    } catch (error) {
      console.error("Error saving asset details:", error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleAssetConfigurationSave = async (updatedAssetFromDialog: Asset) => {
     // This function is called from AssetDetailsDialog which itself calls the API.
     // We just need to refresh the local state for the main page.
    setAssets(prevAssets => prevAssets.map(a => a.id === updatedAssetFromDialog.id ? updatedAssetFromDialog : a));
    if (selectedAssetForDetails && selectedAssetForDetails.id === updatedAssetFromDialog.id) {
       setSelectedAssetForDetails(updatedAssetFromDialog);
    }
     // Toast is handled by the dialog itself
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

  const handleAssetWizardSave = async (assetData: Omit<Asset, 'id' | 'lastChecked' | 'status'>) => {
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add asset: ${response.statusText}`);
      }
      const savedAsset: Asset = await response.json();
      setAssets(prevAssets => [savedAsset, ...prevAssets]); // Add to local state
      setIsAssetWizardOpen(false);
      toast({
        title: "Asset Added!",
        description: `Asset "${savedAsset.name}" of type "${savedAsset.type}" has been configured.`,
      });
    } catch (error) {
      console.error("Error adding asset:", error);
      toast({ title: "Error Adding Asset", description: (error as Error).message, variant: "destructive" });
    }
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
        throw new Error(errorResult.error || `Failed to save folder: ${response.statusText}`);
      }
      const savedFolder: AssetFolder = await response.json();
      
      if (folderData.id) {
        setFolders(prev => prev.map(f => f.id === savedFolder.id ? savedFolder : f).sort((a,b) => a.name.localeCompare(b.name)));
        toast({ title: "Folder Updated", description: `Folder "${savedFolder.name}" saved.`});
      } else {
        setFolders(prev => [...prev, savedFolder].sort((a,b) => a.name.localeCompare(b.name)));
        toast({ title: "Folder Created", description: `Folder "${savedFolder.name}" added.`});
      }
    } catch (error) {
      console.error("Error saving folder:", error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
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

  const confirmDeleteFolder = async () => {
    if (folderToDelete) {
      try {
        const response = await fetch(`/api/folders/${folderToDelete.id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorResult = await response.json();
          throw new Error(errorResult.error || "Could not delete folder.");
        }
        toast({ title: "Folder Deleted", description: `Folder "${folderToDelete.name}" removed.`});
        if (selectedFolderFilter === folderToDelete.id) {
          setSelectedFolderFilter('all');
        }
        // Assets potentially unassigned will be reflected in next asset fetch or asset count calculation
        await refreshData(); // Re-fetch all data to reflect changes comprehensively
      } catch (error) {
         console.error("Error deleting folder:", error);
         toast({ title: "Error", description: (error as Error).message, variant: "destructive"});
      }
    }
    setIsConfirmDeleteFolderDialogOpen(false);
    setFolderToDelete(null);
  };

  const handleSelectFolderFilter = (folderId: string | 'all' | 'unfiled') => {
    setSelectedFolderFilter(folderId);
  };

  const handleExportToExcel = () => {
    const dataToExport = filteredAssets.map(asset => {
      const folder = asset.folderId ? folders.find(f => f.id === asset.folderId) : null;
      return {
        ID: asset.id,
        Name: asset.name,
        Type: asset.type,
        Status: asset.status,
        'Last Checked': new Date(asset.lastChecked).toLocaleString(),
        'Grafana Link': asset.grafanaLink || '',
        Folder: folder ? folder.name : 'Uncategorized',
        Tags: asset.tags?.join(', ') || '',
        'Config Job Name': asset.configuration?.job_name || '',
        'Config Targets': asset.configuration?.static_configs?.[0]?.targets?.join(', ') || 
                          (asset.configuration?.kubernetes_sd_configs?.[0]?.api_server ? `K8s API: ${asset.configuration.kubernetes_sd_configs[0].api_server}` : ''),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
    XLSX.writeFile(workbook, "PrometheusLens_Assets_Export.xlsx");
    toast({ title: "Export Successful", description: `${dataToExport.length} assets exported to Excel.` });
  };

  const handleDownloadImportTemplate = () => {
    const templateHeaders = [
        "Name", "Type", "FolderName", "Tags", 
        "ConfigParam1", "ConfigParam2", "GrafanaLink"
    ];
    const exampleRow = [
        "My New Server", "Server", "Production Servers", "web, critical", 
        "192.168.1.105", "9100", "https://grafana.example.com/d/newserver"
    ];
    const ws = XLSX.utils.aoa_to_sheet([templateHeaders, exampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AssetImportTemplate");
    XLSX.writeFile(wb, "PrometheusLens_Import_Template.xlsx");
    toast({ title: "Template Downloaded", description: "Asset import template is ready." });
  };

  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        let importedCount = 0;
        let errorCount = 0;

        for (const row of jsonData) { // Use for...of for async operations within loop
          const { Name, Type, FolderName, Tags, ConfigParam1, ConfigParam2, GrafanaLink } = row;

          if (!Name || !Type) {
            toast({ title: `Import Error (Row ${jsonData.indexOf(row) + 2})`, description: "Name and Type are required.", variant: "destructive" });
            errorCount++;
            continue;
          }
          
          let folderId: string | undefined = undefined;
          if (FolderName) {
            // Ensure folders are up-to-date before finding
            const currentFolders = folders.length > 0 ? folders : await (await fetch('/api/folders')).json();
            const foundFolder = currentFolders.find(f => f.name.toLowerCase() === String(FolderName).toLowerCase());
            if (foundFolder) {
              folderId = foundFolder.id;
            } else {
               toast({ title: `Import Warning (Row ${jsonData.indexOf(row) + 2})`, description: `Folder "${FolderName}" not found. Asset will be uncategorized.`, variant: "default" });
            }
          }
          
          const configObject = getMockPrometheusConfig({
              name: String(Name),
              type: Type as AssetType,
              config_param1: ConfigParam1 ? String(ConfigParam1) : undefined,
              config_param2: ConfigParam2 ? String(ConfigParam2) : undefined,
          });

          let finalConfig = {};
           if (!configObject.startsWith('# Incomplete configuration')) {
            try {
                const jobNameMatch = configObject.match(/job_name:\s*'([^']+)'/);
                finalConfig = { job_name: jobNameMatch ? jobNameMatch[1] : String(Name).toLowerCase().replace(/\s+/g, '_') || 'new_job' };

                if (configObject.includes("kubernetes_sd_configs:")) {
                    const apiServerMatch = configObject.match(/api_server:\s*'?([^'\s]+)'?/);
                    const roleMatch = configObject.match(/role:\s*(\w+)/);
                    (finalConfig as any).kubernetes_sd_configs = [{ 
                        role: roleMatch ? roleMatch[1] : 'pod', 
                        api_server: apiServerMatch ? apiServerMatch[1] : ConfigParam1 || 'YOUR_K8S_API_SERVER_URL'
                    }];
                    if (ConfigParam2) (finalConfig as any).kubernetes_sd_configs[0].bearer_token_file = ConfigParam2;
                } else if (configObject.includes("static_configs:")) {
                    const targetsMatch = configObject.match(/targets:\s*\[([^\]]+)\]/);
                     if (targetsMatch) {
                        const targets = targetsMatch[1].split(',').map(t => t.trim().replace(/'/g, ''));
                        (finalConfig as any).static_configs = [{ targets }];
                    } else if (ConfigParam1) {
                        (finalConfig as any).static_configs = [{ targets: [`${ConfigParam1}${ConfigParam2 ? ':'+ConfigParam2 : ''}`] }];
                    }
                }
            } catch (parseErr) {
                finalConfig = { job_name: String(Name).toLowerCase().replace(/\s+/g, '_'), error: 'Could not parse generated config string into an object.'};
            }
          } else {
             finalConfig = { job_name: String(Name).toLowerCase().replace(/\s+/g, '_'), error: 'Initial config generation incomplete.'};
          }


          const newAssetData: Omit<Asset, 'id' | 'lastChecked' | 'status'> = {
            name: String(Name),
            type: Type as AssetType, 
            configuration: finalConfig,
            tags: Tags ? String(Tags).split(',').map(t => t.trim()).filter(t => t) : [],
            folderId: folderId,
            grafanaLink: GrafanaLink ? String(GrafanaLink) : undefined,
          };
          
          try {
            const response = await fetch('/api/assets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newAssetData),
            });
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Failed to import asset ${Name}`);
            }
            importedCount++;
          } catch (apiError) {
            toast({ title: `Import Error (Asset: ${Name})`, description: (apiError as Error).message, variant: "destructive" });
            errorCount++;
          }
        }

        await refreshData(); // Refresh all data after import attempts
        if (importedCount > 0) {
            toast({ title: "Import Processed", description: `${importedCount} assets imported. ${errorCount > 0 ? errorCount + ' rows had errors.' : ''}` });
        } else if (errorCount > 0) {
            toast({ title: "Import Failed", description: `No assets imported. ${errorCount} rows had errors.`, variant: "destructive" });
        } else {
            toast({ title: "Import Note", description: "No data found to import or file was empty."});
        }

      } catch (error) {
        console.error("Error importing Excel:", error);
        toast({ title: "Import Error", description: "Failed to process the Excel file.", variant: "destructive" });
      } finally {
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; 
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-var(--header-height,4rem)-2rem)]">
          <p>Loading data...</p> {/* Replace with a proper spinner/skeleton later */}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-var(--header-height,4rem)-2rem)]">
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
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background focus:bg-background h-9 flex-grow sm:flex-grow-0 sm:w-48 md:w-64"
                />
                <Button onClick={() => setIsCreateItemTypeDialogOpen(true)} size="sm" className="h-9">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setViewMode(viewMode === 'list' ? 'table' : 'list')} title={viewMode === 'list' ? 'Switch to Table View' : 'Switch to List View'}>
                  {viewMode === 'list' ? <LayoutGrid className="h-4 w-4"/> : <List className="h-4 w-4" />}
                </Button>
                 <input type="file" ref={fileInputRef} onChange={handleImportFromExcel} accept=".xlsx, .xls" style={{ display: 'none' }} />
                <Button variant="outline" size="sm" className="h-9" onClick={() => fileInputRef.current?.click()}>
                  <FileUp className="mr-2 h-4 w-4"/> Import
                </Button>
                <Button variant="outline" size="sm" className="h-9" onClick={handleExportToExcel}>
                  <FileDown className="mr-2 h-4 w-4"/> Export
                </Button>
                <Button variant="outline" size="sm" className="h-9" onClick={handleDownloadImportTemplate}>
                  <FileDown className="mr-2 h-4 w-4"/> Template
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-grow p-4">
            {filteredAssets.length > 0 ? (
              viewMode === 'list' ? (
                <div className="space-y-2">
                  {filteredAssets.map(asset => (
                    <AssetListItem key={asset.id} asset={asset} onDetailsClick={handleOpenAssetDetails} />
                  ))}
                </div>
              ) : (
                <AssetTable assets={filteredAssets} allFolders={folders} onDetailsClick={handleOpenAssetDetails} />
              )
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
