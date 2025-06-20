
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Asset } from '@/types';
import { CheckCircle2, XCircle, AlertTriangle, Hourglass, Package, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalAssets: number;
  connected: number;
  disconnected: number;
  error: number;
  pending: number;
}

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    connected: 0,
    disconnected: 0,
    error: 0,
    pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/assets');
      if (!response.ok) {
        throw new Error('Failed to fetch assets for dashboard');
      }
      const assetsData: Asset[] = await response.json();
      
      const newStats: DashboardStats = {
        totalAssets: assetsData.length,
        connected: assetsData.filter(asset => asset.status === 'connected').length,
        disconnected: assetsData.filter(asset => asset.status === 'disconnected').length,
        error: assetsData.filter(asset => asset.status === 'error').length,
        pending: assetsData.filter(asset => asset.status === 'pending').length,
      };
      setStats(newStats);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      setStats({ totalAssets: 0, connected: 0, disconnected: 0, error: 0, pending: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statItems = [
    { title: 'Total Assets', value: stats.totalAssets, icon: Package, color: 'text-primary' },
    { title: 'Connected', value: stats.connected, icon: CheckCircle2, color: 'text-green-500' },
    { title: 'Disconnected', value: stats.disconnected, icon: XCircle, color: 'text-red-500' },
    { title: 'Errors', value: stats.error, icon: AlertTriangle, color: 'text-amber-500' },
    { title: 'Pending', value: stats.pending, icon: Hourglass, color: 'text-blue-500' },
  ];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="text-center py-10">
          <p>Loading dashboard data...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">A high-level summary of your asset monitoring status.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        {statItems.map(item => (
          <Card key={item.title} className="glassmorphic">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href="/">
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" /> View All Assets
            </Button>
          </Link>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
