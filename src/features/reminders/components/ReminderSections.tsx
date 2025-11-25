import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../../components/common/EmptyState';
import { ReminderCard } from './ReminderCard';
import { AlertCircle, Bell, Check, Calendar, FileText } from 'lucide-react';
import { COLORS } from '@/config/colors';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';

/**
 * Reminder Sections Component
 * Renders reminder sections based on active tab with empty states and callout banners
 */

interface ReminderSectionsProps {
  activeTab: string;
  overdueReminders: ReminderWithDetails[];
  upcomingReminders: ReminderWithDetails[];
  scheduledReminders: ReminderWithDetails[];
  expiredContracts: ReminderWithDetails[];
  actionLoading: string | null;
  onMarkAsContacted: (reminder: ReminderWithDetails) => void;
}

export function ReminderSections({
  activeTab,
  overdueReminders,
  upcomingReminders,
  scheduledReminders,
  expiredContracts,
  actionLoading,
  onMarkAsContacted,
}: ReminderSectionsProps) {
  const { t } = useTranslation('reminders');

  // Overdue section
  if (activeTab === 'overdue' || !activeTab) {
    return (
      <div className="space-y-4">
        {overdueReminders.length === 0 ? (
          <EmptyState
            title={t('empty.allClear')}
            description={t('empty.overdueDescription')}
            icon={<Check className={`h-12 w-12 ${COLORS.success.text}`} />}
            showAction={false}
          />
        ) : (
          <>
            <div className={`${COLORS.danger.bgLight} border ${COLORS.danger.border} rounded-lg p-4 shadow-md`}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`h-5 w-5 ${COLORS.danger.text} mt-0.5`} />
                <div>
                  <h3 className={`font-semibold ${COLORS.danger.textDark}`}>
                    {t('sections.overdue.calloutTitle')}
                  </h3>
                  <p className={`text-sm ${COLORS.danger.textDark} mt-1`}>
                    {t('sections.overdue.calloutDescription', { count: overdueReminders.length })}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {overdueReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  actionLoading={actionLoading}
                  onMarkAsContacted={onMarkAsContacted}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Upcoming section
  if (activeTab === 'upcoming') {
    return (
      <div className="space-y-4">
        {upcomingReminders.length === 0 ? (
          <EmptyState
            title={t('empty.upcoming')}
            description={t('empty.upcomingDescription')}
            icon={<Calendar className={`h-12 w-12 ${COLORS.muted.text}`} />}
            showAction={false}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                actionLoading={actionLoading}
                onMarkAsContacted={onMarkAsContacted}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Scheduled section
  if (activeTab === 'scheduled') {
    return (
      <div className="space-y-4">
        {scheduledReminders.length === 0 ? (
          <EmptyState
            title={t('empty.scheduled')}
            description={t('empty.scheduledDescription')}
            icon={<Bell className={`h-12 w-12 ${COLORS.muted.text}`} />}
            showAction={false}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {scheduledReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                actionLoading={actionLoading}
                onMarkAsContacted={onMarkAsContacted}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Expired section
  if (activeTab === 'expired') {
    return (
      <div className="space-y-4">
        {expiredContracts.length === 0 ? (
          <EmptyState
            title={t('empty.expiredTitle')}
            description={t('empty.expiredDescription')}
            icon={<FileText className={`h-12 w-12 ${COLORS.muted.text}`} />}
            showAction={false}
          />
        ) : (
          <>
            <div className={`${COLORS.gray.bg50} border ${COLORS.gray.border200} rounded-lg p-4 shadow-md`}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`h-5 w-5 ${COLORS.gray.text600} mt-0.5`} />
                <div>
                  <h3 className={`font-semibold ${COLORS.gray.text900}`}>
                    {t('sections.expired.calloutTitle')}
                  </h3>
                  <p className={`text-sm ${COLORS.gray.text700} mt-1`}>
                    {t('sections.expired.calloutDescription')}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {expiredContracts.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  actionLoading={actionLoading}
                  onMarkAsContacted={onMarkAsContacted}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Fallback (shouldn't happen, but for TypeScript)
  return null;
}

