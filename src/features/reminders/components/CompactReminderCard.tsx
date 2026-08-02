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
        <span className={cn('text-sm md:text-xs font-medium', COLORS.gray.text600)}>
          {t('card.completedStatus')}
        </span>
      );
    }
    if (days < 0) {
      return (
        <span className={cn('text-base md:text-sm font-bold', COLORS.danger.text)}>
          {t('card.overdue', { days: Math.abs(days) })}
        </span>
      );
    }
    if (isCritical) {
      return (
        <span className={cn('text-base md:text-sm font-bold', COLORS.danger.text)}>
          {t('card.daysRemaining', { days })}
        </span>
      );
    }
    return (
      <span className={cn('text-sm md:text-xs font-medium', COLORS.success.text)}>
        {t('card.daysRemaining', { days })}
      </span>
    );
  };

  // Card styling
  const cardClassName = isCritical
    ? 'border border-l-4 border-border border-l-destructive/40 bg-card/80 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg'
    : 'border border-l-4 border-border border-l-success/40 bg-card/80 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg';

  return (
    <Card className={cn(cardClassName, 'overflow-hidden')}>
      <CardContent className="p-3 md:p-2.5 flex flex-col h-[220px] md:h-[165px] overflow-hidden">
        <div className="flex-1 flex flex-col gap-2 md:gap-1 min-h-0 overflow-hidden">
          {/* Row 1: Status icon + Property address */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <AlarmStatusIcon reminder={reminder} className="flex-shrink-0" size={16} />
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Home className={cn('h-4 w-4 md:h-3.5 md:w-3.5 flex-shrink-0', COLORS.primary.text)} />
              <span className="text-sm md:text-xs font-medium truncate text-foreground">
                {property?.address || t('card.unknownProperty')}
              </span>
            </div>
          </div>

          {/* Row 2: Tenant name */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <User className={cn('h-4 w-4 md:h-3.5 md:w-3.5', COLORS.muted.textLight)} />
            <span className="truncate text-xs text-muted-foreground">
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
              <Calendar className={cn('h-4 w-4 md:h-3.5 md:w-3.5', COLORS.muted.textLight)} />
              <span className="text-xs text-muted-foreground">
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
        <div className="mt-auto flex flex-shrink-0 gap-2 border-t border-border pt-2">
          {!isCompleted && (
            <>
              <Button
                onClick={() => onMarkAsContacted(reminder)}
                disabled={actionLoading === reminder.id}
                variant="secondary"
                size="sm"
                className="h-10 flex-1 bg-success text-sm text-success-foreground hover:bg-success/90 md:h-8 md:text-xs"
              >
                <Check className="h-4 w-4 md:h-3.5 md:w-3.5 mr-1.5" />
                {actionLoading === reminder.id 
                  ? t('loading', { ns: 'common' }) 
                  : t('actions.markContacted')}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 flex-shrink-0 border-border bg-card text-foreground/80 hover:bg-muted md:h-8 md:w-8"
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
              className="h-10 flex-1 border-border bg-card text-sm text-foreground/80 hover:bg-muted md:h-8 md:text-xs"
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
