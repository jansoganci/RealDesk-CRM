import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../../components/common/EmptyState';
import { ReminderCard } from './ReminderCard';
import { CallListRow } from './CallListRow';
import { AlertCircle, Bell, Check, Calendar, FileText, Shield, CheckCircle2 } from 'lucide-react';
import { COLORS } from '@/config/colors';
import type { ReminderWithDetails } from '../../../lib/serviceProxy';
import { Card } from '../../../components/ui/card';

/**
 * Reminder Sections Component
 * Renders reminder sections based on active tab with empty states and callout banners
 */

interface ReminderSectionsProps {
  activeTab: string;
  // New structure (Contract Expiry Control Center)
  criticalReminders?: ReminderWithDetails[];
  underWatchReminders?: ReminderWithDetails[];
  completedReminders?: ReminderWithDetails[];
  // Old structure (backward compatible)
  overdueReminders?: ReminderWithDetails[];
  upcomingReminders?: ReminderWithDetails[];
  scheduledReminders?: ReminderWithDetails[];
  expiredContracts?: ReminderWithDetails[];
  actionLoading: string | null;
  onMarkAsContacted: (reminder: ReminderWithDetails) => void;
}

export function ReminderSections({
  activeTab,
  // New structure
  criticalReminders = [],
  underWatchReminders = [],
  completedReminders = [],
  // Old structure (backward compatible)
  overdueReminders = [],
  upcomingReminders = [],
  scheduledReminders = [],
  expiredContracts = [],
  actionLoading,
  onMarkAsContacted,
}: ReminderSectionsProps) {
  const { t } = useTranslation('reminders');

  // Critical section (new - Contract Expiry Control Center)
  // Uses CallListRow for compact call checklist view
  if (activeTab === 'critical') {
    return (
      <div className="space-y-0">
        {criticalReminders.length === 0 ? (
          <EmptyState
            title={t('empty.allClear')}
            description={t('empty.criticalDescription')}
            icon={<Check className={`h-12 w-12 ${COLORS.success.text}`} />}
            showAction={false}
          />
        ) : (
          <Card className="overflow-hidden border-gray-200/50 shadow-sm">
            {criticalReminders.map((reminder, index) => (
              <CallListRow
                key={reminder.id}
                reminder={reminder}
                actionLoading={actionLoading}
                onMarkAsContacted={onMarkAsContacted}
                isFirstItem={index === 0}
                isCompleted={false}
              />
            ))}
          </Card>
        )}
      </div>
    );
  }

  // Under Watch section (new - Contract Expiry Control Center)
  // Uses CallListRow for compact view
  if (activeTab === 'underWatch') {
    return (
      <div className="space-y-0">
        {underWatchReminders.length === 0 ? (
          <EmptyState
            title={t('empty.underWatch')}
            description={t('empty.underWatchDescription')}
            icon={<Shield className={`h-12 w-12 ${COLORS.success.text}`} />}
            showAction={false}
          />
        ) : (
          <Card className="overflow-hidden border-gray-200/50 shadow-sm">
            {underWatchReminders.map((reminder) => (
              <CallListRow
                key={reminder.id}
                reminder={reminder}
                actionLoading={actionLoading}
                onMarkAsContacted={onMarkAsContacted}
                isFirstItem={false}
                isCompleted={false}
              />
            ))}
          </Card>
        )}
      </div>
    );
  }

  // Completed section (new - Contract Expiry Control Center)
  // Uses CallListRow with isCompleted=true for view-only mode
  if (activeTab === 'completed') {
    return (
      <div className="space-y-0">
        {completedReminders.length === 0 ? (
          <EmptyState
            title={t('empty.completed')}
            description={t('empty.completedDescription')}
            icon={<CheckCircle2 className={`h-12 w-12 ${COLORS.muted.text}`} />}
            showAction={false}
          />
        ) : (
          <Card className="overflow-hidden border-gray-200/50 shadow-sm">
            {completedReminders.map((reminder) => (
              <CallListRow
                key={reminder.id}
                reminder={reminder}
                actionLoading={actionLoading}
                onMarkAsContacted={onMarkAsContacted}
                isFirstItem={false}
                isCompleted={true}
              />
            ))}
          </Card>
        )}
      </div>
    );
  }

  // Overdue section (old - backward compatible)
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

