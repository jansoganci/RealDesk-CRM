import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';
import { COLORS } from '@/config/colors';

type IconColor = 'teal' | 'green' | 'blue' | 'orange' | 'yellow' | 'purple';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  iconColor: IconColor;
  loading?: boolean;
  className?: string;
}

const iconColorClasses: Record<IconColor, string> = {
  teal: COLORS.dashboard.properties.gradient,
  green: COLORS.dashboard.occupied.gradient,
  blue: COLORS.dashboard.tenants.gradient,
  orange: COLORS.dashboard.contracts.gradient,
  yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
  purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
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
  return (
    <Card
      className={cn(
        `shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow`,
        className
      )}
    >
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
        <div className={cn('p-2 rounded-lg', iconColorClasses[iconColor])}>
          {icon}
        </div>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? '-' : value}</div>
        <p className={`text-xs ${COLORS.gray.text600} mt-1`}>{description}</p>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';
