
"use client";

import type { Asset } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Network, AppWindow, Database, Box, ExternalLink, Info, CheckCircle2, XCircle, AlertTriangle, Hourglass, Container, Briefcase } from 'lucide-react';
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
  Kubernetes: Container, // Changed from Box for better k8s representation
  Docker: Briefcase, // Using Briefcase for Docker as Container is now k8s
  "Ubuntu Server": Server,
  "Windows Server": Server,
};

const statusTextColors: Record<Asset['status'], string> = {
  connected: 'text-green-600 dark:text-green-500',
  disconnected: 'text-red-600 dark:text-red-500',
  error: 'text-amber-600 dark:text-amber-500',
  pending: 'text-blue-600 dark:text-blue-500',
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

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 rounded-md transition-colors duration-150">
      <AssetIcon className={cn("h-7 w-7 shrink-0", statusTextColors[asset.status] || 'text-primary')} />
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between">
          <button onClick={() => onDetailsClick(asset)} className="text-left hover:underline focus:outline-none">
            <h3 className="font-headline font-medium text-base leading-tight truncate" title={asset.name}>
              {asset.name}
            </h3>
          </button>
          <div className="flex items-center gap-1.5 whitespace-nowrap text-xs ml-2 shrink-0">
            <StatusIcon className={cn("h-3.5 w-3.5", statusTextColors[asset.status])} />
            <span className={cn("capitalize font-medium", statusTextColors[asset.status])}>{asset.status}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{asset.type} &bull; Last checked: {formatDistanceToNow(new Date(asset.lastChecked), { addSuffix: true })}</p>
        {asset.tags && asset.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map(tag => ( // Show max 3 tags inline
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">{tag}</Badge>
            ))}
            {asset.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">+{asset.tags.length - 3} more</Badge>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
        <Button variant="ghost" size="sm" onClick={() => onDetailsClick(asset)} title="View Details">
          <Info className="mr-1 h-3.5 w-3.5" /> Details
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!asset.grafanaLink}
          onClick={() => asset.grafanaLink && window.open(asset.grafanaLink, '_blank', 'noopener,noreferrer')}
          className={cn(!asset.grafanaLink && "text-muted-foreground hover:text-muted-foreground")}
          title={asset.grafanaLink ? "Open in Grafana" : "Grafana link not available"}
        >
          <ExternalLink className="mr-1 h-3.5 w-3.5" /> Grafana
        </Button>
      </div>
    </div>
  );
}
