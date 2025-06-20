
"use client";

import type { Asset, AssetFolder } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Network, AppWindow, Database, ExternalLink, Info, CheckCircle2, XCircle, AlertTriangle, Hourglass, Container, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AssetTableProps {
  assets: Asset[];
  allFolders: AssetFolder[];
  onDetailsClick: (asset: Asset) => void;
}

const assetIcons: Record<Asset['type'], React.ElementType> = {
  Server: Server,
  Network: Network,
  Application: AppWindow,
  PostgreSQL: Database,
  MySQL: Database,
  MongoDB: Database,
  Kubernetes: Container,
  Docker: Briefcase,
  "Ubuntu Server": Server,
  "Windows Server": Server,
};

const statusBadgeIcons: Record<Asset['status'], React.ElementType> = {
  connected: CheckCircle2,
  disconnected: XCircle,
  error: AlertTriangle,
  pending: Hourglass,
};

const statusBadgeStyles: Record<Asset['status'], string> = {
  connected: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50',
  disconnected: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50',
  error: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50',
  pending: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50',
};

export function AssetTable({ assets, allFolders, onDetailsClick }: AssetTableProps) {
  const getFolderName = (folderId?: string) => {
    if (!folderId) return <span className="text-muted-foreground italic">Uncategorized</span>;
    return allFolders.find(f => f.id === folderId)?.name || <span className="text-muted-foreground italic">Unknown Folder</span>;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px] px-2"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Checked</TableHead>
            <TableHead>Folder</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => {
            const AssetIcon = assetIcons[asset.type] || Server;
            const StatusBadgeIcon = statusBadgeIcons[asset.status];
            const statusBadgeClass = statusBadgeStyles[asset.status];

            return (
              <TableRow key={asset.id}>
                <TableCell className="px-2 py-2.5">
                  <AssetIcon className="h-5 w-5 text-muted-foreground" />
                </TableCell>
                <TableCell className="font-medium py-2.5">
                  <button
                    onClick={() => onDetailsClick(asset)}
                    className="hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                    title={`View details for ${asset.name}`}
                  >
                    {asset.name}
                  </button>
                </TableCell>
                <TableCell className="py-2.5 text-sm">{asset.type}</TableCell>
                <TableCell className="py-2.5">
                  <Badge variant="outline" className={cn("capitalize text-xs py-1 px-2", statusBadgeClass)}>
                    <StatusBadgeIcon className="h-3.5 w-3.5 mr-1" />
                    {asset.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-2.5 text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(asset.lastChecked), { addSuffix: true })}
                </TableCell>
                <TableCell className="py-2.5 text-sm">{getFolderName(asset.folderId)}</TableCell>
                <TableCell className="py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {asset.tags?.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5 font-normal">{tag}</Badge>
                    ))}
                    {asset.tags && asset.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-normal">+{asset.tags.length - 2}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right py-2.5">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onDetailsClick(asset)} title="View Details">
                      <Info className="mr-1 h-3.5 w-3.5" /> Details
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={!asset.grafanaLink}
                        onClick={() => asset.grafanaLink && window.open(asset.grafanaLink, '_blank', 'noopener,noreferrer')}
                        title={asset.grafanaLink ? "Open in Grafana" : "Grafana link not available"}
                    >
                        <ExternalLink className={cn("mr-1 h-3.5 w-3.5", !asset.grafanaLink && "text-muted-foreground/70")} />
                        <span className={cn(!asset.grafanaLink && "text-muted-foreground/70")}>Grafana</span>
                    </Button>
                   </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {assets.length === 0 && (
        <div className="text-center p-6 text-muted-foreground">
            No assets found matching your criteria.
        </div>
      )}
    </div>
  );
}
