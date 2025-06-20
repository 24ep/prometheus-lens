"use client";

import { AppLayout } from '@/components/layout/app-layout';
import { AssetCard } from '@/components/common/asset-card';
import { mockAssetsData, mockFoldersData } from '@/lib/mock-data';
import type { Asset, AssetFolder } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Filter, LayoutGrid, List } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // For potential future use

  const filteredAssets = useMemo(() => {
    return mockAssetsData.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesFolder = selectedFolder === 'all' || asset.folderId === selectedFolder;
      return matchesSearch && matchesFolder;
    });
  }, [searchTerm, selectedFolder]);

  const assetsByFolder = useMemo(() => {
    if (selectedFolder !== 'all') {
      const folder = mockFoldersData.find(f => f.id === selectedFolder);
      return folder ? { [folder.id]: { name: folder.name, assets: filteredAssets } } : {};
    }
    
    const grouped: Record<string, { name: string; assets: Asset[] }> = {};
    filteredAssets.forEach(asset => {
      const folderId = asset.folderId || 'unfiled';
      const folderName = mockFoldersData.find(f => f.id === asset.folderId)?.name || 'Uncategorized';
      if (!grouped[folderId]) {
        grouped[folderId] = { name: folderName, assets: [] };
      }
      grouped[folderId].assets.push(asset);
    });
    return grouped;
  }, [filteredAssets, selectedFolder]);

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Asset Dashboard</h1>
          <p className="text-muted-foreground">Overview of your monitored assets.</p>
        </div>
        <Link href="/assets/new">
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Asset
          </Button>
        </Link>
      </div>

      <div className="mb-6 p-4 rounded-lg glassmorphic">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input 
            placeholder="Search assets (name, type, tag)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background/70 focus:bg-background"
          />
          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger className="w-full md:w-auto bg-background/70 focus:bg-background">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by folder..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              {mockFoldersData.map(folder => (
                <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
              ))}
              <SelectItem value="unfiled">Uncategorized</SelectItem>
            </SelectContent>
          </Select>
          {/* View mode toggle - future feature
          <div className="flex justify-end">
            <Button variant={viewMode === 'grid' ? "default" : "outline"} size="icon" onClick={() => setViewMode('grid')} className="mr-2">
              <LayoutGrid className="h-5 w-5"/>
            </Button>
            <Button variant={viewMode === 'list' ? "default" : "outline"} size="icon" onClick={() => setViewMode('list')}>
              <List className="h-5 w-5"/>
            </Button>
          </div>
          */}
        </div>
      </div>
      
      {Object.entries(assetsByFolder).length === 0 && (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground font-semibold">No assets found.</p>
          <p className="text-muted-foreground">Try adjusting your filters or add a new asset.</p>
        </div>
      )}

      {Object.entries(assetsByFolder).map(([folderId, group]) => (
        <div key={folderId} className="mb-8">
          {selectedFolder === 'all' && (
            <h2 className="text-2xl font-headline font-semibold text-foreground mb-4 pb-2 border-b border-border/50">{group.name} ({group.assets.length})</h2>
          )}
          {group.assets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {group.assets.map(asset => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          ) : (
             selectedFolder !== 'all' && ( // Only show "no assets in folder" if a specific folder is selected
              <div className="text-center py-6">
                <p className="text-lg text-muted-foreground">No assets in this folder matching your search.</p>
              </div>
             )
          )}
        </div>
      ))}

    </AppLayout>
  );
}
