
"use client";

import type { Asset } from '@/types';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Network, AppWindow, Database, ExternalLink, Info, CheckCircle2, XCircle, AlertTriangle, Hourglass, Container, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AssetListItemProps {
  asset: Asset;
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

// Text color for the main asset icon
const statusAssetIconTextColors: Record<Asset['status'], string> = {
  connected: 'text-green-600 dark:text-green-400',
  disconnected: 'text-red-600 dark:text-red-400',
  error: 'text-amber-600 dark:text-amber-400',
  pending: 'text-blue-600 dark:text-blue-400',
};

// Styles for the status badge on the right
const statusBadgeStyles: Record<Asset['status'], string> = {
  connected: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50',
  disconnected: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50',
  error: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50',
  pending: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50',
};

const statusBadgeIcons: Record<Asset['status'], React.ElementType> = {
  connected: CheckCircle2,
  disconnected: XCircle,
  error: AlertTriangle,
  pending: Hourglass,
};

export function AssetListItem({ asset, onDetailsClick }: AssetListItemProps) {
  const AssetIcon = assetIcons[asset.type] || Server;
  const StatusBadgeIcon = statusBadgeIcons[asset.status];
  const assetIconColorClass = statusAssetIconTextColors[asset.status] || 'text-muted-foreground';
  const statusBadgeClass = statusBadgeStyles[asset.status] || 'bg-muted text-muted-foreground border-muted-foreground/30';

  return (
    <div className="flex items-center gap-3 p-3 bg-card hover:bg-card/95 dark:hover:bg-muted/20 rounded-lg border shadow-sm transition-colors duration-150">
      <AssetIcon className={cn("h-7 w-7 shrink-0", assetIconColorClass)} />
      
      <div className="flex-grow min-w-0">
        <button 
            onClick={() => onDetailsClick(asset)} 
            className="text-left hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm -ml-0.5 px-0.5"
            title={`View details for ${asset.name}`}
            >
            <h3 className="font-headline font-semibold text-base leading-tight truncate" title={asset.name}>
              {asset.name}
            </h3>
        </button>
        <p className="text-xs text-muted-foreground/90 mt-0.5">{asset.type} &bull; Last checked: {formatDistanceToNow(new Date(asset.lastChecked), { addSuffix: true })}</p>
        {asset.tags && asset.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {asset.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5 font-normal">{tag}</Badge>
            ))}
            {asset.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-normal">+{asset.tags.length - 2} more</Badge>
            )}
          </div>
        )}
      </div>
      
      <div className="ml-auto flex flex-col items-end gap-1.5 shrink-0">
        <Badge variant="outline" className={cn("capitalize text-xs py-1 px-2", statusBadgeClass)}>
            <StatusBadgeIcon className="h-3.5 w-3.5 mr-1" />
            {asset.status}
        </Badge>
        <div className="flex gap-1">
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
      </div>
    </div>
  );
}
