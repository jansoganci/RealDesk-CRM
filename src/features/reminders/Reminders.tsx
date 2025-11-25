import { useRemindersData } from './hooks/useRemindersData';
import { useReminderCategories } from './hooks/useReminderCategories';
import { useReminderActions } from './hooks/useReminderActions';
import { useReminderDialog } from './hooks/useReminderDialog';
import { ReminderLoadingSkeleton } from './components/ReminderLoadingSkeleton';
import { ReminderSections } from './components/ReminderSections';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/button';
import { AnimatedTabs } from '../../components/ui/animated-tabs';
import {
  AlertCircle,
  Bell,
  Calendar,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { ReminderWithDetails } from '../../lib/serviceProxy';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/config/colors';
import { EmptyState } from '../../components/common/EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

// ReminderWithDetails already extends Contract and has all needed fields
// Use ReminderWithDetails directly instead of creating a conflicting interface

export const Reminders = () => {
  // Reminders data fetching hook
  const { reminders, loading, errorKey, refreshData } = useRemindersData();

  // Reminder categorization hook
  const {
    overdueReminders,
    upcomingReminders,
    scheduledReminders,
    expiredContracts,
    activeTab,
    setActiveTab,
  } = useReminderCategories({ reminders });

  // Reminder dialog hook
  const { selectedReminder, showContactDialog, openContactDialog, closeContactDialog } = useReminderDialog();

  // Reminder actions hook
  const { actionLoading, handleMarkAsContacted } = useReminderActions({
    refreshData,
    onActionComplete: closeContactDialog,
  });

  const { t } = useTranslation(['reminders', 'common']);

  const handleMarkAsContactedClick = (reminder: ReminderWithDetails) => {
    openContactDialog(reminder);
  };

  if (loading) {
    return <ReminderLoadingSkeleton />;
  }

  if (errorKey) {
    return (
      <MainLayout title={t('pageTitle')}>
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <AlertCircle className={`h-16 w-16 ${COLORS.danger.text}`} />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('errors.title')}</h3>
              <p className={`text-sm ${COLORS.muted.textLight} mb-4`}>
                {t(errorKey)}
              </p>
              <Button onClick={refreshData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('actions.tryAgain')}
              </Button>
            </div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={t('pageTitle')}>
      <PageContainer>
        {reminders.length === 0 ? (
          <EmptyState
            title={t('empty.globalTitle')}
            description={t('empty.globalDescription')}
            icon={<Bell className={`h-16 w-16 ${COLORS.muted.text}`} />}
            showAction={false}
          />
        ) : (
          <div className="space-y-4">
            <AnimatedTabs
              tabs={[
                { 
                  id: 'overdue', 
                  label: `${t('tabs.overdue')}${overdueReminders.length > 0 ? ` (${overdueReminders.length})` : ''}`,
                  icon: <AlertCircle className="h-4 w-4" />
                },
                { 
                  id: 'upcoming', 
                  label: `${t('tabs.upcoming')}${upcomingReminders.length > 0 ? ` (${upcomingReminders.length})` : ''}`,
                  icon: <Calendar className="h-4 w-4" />
                },
                { 
                  id: 'scheduled', 
                  label: `${t('tabs.scheduled')}${scheduledReminders.length > 0 ? ` (${scheduledReminders.length})` : ''}`,
                  icon: <Bell className="h-4 w-4" />
                },
                { 
                  id: 'expired', 
                  label: `${t('tabs.expired')}${expiredContracts.length > 0 ? ` (${expiredContracts.length})` : ''}`,
                  icon: <FileText className="h-4 w-4" />
                },
              ]}
              defaultTab={activeTab || undefined}
              onChange={(tabId) => setActiveTab(tabId)}
            />

            <ReminderSections
              activeTab={activeTab || 'overdue'}
              overdueReminders={overdueReminders}
              upcomingReminders={upcomingReminders}
              scheduledReminders={scheduledReminders}
              expiredContracts={expiredContracts}
              actionLoading={actionLoading}
              onMarkAsContacted={handleMarkAsContactedClick}
            />
          </div>
        )}

        <AlertDialog open={showContactDialog} onOpenChange={(open) => !open && closeContactDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.markTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dialogs.markDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', { ns: 'common' })}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReminder && handleMarkAsContacted(selectedReminder.id)}
              className={`${COLORS.success.bg} ${COLORS.success.hover}`}
            >
              {t('dialogs.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
      </PageContainer>
    </MainLayout>
  );
};
