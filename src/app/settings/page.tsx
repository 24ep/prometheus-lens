import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-4">
        <CardHeader className="px-0 pb-4">
          <CardTitle className="font-headline text-3xl">Settings</CardTitle>
          <CardDescription>Manage your application preferences and configurations.</CardDescription>
        </CardHeader>
        
        <div className="space-y-8">
          <Card className="glassmorphic">
            <CardHeader>
              <CardTitle className="font-headline text-xl">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appName">Application Name</Label>
                <Input id="appName" defaultValue="Prometheus Lens" disabled />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="darkModeToggle" className="flex flex-col space-y-1">
                  <span>Dark Mode</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Enable dark theme across the application. (UI Mock)
                  </span>
                </Label>
                <Switch id="darkModeToggle" aria-label="Toggle dark mode" />
              </div>
               <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
                  <span>Email Notifications</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Receive email updates for critical alerts.
                  </span>
                </Label>
                <Switch id="emailNotifications" checked aria-label="Toggle email notifications" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultDashboardView">Default Dashboard View</Label>
                {/* In a real app this would be a Select component */}
                <Input id="defaultDashboardView" value="Grid View" disabled /> 
                <p className="text-xs text-muted-foreground">This setting is currently illustrative.</p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-[hsl(var(--glass-border-light))] pt-6">
                <Button disabled>Save General Settings</Button>
            </CardFooter>
          </Card>

          <Card className="glassmorphic">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Prometheus Integration</CardTitle>
              <CardDescription>Configure global Prometheus settings if applicable.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                <Label htmlFor="prometheusUrl">Default Prometheus URL (Optional)</Label>
                <Input id="prometheusUrl" placeholder="http://localhost:9090" />
                 <p className="text-xs text-muted-foreground">Global fallback if not specified per asset.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultScrapeInterval">Default Scrape Interval</Label>
                <Input id="defaultScrapeInterval" defaultValue="15s" />
              </div>
            </CardContent>
             <CardFooter className="border-t border-[hsl(var(--glass-border-light))] pt-6">
                <Button disabled>Save Integration Settings</Button>
            </CardFooter>
          </Card>

          {/* Placeholder for User Management / API Keys if they were part of settings */}
           <Card className="glassmorphic">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Account Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">User profile, password changes, and security settings would appear here.</p>
              <Button variant="outline" disabled>Change Password</Button>
              <Button variant="destructive" disabled className="ml-2">Delete Account</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
