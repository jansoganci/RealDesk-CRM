import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  Mail,
  Check,
  ChevronDown,
  ChevronRight,
  User,
  Home,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { COLORS } from '@/config/colors';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

/**
 * CallListRow Component
 * Compact 48-56px row designed as a phone call checklist item
 * Expandable to show full contact details
 */

interface CallListRowProps {
  reminder: ReminderWithDetails;
  actionLoading: string | null;
  onMarkAsContacted: (reminder: ReminderWithDetails) => void;
  isFirstItem?: boolean;
  isCompleted?: boolean;
}

export function CallListRow({
  reminder,
  actionLoading,
  onMarkAsContacted,
  isFirstItem = false,
  isCompleted = false,
}: CallListRowProps) {
  const { t } = useTranslation('reminders');
  const [isExpanded, setIsExpanded] = useState(false);

  const property = reminder.property;
  const owner = property?.owner;
  const tenant = reminder.tenant;
  const currencyCode = 'USD';
  const rentAmountFormatted = formatCurrency(reminder.rent_amount || 0, currencyCode);

  const days = reminder.days_until_end ?? 0;
  const isOverdue = days < 0;
  const isCritical = isOverdue || days <= 30;

  // Get contact info (prefer owner, fallback to tenant)
  const contactPhone = owner?.phone || tenant?.phone;
  const contactEmail = owner?.email || tenant?.email;
  const contactName = owner?.name || tenant?.name;

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div
      className={cn(
        'border-b border-gray-100 dark:border-gray-800 transition-colors',
        isFirstItem &&
          !isCompleted &&
          'bg-amber-50/50 dark:bg-amber-950/30 border-l-4 border-l-amber-500 dark:border-l-amber-400',
        isCompleted && 'opacity-60',
        !isFirstItem && !isCompleted && 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      )}
    >
      {/* Main Row - Collapsed View */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 cursor-pointer',
          'min-h-[52px] md:min-h-[48px]'
        )}
        onClick={toggleExpand}
      >
        {/* Priority Indicator Dot */}
        <div className="flex-shrink-0 w-3">
          {isCompleted ? (
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-500" />
          ) : isOverdue ? (
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          ) : isCritical ? (
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
            {property?.address || t('card.unknownProperty')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {contactName || t('card.unknownTenant')}
          </div>
        </div>

        {/* Days Badge */}
        <div
          className={cn(
            'flex-shrink-0 text-xs font-bold px-2 py-1 rounded min-w-[40px] text-center',
            isCompleted && 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
            !isCompleted && isOverdue && 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
            !isCompleted && !isOverdue && isCritical && 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
            !isCompleted && !isCritical && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
          )}
        >
          {isCompleted ? (
            <Check className="h-3.5 w-3.5 mx-auto" />
          ) : isOverdue ? (
            `-${Math.abs(days)}d`
          ) : (
            `${days}d`
          )}
        </div>

        {/* Action Buttons - Stop propagation to prevent row toggle */}
        <div
          className="flex items-center gap-1.5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Phone Button */}
          {contactPhone && !isCompleted && (
            <a
              href={`tel:${contactPhone}`}
              className={cn(
                'h-11 w-11 flex items-center justify-center rounded-md border transition-colors',
                'border-emerald-300 bg-emerald-50 text-emerald-700',
                'dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
                'hover:bg-emerald-100 hover:border-emerald-400',
                'dark:hover:bg-emerald-900/50 dark:hover:border-emerald-600',
                'active:bg-emerald-200 dark:active:bg-emerald-900'
              )}
              aria-label={t('actions.callOwner')}
            >
              <Phone className="h-5 w-5" />
            </a>
          )}

          {/* Email Button */}
          {contactEmail && !isCompleted && (
            <a
              href={`mailto:${contactEmail}`}
              className={cn(
                'h-11 w-11 flex items-center justify-center rounded-md border transition-colors',
                'border-blue-300 bg-blue-50 text-blue-700',
                'dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
                'hover:bg-blue-100 hover:border-blue-400',
                'dark:hover:bg-blue-900/50 dark:hover:border-blue-600',
                'active:bg-blue-200 dark:active:bg-blue-900'
              )}
              aria-label={t('actions.emailOwner')}
            >
              <Mail className="h-5 w-5" />
            </a>
          )}

          {/* Mark as Contacted Button */}
          {!isCompleted && (
            <button
              onClick={() => onMarkAsContacted(reminder)}
              disabled={actionLoading === reminder.id}
              className={cn(
                'h-11 w-11 flex items-center justify-center rounded-md border transition-colors',
                'border-gray-300 bg-white text-gray-600',
                'dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300',
                'hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600',
                'dark:hover:border-emerald-500 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400',
                'active:bg-emerald-100 dark:active:bg-emerald-900/50',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label={t('actions.markContacted')}
            >
              {actionLoading === reminder.id ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
            </button>
          )}

          {/* Expand/Collapse Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            className={cn(
              'h-11 w-11 flex items-center justify-center rounded-md border transition-colors',
              'border-gray-200 bg-white text-gray-500',
              'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400',
              'hover:bg-gray-50 hover:border-gray-300',
              'dark:hover:bg-gray-800 dark:hover:border-gray-600'
            )}
            aria-label={isExpanded ? t('actions.collapse') : t('actions.expand')}
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 bg-gray-50/50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Property & Contact Info */}
            <div className="space-y-2">
              {/* Full Address */}
              <div className="flex items-start gap-2">
                <Home className={cn('h-4 w-4 mt-0.5 flex-shrink-0', COLORS.primary.text)} />
                <span className="text-slate-700 dark:text-slate-200">{property?.address || '-'}</span>
              </div>

              {/* Owner Info */}
              {owner && (
                <div className="space-y-1.5 ml-6">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('card.ownerContact')}
                  </p>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    <span className="text-slate-700 dark:text-slate-200">{owner.name}</span>
                  </div>
                  {owner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                      <a
                        href={`tel:${owner.phone}`}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        {owner.phone}
                      </a>
                    </div>
                  )}
                  {owner.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                      <a
                        href={`mailto:${owner.email}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {owner.email}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Tenant Info */}
              {tenant && (
                <div className="space-y-1.5 ml-6">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('card.tenant', { name: '' }).replace(':', '').trim()}
                  </p>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    <span className="text-slate-700 dark:text-slate-200">{tenant.name}</span>
                  </div>
                  {tenant.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                      <a
                        href={`tel:${tenant.phone}`}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        {tenant.phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contract Info */}
            <div className="space-y-2">
              {/* Contract End Date */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-500 dark:text-gray-400">{t('card.contractEndDate')}:</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {reminder.end_date
                    ? format(new Date(reminder.end_date), 'dd MMM yyyy')
                    : '-'}
                </span>
              </div>

              {/* Rent Amount */}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-500 dark:text-gray-400">{t('card.currentRent')}:</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{rentAmountFormatted}</span>
              </div>

              {/* Notes */}
              {reminder.reminder_notes && (
                <div className="flex items-start gap-2 mt-2">
                  <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs block mb-0.5">
                      {t('card.notes')}
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">{reminder.reminder_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
