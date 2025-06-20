
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  // PlusCircle, // Icon removed as "New Asset" link is removed
  Settings,
  Users,
  FolderKanban,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
// import { useTheme } from 'next-themes'; // Assuming next-themes is or will be installed for theme toggling
import React from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  // { href: '/assets/new', label: 'New Asset', icon: PlusCircle }, // Removed: New Asset is now a dialog on dashboard
  { href: '/assets', label: 'All Assets', icon: FolderKanban, disabled: true }, // Placeholder
  { type: 'separator' as const },
  { href: '/settings/users', label: 'Users & Groups', icon: Users, disabled: true }, // Placeholder
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // const { theme, setTheme } = useTheme(); // Placeholder for theme toggle

  // Mock theme toggle state for now
  const [currentTheme, setCurrentTheme] = React.useState('light');
  const toggleTheme = () => {
    setCurrentTheme(currentTheme === 'light' ? 'dark' : 'light');
    // In a real app with next-themes: setTheme(theme === 'light' ? 'dark' : 'light');
  };


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
                item.href && ( // Ensure item.href exists before creating a link
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                      <SidebarMenuButton
                        isActive={pathname === item.href}
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
              <SidebarMenuButton onClick={toggleTheme} tooltip={currentTheme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}>
                {currentTheme === 'light' ? <Moon /> : <Sun />}
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
            {navItems.find(item => item.href === pathname && item.type !== 'separator')?.label || 'Prometheus Lens'}
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
