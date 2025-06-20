
"use client";

import type { Asset } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Network, AppWindow, Database, Box, ExternalLink, Info, CheckCircle2, XCircle, AlertTriangle, Hourglass } from 'lucide-react';
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
      <CardContent className="p-4 flex flex-col gap-3 w-full text-sm">
        {/* Top section: Icon, Name, Type, Status */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <AssetIcon className="h-7 w-7 text-primary shrink-0" />
            <div>
              <button onClick={() => onDetailsClick(asset)} className="text-left hover:underline">
                <h3 className="font-headline font-semibold text-base leading-tight" title={asset.name}>{asset.name}</h3>
              </button>
              <p className="text-xs text-muted-foreground">{asset.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 whitespace-nowrap text-xs" title={`Status: ${asset.status}`}>
            <StatusIcon className={cn("h-4 w-4 shrink-0", statusTextColors[asset.status])} />
            <span className={cn("capitalize", statusTextColors[asset.status])}>{asset.status}</span>
          </div>
        </div>

        {/* Middle section: Last Checked, Tags */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Last Checked: {formatDistanceToNow(new Date(asset.lastChecked), { addSuffix: true })}
          </div>

          {asset.tags && asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {asset.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
          {asset.tags && asset.tags.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No tags</p>
          )}
        </div>
        
        {/* Bottom section: Actions */}
        <div className="flex gap-2 justify-end mt-1">
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
