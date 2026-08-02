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
        'border-b border-border transition-colors',
        isFirstItem &&
          !isCompleted &&
          'border-l-4 border-l-warning/40 bg-warning/15',
        isCompleted && 'opacity-60',
        !isFirstItem && !isCompleted && 'hover:bg-muted/50'
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
            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
          ) : isOverdue ? (
            <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          ) : isCritical ? (
            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-medium text-foreground">
            {property?.address || t('card.unknownProperty')}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {contactName || t('card.unknownTenant')}
          </div>
        </div>

        {/* Days Badge */}
        <div
          className={cn(
            'flex-shrink-0 text-xs font-bold px-2 py-1 rounded min-w-[40px] text-center',
            isCompleted && 'bg-muted text-muted-foreground',
            !isCompleted && isOverdue && 'bg-destructive/15 text-destructive',
            !isCompleted && !isOverdue && isCritical && 'bg-destructive/15 text-destructive',
            !isCompleted && !isCritical && 'bg-success/15 text-success'
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
                'border-success/40 bg-success/15 text-success',
                'hover:border-success/60 hover:bg-success/25',
                'active:bg-success/30'
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
                'border-primary/40 bg-primary/10 text-primary',
                'hover:border-primary/60 hover:bg-primary/20',
                'active:bg-primary/25'
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
                'border-border bg-card text-foreground/80',
                'hover:border-success/40 hover:bg-success/15 hover:text-success',
                'active:bg-success/25',
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
              'border-border bg-card text-muted-foreground',
              'hover:border-border hover:bg-muted/50'
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
        <div className="border-t border-border bg-muted/50 px-3 pb-3 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Property & Contact Info */}
            <div className="space-y-2">
              {/* Full Address */}
              <div className="flex items-start gap-2">
                <Home className={cn('h-4 w-4 mt-0.5 flex-shrink-0', COLORS.primary.text)} />
                <span className="text-foreground/80">{property?.address || '-'}</span>
              </div>

              {/* Owner Info */}
              {owner && (
                <div className="space-y-1.5 ml-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('card.ownerContact')}
                  </p>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-foreground/80">{owner.name}</span>
                  </div>
                  {owner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <a
                        href={`tel:${owner.phone}`}
                        className="text-success hover:underline"
                      >
                        {owner.phone}
                      </a>
                    </div>
                  )}
                  {owner.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <a
                        href={`mailto:${owner.email}`}
                        className="text-primary hover:underline"
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('card.tenant', { name: '' }).replace(':', '').trim()}
                  </p>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-foreground/80">{tenant.name}</span>
                  </div>
                  {tenant.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <a
                        href={`tel:${tenant.phone}`}
                        className="text-success hover:underline"
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
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('card.contractEndDate')}:</span>
                <span className="font-medium text-foreground/80">
                  {reminder.end_date
                    ? format(new Date(reminder.end_date), 'dd MMM yyyy')
                    : '-'}
                </span>
              </div>

              {/* Rent Amount */}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('card.currentRent')}:</span>
                <span className="font-medium text-foreground/80">{rentAmountFormatted}</span>
              </div>

              {/* Notes */}
              {reminder.reminder_notes && (
                <div className="flex items-start gap-2 mt-2">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="mb-0.5 block text-xs text-muted-foreground">
                      {t('card.notes')}
                    </span>
                    <p className="text-sm text-foreground/80">{reminder.reminder_notes}</p>
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
