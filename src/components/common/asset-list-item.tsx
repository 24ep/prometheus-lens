
"use client";

import type { Asset } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Server, Network, AppWindow, Database, Box, ExternalLink, Info, CheckCircle2, XCircle, AlertTriangle, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AssetListItemProps {
  asset: Asset;
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

export function AssetListItem({ asset }: AssetListItemProps) {
  const AssetIcon = assetIcons[asset.type];
  const StatusIcon = statusIcons[asset.status];

  return (
    <Card className="glassmorphic overflow-hidden transition-all hover:shadow-lg w-full">
      <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-grow min-w-0">
          <AssetIcon className="h-7 w-7 text-primary shrink-0" />
          <div className="flex-grow overflow-hidden">
            <Link href={`/assets/${asset.id}`} className="hover:underline" title={asset.name}>
                <h3 className="font-headline text-base font-semibold leading-tight truncate">{asset.name}</h3>
            </Link>
            <p className="text-xs text-muted-foreground">{asset.type}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-xs w-full sm:w-auto">
            <div className="flex items-center gap-1.5 whitespace-nowrap" title={`Status: ${asset.status}`}>
              <StatusIcon className={cn("h-4 w-4 shrink-0", statusTextColors[asset.status])} />
              <span className={cn("capitalize", statusTextColors[asset.status])}>{asset.status}</span>
            </div>
            <div className="text-muted-foreground whitespace-nowrap">
                Last checked: {formatDistanceToNow(new Date(asset.lastChecked), { addSuffix: true })}
            </div>
        </div>
        
        {asset.tags && asset.tags.length > 0 && (
          <div className="hidden lg:flex flex-wrap gap-1.5 shrink-0">
            {asset.tags.slice(0, 2).map(tag => ( 
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
            {asset.tags.length > 2 && <Badge variant="secondary" className="text-xs">+{asset.tags.length - 2}</Badge>}
          </div>
        )}

        <div className="flex gap-2 shrink-0">
          <Link href={`/assets/${asset.id}`}>
            <Button variant="outline" size="sm">
              <Info className="mr-1.5 h-3.5 w-3.5" />
              Details
            </Button>
          </Link>
          {asset.grafanaLink && (
            <a href={asset.grafanaLink} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-primary hover:text-accent-foreground hover:bg-accent">
                Grafana <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
