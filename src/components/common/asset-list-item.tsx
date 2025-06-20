"use client";

import type { Asset } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Network, AppWindow, Database, Box, ExternalLink, Info, CheckCircle2, XCircle, AlertTriangle, Hourglass, GripVertical } from 'lucide-react';
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
  Database: Database,
  Kubernetes: Box,
};

const statusTextColors: Record<Asset['status'], string> = {
  connected: 'text-green-700 dark:text-green-400',
  disconnected: 'text-red-700 dark:text-red-400',
  error: 'text-amber-700 dark:text-amber-400',
  pending: 'text-blue-700 dark:text-blue-400',
};

const statusIcons: Record<Asset['status'], React.ElementType> = {
  connected: CheckCircle2,
  disconnected: XCircle,
  error: AlertTriangle,
  pending: Hourglass,
};

export function AssetListItem({ asset, onDetailsClick }: AssetListItemProps) {
  const AssetIcon = assetIcons[asset.type];
  const StatusIcon = statusIcons[asset.status];

  return (
    <Card className="glassmorphic overflow-hidden transition-all hover:shadow-lg w-full">
      <CardContent className="p-3 grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-x-3 sm:gap-x-4 w-full text-sm">
        {/* Col 1: Icon */}
        <AssetIcon className="h-6 w-6 text-primary shrink-0" />
        
        {/* Col 2: Name & Type */}
        <div className="overflow-hidden pr-2">
          <button onClick={() => onDetailsClick(asset)} className="text-left hover:underline w-full">
            <h3 className="font-headline font-semibold leading-tight truncate" title={asset.name}>{asset.name}</h3>
          </button>
          <p className="text-xs text-muted-foreground">{asset.type}</p>
        </div>

        {/* Col 3: Status */}
        <div className="flex items-center gap-1 whitespace-nowrap" title={`Status: ${asset.status}`}>
          <StatusIcon className={cn("h-4 w-4 shrink-0", statusTextColors[asset.status])} />
          <span className={cn("capitalize hidden sm:inline", statusTextColors[asset.status])}>{asset.status}</span>
        </div>
        
        {/* Col 4: Last Checked */}
        <div className="text-xs text-muted-foreground whitespace-nowrap hidden md:block">
            {formatDistanceToNow(new Date(asset.lastChecked), { addSuffix: true })}
        </div>
        
        {/* Col 5: Tags */}
        <div className="hidden lg:flex flex-wrap gap-1 shrink-0 max-w-[150px] overflow-hidden">
          {asset.tags && asset.tags.length > 0 ? (
            asset.tags.slice(0, 2).map(tag => ( 
              <Badge key={tag} variant="secondary" className="text-xs whitespace-nowrap">{tag}</Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground italic">No tags</span>
          )}
          {asset.tags && asset.tags.length > 2 && <Badge variant="secondary" className="text-xs">+{asset.tags.length - 2}</Badge>}
        </div>

        {/* Col 6: Actions */}
        <div className="flex gap-2 shrink-0 justify-end">
          <Button variant="outline" size="sm" onClick={() => onDetailsClick(asset)}>
            <Info className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Details</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={!asset.grafanaLink}
            onClick={() => asset.grafanaLink && window.open(asset.grafanaLink, '_blank', 'noopener,noreferrer')}
            className={cn(
              "text-primary hover:text-accent-foreground hover:bg-accent",
              !asset.grafanaLink && "text-muted-foreground hover:text-muted-foreground hover:bg-transparent cursor-not-allowed"
            )}
             aria-label={asset.grafanaLink ? "Open in Grafana" : "Grafana link not available"}
          >
            <span className="hidden sm:inline">Grafana</span> <ExternalLink className="ml-0 sm:ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
