
import { Aperture } from 'lucide-react';
import { cn } from '@/lib/utils';
// SheetTitle import removed

export function LogoIcon({ className, size = 8 }: { className?: string, size?: number }) {
  return <Aperture className={cn(`h-${size} w-${size}`, className)} />;
}

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoIcon className="text-primary" size={7}/>
      {/* Reverted to a simple div for the text */}
      <div className={cn("font-headline text-xl font-semibold text-foreground")}>
        Prometheus Lens
      </div>
    </div>
  );
}
