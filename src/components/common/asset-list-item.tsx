
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
  connected: 'text-green-600 dark:text-green-400',
  disconnected: 'text-red-600 dark:text-red-400',
  error: 'text-amber-600 dark:text-amber-400',
  pending: 'text-blue-600 dark:text-blue-400',
};

const statusBorderColors: Record<Asset['status'], string> = {
  connected: 'bg-green-500',
  disconnected: 'bg-red-500',
  error: 'bg-amber-500',
  pending: 'bg-blue-500',
};

const statusIcons: Record<Asset['status'], React.ElementType> = {
  connected: CheckCircle2,
  disconnected: XCircle,
  error: AlertTriangle,
  pending: Hourglass,
};

export function AssetListItem({ asset, onDetailsClick }: AssetListItemProps) {
  const AssetIcon = assetIcons[asset.type] || Server;
  const StatusIcon = statusIcons[asset.status];
  const statusBorderClass = statusBorderColors[asset.status] || 'bg-muted';
  const statusTextColorClass = statusTextColors[asset.status] || 'text-muted-foreground';

  return (
    <div className="group relative flex items-center gap-x-3 pl-1 pr-3 py-2 bg-card hover:bg-card/90 dark:hover:bg-muted/30 hover:shadow-md rounded-lg border shadow-sm transition-all duration-150">
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg", statusBorderClass)} />
      
      <AssetIcon className={cn("h-6 w-6 shrink-0 ml-2", statusTextColorClass)} />
      
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => onDetailsClick(asset)} 
            className="text-left hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm -ml-0.5 px-0.5"
            title={`View details for ${asset.name}`}
            >
            <h3 className="font-headline font-semibold text-sm leading-tight truncate" title={asset.name}>
              {asset.name}
            </h3>
          </button>
          <div className="flex items-center gap-1 whitespace-nowrap text-xs ml-2 shrink-0">
            <StatusIcon className={cn("h-3.5 w-3.5", statusTextColorClass)} />
            <span className={cn("capitalize font-medium", statusTextColorClass)}>{asset.status}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/90 mt-0.5">{asset.type} &bull; Last checked: {formatDistanceToNow(new Date(asset.lastChecked), { addSuffix: true })}</p>
        {asset.tags && asset.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5 font-normal">{tag}</Badge>
            ))}
            {asset.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-normal">+{asset.tags.length - 3} more</Badge>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end sm:flex-row sm:items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 ml-2">
        <Button variant="ghost" size="sm" className="h-7 px-2 justify-start text-xs" onClick={() => onDetailsClick(asset)} title="View Details">
          <Info className="mr-1 h-3.5 w-3.5" /> Details
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 justify-start text-xs"
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
