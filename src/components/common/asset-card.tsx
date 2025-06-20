
"use client";

import type { Asset } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Network, AppWindow, Database, Box, ExternalLink, Zap, XCircle, AlertTriangle, CheckCircle2, Hourglass, Info, Container } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AssetCardProps {
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
  Kubernetes: Box,
  Docker: Container,
  "Ubuntu Server": Server,
  "Windows Server": Server,
};

const statusColors: Record<Asset['status'], string> = {
  connected: 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400 dark:border-green-500/50',
  disconnected: 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400 dark:border-red-500/50',
  error: 'bg-amber-500/20 text-amber-700 border-amber-500/30 dark:text-amber-400 dark:border-amber-500/50',
  pending: 'bg-blue-500/20 text-blue-700 border-blue-500/30 dark:text-blue-400 dark:border-blue-500/50',
};

const statusIcons: Record<Asset['status'], React.ElementType> = {
  connected: CheckCircle2,
  disconnected: XCircle,
  error: AlertTriangle,
  pending: Hourglass,
};

export function AssetCard({ asset, onDetailsClick }: AssetCardProps) {
  const Icon = assetIcons[asset.type] || Server; // Fallback to Server icon if type is new and unmapped
  const StatusIcon = statusIcons[asset.status];

  return (
    <Card className="glassmorphic overflow-hidden transition-all hover:shadow-xl hover:scale-[1.015] flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-lg leading-tight">{asset.name}</CardTitle>
          </div>
          <Badge variant="outline" className={cn("capitalize text-xs", statusColors[asset.status])}>
            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
            {asset.status}
          </Badge>
        </div>
        <CardDescription className="pt-1 text-xs">
          {asset.type} &bull; Last checked: {formatDistanceToNow(new Date(asset.lastChecked), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-4">
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {asset.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {asset.configuration?.job_name ? `Job: ${asset.configuration.job_name}` : 
           asset.configuration?.static_configs?.[0]?.targets?.[0] ? `Target: ${asset.configuration.static_configs[0].targets[0]}` : 
           'No primary target listed.'}
        </p>
      </CardContent>
      <CardFooter className="pt-0 border-t border-[hsl(var(--glass-border-light))] bg-white/10 dark:bg-black/10">
        <div className="flex w-full justify-between items-center mt-4">
          <Button variant="outline" size="sm" onClick={() => onDetailsClick(asset)}>
            <Info className="mr-2 h-4 w-4" />
            Details
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
            Grafana <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

