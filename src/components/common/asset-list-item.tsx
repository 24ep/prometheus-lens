
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

const statusTextColors: Record<Asset['status'], string> = {
  connected: 'text-green-600 dark:text-green-500',
  disconnected: 'text-red-600 dark:text-red-500',
  error: 'text-amber-600 dark:text-amber-500',
  pending: 'text-blue-600 dark:text-blue-500',
};

const statusBackgroundColors: Record<Asset['status'], string> = {
  connected: 'bg-green-500/10',
  disconnected: 'bg-red-500/10',
  error: 'bg-amber-500/10',
  pending: 'bg-blue-500/10',
}

const statusIcons: Record<Asset['status'], React.ElementType> = {
  connected: CheckCircle2,
  disconnected: XCircle,
  error: AlertTriangle,
  pending: Hourglass,
};

export function AssetListItem({ asset, onDetailsClick }: AssetListItemProps) {
  const AssetIcon = assetIcons[asset.type] || Server;
  const StatusIcon = statusIcons[asset.status];

  return (
    <div className={cn(
        "group flex items-center gap-3 px-2.5 py-2 hover:bg-muted/60 rounded-md transition-colors duration-150",
        statusBackgroundColors[asset.status]
      )}>
      <AssetIcon className={cn("h-6 w-6 shrink-0", statusTextColors[asset.status] || 'text-primary')} />
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between">
          <button onClick={() => onDetailsClick(asset)} className="text-left hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm -ml-0.5 px-0.5">
            <h3 className="font-headline font-medium text-sm leading-tight truncate" title={asset.name}>
              {asset.name}
            </h3>
          </button>
          <div className="flex items-center gap-1 whitespace-nowrap text-xs ml-2 shrink-0">
            <StatusIcon className={cn("h-3.5 w-3.5", statusTextColors[asset.status])} />
            <span className={cn("capitalize font-medium", statusTextColors[asset.status])}>{asset.status}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/90">{asset.type} &bull; Last checked: {formatDistanceToNow(new Date(asset.lastChecked), { addSuffix: true })}</p>
        {asset.tags && asset.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {asset.tags.slice(0, 2).map(tag => ( // Show max 2 tags inline for very compact view
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5 font-normal">{tag}</Badge>
            ))}
            {asset.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-normal">+{asset.tags.length - 2} more</Badge>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onDetailsClick(asset)} title="View Details">
          <Info className="mr-1 h-3.5 w-3.5" /> Details
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          disabled={!asset.grafanaLink}
          onClick={() => asset.grafanaLink && window.open(asset.grafanaLink, '_blank', 'noopener,noreferrer')}
          title={asset.grafanaLink ? "Open in Grafana" : "Grafana link not available"}
        >
          <ExternalLink className={cn("mr-1 h-3.5 w-3.5", !asset.grafanaLink && "text-muted-foreground")} /> 
          <span className={cn(!asset.grafanaLink && "text-muted-foreground")}>Grafana</span>
        </Button>
      </div>
    </div>
  );
}
