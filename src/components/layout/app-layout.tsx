
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button'; // Button might not be directly used here anymore
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Settings,
  Users,
  // FolderKanban, // Not used
  LogOut,
  Moon,
  Sun,
  Package,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import React from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/', label: 'All Assets', icon: Package },
  { type: 'separator' as const },
  { href: '/settings/users', label: 'Users & Groups', icon: Users, disabled: false },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const getPageTitle = () => {
    if (pathname === '/') return 'All Assets';
    if (pathname === '/dashboard') return 'Dashboard Overview';
    const activeItem = navItems.find(item => item.href === pathname && item.type !== 'separator');
    if (activeItem) return activeItem.label;
    if (pathname.startsWith('/assets/')) return 'Asset Details';
    if (pathname.startsWith('/settings/users')) return 'Users & Groups';
    return 'Prometheus Lens';
  }


  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarHeader className="p-4">
          <AppLogo />
        </SidebarHeader>
        <SidebarContent className="flex-1 p-2">
          <SidebarMenu>
            {navItems.map((item, index) =>
              item.type === 'separator' ? (
                <SidebarSeparator key={`sep-${index}`} className="my-2" />
              ) : (
                item.href && ( 
                  <SidebarMenuItem key={item.label + '-' + item.href}>
                    <Link href={item.href} passHref legacyBehavior={false}>
                      <SidebarMenuButton
                        isActive={pathname === '/' && item.href === '/dashboard' ? true : pathname === item.href}
                        disabled={item.disabled}
                        tooltip={item.label}
                        aria-label={item.label}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                )
              )
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
           <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleTheme} tooltip={resolvedTheme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
                <span>Toggle Theme</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <SidebarMenuButton tooltip="Logout" disabled>
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="flex items-center gap-3 p-2 mt-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="avatar person" />
              <AvatarFallback>PL</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden transition-opacity duration-200">
              <p className="text-sm font-medium text-sidebar-foreground">Admin User</p>
              <p className="text-xs text-muted-foreground">admin@example.com</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <h1 className="font-headline text-xl font-semibold">
            {getPageTitle()}
          </h1>
          <div>
            {/* Placeholder for header actions, e.g., global search or notifications */}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
