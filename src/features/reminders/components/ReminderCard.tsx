import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  Home,
  User,
  Phone,
  Mail,
  DollarSign,
  FileText,
  Calendar,
  Bell,
  Check,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { COLORS } from '@/config/colors';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';
import { ReminderBadge } from './ReminderBadge';
import { AlarmStatusIcon } from './AlarmStatusIcon';
import { ContractProgressBar } from './ContractProgressBar';
import { formatCurrency } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Reminder Card Component
 * Displays a single reminder with all its details and actions
 */

interface ReminderCardProps {
  reminder: ReminderWithDetails;
  actionLoading: string | null;
  onMarkAsContacted: (reminder: ReminderWithDetails) => void;
  activeTab?: string; // Optional: 'critical' | 'underWatch' | 'completed' for conditional rendering
}

export function ReminderCard({
  reminder,
  actionLoading,
  onMarkAsContacted,
  activeTab,
}: ReminderCardProps) {
  const { t } = useTranslation('reminders');
  const { currency: userCurrency } = useAuth();

  const property = reminder.property;
  const owner = property?.owner;
  const tenant = reminder.tenant;
  
  // Get currency code (from contract, user preference, or default to TRY)
  const currencyCode = reminder.currency || userCurrency || 'TRY';
  
  // Format rent amounts with proper currency symbol
  const rentAmountFormatted = formatCurrency(reminder.rent_amount || 0, currencyCode);
  const expectedRentFormatted = reminder.expected_new_rent 
    ? formatCurrency(reminder.expected_new_rent, currencyCode)
    : null;

  // Determine if reminder is completed
  const isCompleted = reminder.rent_increase_reminder_contacted === true;
  
  // Determine if reminder is in critical zone
  const isCritical = reminder.is_overdue || (reminder.days_until_end <= 30);
  
  // Determine if reminder is under watch
  const isUnderWatch = !isCompleted && !isCritical && reminder.rent_increase_reminder_enabled;

  // Format days remaining display
  const getDaysRemainingDisplay = () => {
    const days = reminder.days_until_end ?? 0;
    
    if (isCompleted) {
      return (
        <span className={`text-sm ${COLORS.gray.text600}`}>
          {t('card.completedStatus')}
        </span>
      );
    }
    
    if (days < 0) {
      return (
        <span className={`text-lg font-bold ${COLORS.danger.text}`}>
          {t('card.overdue', { days: Math.abs(days) })}
        </span>
      );
    }
    
    if (isCritical) {
      return (
        <span className={`text-lg font-bold ${COLORS.danger.text}`}>
          {t('card.daysRemaining', { days })}
        </span>
      );
    }
    
    if (isUnderWatch) {
      return (
        <span className={`text-sm ${COLORS.success.text}`}>
          {t('card.daysUntilAlert', { days: days - 30 })}
        </span>
      );
    }
    
    return (
      <span className="text-sm text-muted-foreground">
        {t('card.daysRemaining', { days })}
      </span>
    );
  };

  // Determine card styling based on tab/status
  const getCardClassName = () => {
    if (activeTab === 'critical' || isCritical) {
      return `shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow border-l-4 border-red-500`;
    }
    if (activeTab === 'underWatch' || isUnderWatch) {
      return `shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow border-l-4 border-green-500`;
    }
    if (activeTab === 'completed' || isCompleted) {
      return `shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow border-l-4 border-gray-400 opacity-90`;
    }
    return `shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow`;
  };

  return (
    <Card className={getCardClassName()}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlarmStatusIcon reminder={reminder} className="flex-shrink-0" />
              <Home className={`h-5 w-5 ${COLORS.primary.text}`} />
              {property?.address || t('card.unknownProperty')}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              {t('card.tenant', {
                name: tenant?.name ?? t('card.unknownTenant'),
              })}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ReminderBadge reminder={reminder} />
            {getDaysRemainingDisplay()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <ContractProgressBar 
          reminder={reminder} 
          showLabel={true}
          showDaysUntilCritical={true}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className={`${COLORS.muted.textLight} flex items-center gap-1`}>
              <Calendar className="h-4 w-4" />
              {t('card.contractEndDate')}
            </p>
            <p className="font-medium">{reminder.end_date ? format(new Date(reminder.end_date), 'MMM dd, yyyy') : t('card.noDate')}</p>
          </div>
          <div>
            <p className={`${COLORS.muted.textLight} flex items-center gap-1`}>
              <Bell className="h-4 w-4" />
              {t('card.reminderDate')}
            </p>
            <p className="font-medium">
              {reminder.reminder_date
                ? format(new Date(reminder.reminder_date), 'MMM dd, yyyy')
                : t('card.noReminderDate')}
            </p>
          </div>
          <div>
            <p className={`${COLORS.muted.textLight} flex items-center gap-1`}>
              <DollarSign className="h-4 w-4" />
              {t('card.currentRent')}
            </p>
            <p className="font-medium">{rentAmountFormatted}</p>
          </div>
          {expectedRentFormatted && (
            <div>
              <p className={`${COLORS.muted.textLight} flex items-center gap-1`}>
                <DollarSign className="h-4 w-4" />
                {t('card.expectedRent')}
              </p>
              <p className={`font-medium ${COLORS.success.text}`}>
                {expectedRentFormatted}
              </p>
            </div>
          )}
        </div>

        {owner && (
          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-2">{t('card.ownerContact')}</p>
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <User className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                {owner.name}
              </p>
              {owner.email && (
                <p className="flex items-center gap-2">
                  <Mail className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <a href={`mailto:${owner.email}`} className={`${COLORS.primary.text} hover:underline`}>
                    {owner.email}
                  </a>
                </p>
              )}
              {owner.phone && (
                <p className="flex items-center gap-2">
                  <Phone className={`h-4 w-4 ${COLORS.muted.textLight}`} />
                  <a href={`tel:${owner.phone}`} className={`${COLORS.primary.text} hover:underline`}>
                    {owner.phone}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}

        {reminder.reminder_notes && (
          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-1 flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {t('card.notes')}
            </p>
            <p className={`text-sm ${COLORS.gray.text600}`}>{reminder.reminder_notes}</p>
          </div>
        )}

        {/* Action Buttons - Different per tab (design system compliant) */}
        <div className="flex gap-2 pt-2">
          {activeTab === 'critical' && !isCompleted && (
            <>
              <Button
                onClick={() => {
                  if (onMarkAsContacted) {
                    onMarkAsContacted(reminder);
                  }
                }}
                disabled={actionLoading === reminder.id}
                variant="secondary"
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                {actionLoading === reminder.id ? t('loading', { ns: 'common' }) : t('actions.markContacted')}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 flex-shrink-0"
                onClick={() => {
                  // TODO: Add note functionality
                  console.log('Add note for reminder:', reminder.id);
                }}
                title={t('actions.addNote')}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {activeTab === 'underWatch' && !isCompleted && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 flex-shrink-0"
                onClick={() => {
                  // TODO: View details functionality
                  console.log('View details for reminder:', reminder.id);
                }}
                title={t('actions.viewDetails')}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 flex-shrink-0"
                onClick={() => {
                  // TODO: Add note functionality
                  console.log('Add note for reminder:', reminder.id);
                }}
                title={t('actions.addNote')}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {activeTab === 'completed' && isCompleted && (
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              onClick={() => {
                // TODO: View contract functionality
                console.log('View contract for reminder:', reminder.id);
              }}
              title={t('actions.viewContract')}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          
          {/* Fallback for old tabs or when activeTab is not provided */}
          {(!activeTab || (activeTab !== 'critical' && activeTab !== 'underWatch' && activeTab !== 'completed')) && !isCompleted && (
            <Button
              onClick={() => {
                if (onMarkAsContacted) {
                  onMarkAsContacted(reminder);
                }
              }}
              disabled={actionLoading === reminder.id}
              variant="secondary"
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              {actionLoading === reminder.id ? t('loading', { ns: 'common' }) : t('actions.markContacted')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}