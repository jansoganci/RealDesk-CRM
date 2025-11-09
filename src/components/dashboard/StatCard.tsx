import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
    gradient: 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700',
    shadow: 'shadow-lg shadow-amber-600/20',
  },
  purple: {
    gradient: 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800',
    shadow: 'shadow-lg shadow-purple-700/20',
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
        'shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in border-gray-200/50 backdrop-blur-sm bg-white/90',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
        <div className={cn(
          'p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110',
          colorConfig.gradient,
          colorConfig.shadow
        )}>
          {icon}
        </div>
        <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
          {loading ? '-' : value}
        </div>
        <p className={`text-xs ${COLORS.gray.text600} mt-1.5 leading-relaxed`}>{description}</p>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';
