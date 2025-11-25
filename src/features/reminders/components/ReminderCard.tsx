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
} from 'lucide-react';
import { format } from 'date-fns';
import { COLORS } from '@/config/colors';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';
import { ReminderBadge } from './ReminderBadge';

/**
 * Reminder Card Component
 * Displays a single reminder with all its details and actions
 */

interface ReminderCardProps {
  reminder: ReminderWithDetails;
  actionLoading: string | null;
  onMarkAsContacted: (reminder: ReminderWithDetails) => void;
}

export function ReminderCard({
  reminder,
  actionLoading,
  onMarkAsContacted,
}: ReminderCardProps) {
  const { t } = useTranslation('reminders');

  const property = reminder.property;
  const owner = property?.owner;
  const tenant = reminder.tenant;
  const rentAmountDisplay =
    typeof reminder.rent_amount === 'number' ? reminder.rent_amount.toFixed(2) : '0.00';
  const expectedRentDisplay =
    typeof reminder.expected_new_rent === 'number' ? reminder.expected_new_rent.toFixed(2) : null;

  return (
    <Card className={`shadow-lg ${COLORS.border.light} ${COLORS.card.bgBlur} hover:shadow-xl transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
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
          <ReminderBadge reminder={reminder} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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
            <p className="font-medium">{t('card.currency', { value: rentAmountDisplay })}</p>
          </div>
          {expectedRentDisplay && (
            <div>
              <p className={`${COLORS.muted.textLight} flex items-center gap-1`}>
                <DollarSign className="h-4 w-4" />
                {t('card.expectedRent')}
              </p>
              <p className={`font-medium ${COLORS.success.text}`}>
                {t('card.currency', { value: expectedRentDisplay })}
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

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => {
              if (onMarkAsContacted) {
                onMarkAsContacted(reminder);
              }
            }}
            disabled={actionLoading === reminder.id}
            className={`flex-1 ${COLORS.success.bg} ${COLORS.success.hover} ${COLORS.text.white}`}
          >
            <Check className="h-4 w-4 mr-2" />
            {actionLoading === reminder.id ? t('loading', { ns: 'common' }) : t('actions.markContacted')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

