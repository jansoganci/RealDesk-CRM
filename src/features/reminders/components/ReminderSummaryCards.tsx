import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Shield, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { COLORS } from '@/config/colors';
import { useReminderMetrics } from '../hooks/useReminderMetrics';

/**
 * Reminder Summary Cards Component
 * Displays three summary cards at the top of the Reminders page
 * 
 * Cards:
 * - Total Active: All reminders with reminder enabled
 * - Critical: Reminders in critical zone (<= 30 days or overdue)
 * - Pending Actions: Critical reminders that haven't been contacted
 */

interface ReminderSummaryCardsProps {
  reminders: ReminderWithDetails[];
  loading?: boolean;
  onCardClick?: (tab: 'critical' | 'underWatch' | 'completed') => void;
  className?: string;
}

interface SummaryMetric {
  value: number;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function ReminderSummaryCards({
  reminders,
  loading = false,
  onCardClick,
  className,
}: ReminderSummaryCardsProps) {
  const { t } = useTranslation('reminders');

  // Calculate metrics using hook
  const { metrics } = useReminderMetrics({ reminders });

  // Build cards array from metrics
  const cards: SummaryMetric[] = [
    {
      value: metrics.totalActive,
      label: t('summary.totalActive'),
      description: t('summary.totalActiveDescription'),
      icon: <Shield className="h-5 w-5 text-primary-foreground" />,
      iconColor: 'bg-gradient-to-br from-primary to-primary/80',
      trend: metrics.trends?.totalActive,
    },
    {
      value: metrics.critical,
      label: t('summary.critical'),
      description: t('summary.criticalDescription'),
      icon: <AlertCircle className="h-5 w-5 text-destructive-foreground" />,
      iconColor: 'bg-gradient-to-br from-destructive to-destructive/80',
      trend: metrics.trends?.critical,
    },
    {
      value: metrics.pendingActions,
      label: t('summary.pendingActions'),
      description: t('summary.pendingActionsDescription'),
      icon: <CheckCircle2 className="h-5 w-5 text-secondary-foreground" />,
      iconColor: 'bg-secondary',
      trend: metrics.trends?.pendingActions,
    },
  ];

  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="border-border bg-card/80 shadow-lg backdrop-blur-sm"
          >
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <CardTitle className="flex-1">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const handleCardClick = (index: number) => {
    if (!onCardClick) return;
    
    // Map card index to tab
    switch (index) {
      case 0: // Total Active - could go to "Under Watch" or first available tab
        onCardClick('underWatch');
        break;
      case 1: // Critical
        onCardClick('critical');
        break;
      case 2: // Pending Actions
        onCardClick('critical');
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {cards.map((metric, index) => (
        <Card
          key={index}
          className={cn(
            'shadow-luxury hover:shadow-luxury-lg transition-all duration-300 hover:-translate-y-1',
            'border-border bg-card/90 backdrop-blur-sm',
            onCardClick && 'cursor-pointer',
            className
          )}
          onClick={() => handleCardClick(index)}
        >
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className={cn(
              'p-2.5 rounded-xl transition-transform duration-300',
              metric.iconColor,
              'shadow-lg'
            )}>
              {metric.icon}
            </div>
            <CardTitle className="text-sm font-semibold text-foreground/80">
              {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-3xl font-bold text-transparent">
              {metric.value}
            </div>
            <p
              className={cn(
                'text-xs mt-1.5 leading-relaxed',
                COLORS.gray.text600,
              )}
            >
              {metric.description}
            </p>
            {metric.trend && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                {metric.trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span
                  className={
                    metric.trend.isPositive
                      ? 'text-success'
                      : 'text-destructive'
                  }
                >
                  {metric.trend.value > 0 ? '+' : ''}{metric.trend.value}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
