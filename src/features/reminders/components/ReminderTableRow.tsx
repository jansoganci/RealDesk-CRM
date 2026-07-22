import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TableRow, TableCell } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import {
  User,
  Phone,
  Mail,
  Check,
  FileText,
  Eye,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { COLORS } from '@/config/colors';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';
import { AlarmStatusIcon } from './AlarmStatusIcon';
import { ContractProgressBar } from './ContractProgressBar';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

/**
 * Reminder Table Row Component
 * Compact table row for Under Watch and Completed tabs
 * Height: 60px per row
 * Expandable: Click to show owner contact details
 */

interface ReminderTableRowProps {
  reminder: ReminderWithDetails;
  actionLoading: string | null;
  onMarkAsContacted: (reminder: ReminderWithDetails) => void;
  isCompleted?: boolean;
}

export function ReminderTableRow({
  reminder,
  actionLoading,
  onMarkAsContacted,
  isCompleted = false,
}: ReminderTableRowProps) {
  const { t } = useTranslation('reminders');
  const [isExpanded, setIsExpanded] = useState(false);

  const property = reminder.property;
  const owner = property?.owner;
  const tenant = reminder.tenant;
  const currencyCode = 'USD';
  const rentAmountFormatted = formatCurrency(reminder.rent_amount || 0, currencyCode);
  
  // Format rent as compact.
  const rentCompact = rentAmountFormatted.replace(/\.000$/, 'K').replace(/\./g, ',');

  const days = reminder.days_until_end ?? 0;
  const isCritical = reminder.is_overdue || (days <= 30);

  // Format days display
  const getDaysDisplay = () => {
    if (isCompleted) {
      return (
        <span className={cn('text-sm font-medium', COLORS.gray.text600, 'dark:text-slate-400')}>
          {t('card.completedStatus')}
        </span>
      );
    }
    if (days < 0) {
      return (
        <span className={cn('text-base font-bold', COLORS.danger.text, 'dark:text-red-400')}>
          {Math.abs(days)}
        </span>
      );
    }
    if (isCritical) {
      return (
        <span className={cn('text-base font-bold', COLORS.danger.text, 'dark:text-red-400')}>
          {days}
        </span>
      );
    }
    return (
      <span className={cn('text-sm font-medium', COLORS.success.text, 'dark:text-emerald-400')}>
        {days}
      </span>
    );
  };

  return (
    <>
      <TableRow
        className={cn(
          'h-[60px] hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer',
          isCompleted && 'opacity-75'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Status Icon */}
        <TableCell className="w-[40px]">
          <AlarmStatusIcon reminder={reminder} size={18} />
        </TableCell>

        {/* Property Address */}
        <TableCell className="min-w-[200px] flex-1">
          <div className="font-medium text-sm truncate max-w-[250px] text-foreground">
            {property?.address || t('card.unknownProperty')}
          </div>
        </TableCell>

        {/* Tenant Name */}
        <TableCell className="w-[120px] hidden md:table-cell">
          <div className="text-sm truncate text-foreground">
            {tenant?.name || t('card.unknownTenant')}
          </div>
        </TableCell>

        {/* End Date */}
        <TableCell className="w-[100px]">
          <div className="text-sm text-foreground">
            {reminder.end_date ? format(new Date(reminder.end_date), 'dd MMM') : '-'}
          </div>
        </TableCell>

        {/* Days Left */}
        <TableCell className="w-[80px]">
          {getDaysDisplay()}
        </TableCell>

        {/* Rent */}
        <TableCell className="w-[100px] hidden lg:table-cell">
          <div className="text-sm font-medium text-foreground">
            {rentCompact}
          </div>
        </TableCell>

        {/* Mini Progress Bar */}
        <TableCell className="w-[120px] hidden xl:table-cell">
          <div className="w-[100px]">
            <ContractProgressBar 
              reminder={reminder} 
              showLabel={false}
              showDaysUntilCritical={false}
            />
          </div>
        </TableCell>

        {/* Actions */}
        <TableCell 
          className="w-[120px]"
          onClick={(e) => e.stopPropagation()} // Prevent row expansion when clicking actions
        >
          <div className="flex items-center gap-1.5">
            {!isCompleted && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 md:h-8 md:w-8 border-emerald-300 bg-white text-gray-800 hover:bg-emerald-50 hover:border-emerald-400 dark:border-emerald-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-950/40 dark:hover:border-emerald-500"
                  onClick={() => onMarkAsContacted(reminder)}
                  disabled={actionLoading === reminder.id}
                  title={t('actions.markContacted')}
                >
                  <Check className={cn(
                    'h-4 w-4',
                    actionLoading === reminder.id ? 'animate-spin' : ''
                  )} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 md:h-8 md:w-8 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Add note functionality
                  }}
                  title={t('actions.addNote')}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </>
            )}
            {isCompleted && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 md:h-8 md:w-8 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: View contract functionality
                }}
                title={t('actions.viewContract')}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 md:h-8 md:w-8 bg-white text-gray-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              title={isExpanded ? 'Gizle' : 'Göster'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Row - Owner Contact Details */}
      {isExpanded && owner && (
        <TableRow className="bg-gray-50 dark:bg-slate-900/70">
          <TableCell colSpan={8} className="py-3">
            <div className="flex items-start gap-6 text-sm">
              <div>
                <p className={cn('font-semibold mb-2', COLORS.gray.text900, 'dark:text-slate-100')}>
                  {t('card.ownerContact')}
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className={cn('h-4 w-4', COLORS.muted.textLight, 'dark:text-slate-400')} />
                    <span className={cn(COLORS.gray.text700, 'dark:text-slate-300')}>{owner.name}</span>
                  </div>
                  {owner.email && (
                    <div className="flex items-center gap-2">
                      <Mail className={cn('h-4 w-4', COLORS.muted.textLight, 'dark:text-slate-400')} />
                      <a 
                        href={`mailto:${owner.email}`} 
                        className={cn(COLORS.primary.text, 'hover:underline dark:text-blue-400')}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {owner.email}
                      </a>
                    </div>
                  )}
                  {owner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className={cn('h-4 w-4', COLORS.muted.textLight, 'dark:text-slate-400')} />
                      <a 
                        href={`tel:${owner.phone}`} 
                        className={cn(COLORS.primary.text, 'hover:underline dark:text-blue-400')}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {owner.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              {reminder.reminder_notes && (
                <div className="flex-1">
                  <p className={cn('font-semibold mb-2', COLORS.gray.text900, 'dark:text-slate-100')}>
                    {t('card.notes')}
                  </p>
                  <p className={cn('text-sm', COLORS.gray.text600, 'dark:text-slate-400')}>
                    {reminder.reminder_notes}
                  </p>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
