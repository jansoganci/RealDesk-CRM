import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { COLORS } from '@/config/colors';

type IconColor = 'navy' | 'emerald' | 'blue' | 'gold' | 'amber' | 'purple';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  iconColor: IconColor;
  loading?: boolean;
  className?: string;
}

const iconColorClasses: Record<IconColor, { gradient: string; shadow: string }> = {
  navy: {
    gradient: COLORS.dashboard.properties.gradient,
    shadow: COLORS.dashboard.properties.shadow,
  },
  emerald: {
    gradient: COLORS.dashboard.occupied.gradient,
    shadow: COLORS.dashboard.occupied.shadow,
  },
  blue: {
    gradient: COLORS.dashboard.tenants.gradient,
    shadow: COLORS.dashboard.tenants.shadow,
  },
  gold: {
    gradient: COLORS.dashboard.contracts.gradient,
    shadow: COLORS.dashboard.contracts.shadow,
  },
  amber: {
    gradient: 'bg-gradient-to-br from-warning via-warning/90 to-warning/80',
    shadow: 'shadow-lg shadow-warning/20',
  },
  purple: {
    gradient: 'bg-gradient-to-br from-info via-info/90 to-info/80',
    shadow: 'shadow-lg shadow-info/20',
  },
};

export const StatCard = React.memo(({
  title,
  value,
  description,
  icon,
  iconColor,
  loading = false,
  className,
}: StatCardProps) => {
  const colorConfig = iconColorClasses[iconColor];

  return (
    <Card
      className={cn(
        'shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in border-border/50 backdrop-blur-sm bg-card/90',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
        {loading ? (
          <>
            <Skeleton className="h-10 w-10 rounded-xl" />
            <CardTitle className="flex-1">
              <Skeleton className="h-4 w-24" />
            </CardTitle>
          </>
        ) : (
          <>
            <div className={cn(
              'p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110',
              colorConfig.gradient,
              colorConfig.shadow
            )}>
              {icon}
            </div>
            <CardTitle className="text-sm font-semibold text-foreground/80">{title}</CardTitle>
          </>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-9 w-20 mb-2" />
            <Skeleton className="h-3 w-full" />
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-foreground">
              {value}
            </div>
            <p className={`text-xs ${COLORS.gray.text600} mt-1.5 leading-relaxed`}>{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';
