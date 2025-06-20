import { Aperture } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LogoIcon({ className, size = 8 }: { className?: string, size?: number }) {
  return <Aperture className={cn(`h-${size} w-${size}`, className)} />;
}

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoIcon className="text-primary" size={7}/>
      <span className="font-headline text-xl font-semibold text-foreground">
        Prometheus Lens
      </span>
    </div>
  );
}
