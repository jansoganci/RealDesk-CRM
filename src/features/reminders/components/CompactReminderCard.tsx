import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  Home,
  User,
  Calendar,
  Check,
  FileText,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { COLORS } from '@/config/colors';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';
import { AlarmStatusIcon } from './AlarmStatusIcon';
import { ContractProgressBar } from './ContractProgressBar';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

/**
 * Compact Reminder Card Component
 * Optimized for showing 5-8 contracts on screen
 * Height: ~180px (vs ~400px for full card)
 * Used in Critical tab for visual emphasis
 */

interface CompactReminderCardProps {
  reminder: ReminderWithDetails;
  actionLoading: string | null;
  onMarkAsContacted: (reminder: ReminderWithDetails) => void;
}

export function CompactReminderCard({
  reminder,
  actionLoading,
  onMarkAsContacted,
}: CompactReminderCardProps) {
  const { t } = useTranslation('reminders');

  const property = reminder.property;
  const tenant = reminder.tenant;
  const currencyCode = 'USD';
  const rentAmountFormatted = formatCurrency(reminder.rent_amount || 0, currencyCode);

  // Determine status
  const isCompleted = reminder.rent_increase_reminder_contacted === true;
  const isCritical = reminder.is_overdue || (reminder.days_until_end <= 30);
  const days = reminder.days_until_end ?? 0;

  // Format days display
  const getDaysDisplay = () => {
    if (isCompleted) {
      return (
        <span className={cn('text-sm md:text-xs font-medium', COLORS.gray.text600, 'dark:text-slate-400')}>
          {t('card.completedStatus')}
        </span>
      );
    }
    if (days < 0) {
      return (
        <span className={cn('text-base md:text-sm font-bold', COLORS.danger.text, 'dark:text-red-400')}>
          {t('card.overdue', { days: Math.abs(days) })}
        </span>
      );
    }
    if (isCritical) {
      return (
        <span className={cn('text-base md:text-sm font-bold', COLORS.danger.text, 'dark:text-red-400')}>
          {t('card.daysRemaining', { days })}
        </span>
      );
    }
    return (
      <span className={cn('text-sm md:text-xs font-medium', COLORS.success.text, 'dark:text-emerald-400')}>
        {t('card.daysRemaining', { days })}
      </span>
    );
  };

  // Card styling
  const cardClassName = isCritical
    ? 'shadow-md border border-gray-100 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow border-l-4 border-l-red-500 dark:border-slate-800 dark:border-l-red-500 dark:bg-slate-900/80 dark:backdrop-blur-sm'
    : 'shadow-md border border-gray-100 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow border-l-4 border-l-green-500 dark:border-slate-800 dark:border-l-emerald-600 dark:bg-slate-900/80 dark:backdrop-blur-sm';

  return (
    <Card className={cn(cardClassName, 'overflow-hidden')}>
      <CardContent className="p-3 md:p-2.5 flex flex-col h-[220px] md:h-[165px] overflow-hidden">
        <div className="flex-1 flex flex-col gap-2 md:gap-1 min-h-0 overflow-hidden">
          {/* Row 1: Status icon + Property address */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <AlarmStatusIcon reminder={reminder} className="flex-shrink-0" size={16} />
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Home className={cn('h-4 w-4 md:h-3.5 md:w-3.5 flex-shrink-0', COLORS.primary.text, 'dark:text-blue-400')} />
              <span className="text-sm md:text-xs font-medium truncate text-foreground">
                {property?.address || t('card.unknownProperty')}
              </span>
            </div>
          </div>

          {/* Row 2: Tenant name */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <User className={cn('h-4 w-4 md:h-3.5 md:w-3.5', COLORS.muted.textLight, 'dark:text-slate-400')} />
            <span className="text-xs text-gray-600 dark:text-slate-400 truncate">
              {t('card.tenant', { name: tenant?.name ?? t('card.unknownTenant') })}
            </span>
          </div>

          {/* Row 3: Mini progress bar (4px height, no label) */}
          <div className="flex-shrink-0 py-0.5">
            <ContractProgressBar 
              reminder={reminder} 
              showLabel={false}
              showDaysUntilCritical={false}
            />
          </div>

          {/* Row 4: End date | Days left */}
          <div className="flex items-center justify-between text-xs md:text-xs flex-shrink-0">
            <div className="flex items-center gap-1">
              <Calendar className={cn('h-4 w-4 md:h-3.5 md:w-3.5', COLORS.muted.textLight, 'dark:text-slate-400')} />
              <span className="text-gray-600 dark:text-slate-400 text-xs">
                {reminder.end_date ? format(new Date(reminder.end_date), 'dd MMM yyyy') : t('card.noDate')}
              </span>
            </div>
            {getDaysDisplay()}
          </div>

          {/* Row 5: Rent amount */}
          <div className="text-sm md:text-xs font-semibold flex-shrink-0 text-foreground">
            {rentAmountFormatted}
          </div>
        </div>

        {/* Row 6: Action buttons (always at bottom, inside card) */}
        <div className="flex gap-2 pt-2 mt-auto flex-shrink-0 border-t border-gray-100 dark:border-slate-800">
          {!isCompleted && (
            <>
              <Button
                onClick={() => onMarkAsContacted(reminder)}
                disabled={actionLoading === reminder.id}
                variant="secondary"
                size="sm"
                className="flex-1 h-10 md:h-8 text-sm md:text-xs dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500"
              >
                <Check className="h-4 w-4 md:h-3.5 md:w-3.5 mr-1.5" />
                {actionLoading === reminder.id 
                  ? t('loading', { ns: 'common' }) 
                  : t('actions.markContacted')}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 md:h-8 md:w-8 flex-shrink-0 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => {
                  // TODO: Add note functionality
                }}
                title={t('actions.addNote')}
              >
                <FileText className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </>
          )}
          {isCompleted && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 md:h-8 text-sm md:text-xs bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => {
                // TODO: View contract functionality
              }}
            >
              <Eye className="h-4 w-4 md:h-3.5 md:w-3.5 mr-1.5" />
              {t('actions.viewContract')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
