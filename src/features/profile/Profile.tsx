import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { userPreferencesService } from '@/lib/serviceProxy';
import { UserInfoHeader } from './components/UserInfoHeader';
import { ProfileInfoCard } from './components/ProfileInfoCard';
import { EditProfileInfoDialog } from './components/EditProfileInfoDialog';
import { SubscriptionStatusCard } from './components/SubscriptionStatusCard';
import { BillingHistoryCard } from './components/BillingHistoryCard';
import { AccountSecurityCard } from './components/AccountSecurityCard';
import { LegalDocumentsCard } from './components/LegalDocumentsCard';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';

interface ProfileData {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  language: 'tr' | 'en';
  currency: string;
  meetingReminderMinutes: number;
  commissionRate: number;
}

export const Profile = () => {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const { user } = useAuth();
  const language = i18n.language === 'tr' ? 'tr' : 'en';

  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    email: user?.email || '',
    phoneNumber: null,
    language: 'tr',
    currency: 'TRY',
    meetingReminderMinutes: 30,
    commissionRate: 4.0,
  });

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const prefs = await userPreferencesService.getPreferences();

      setProfileData({
        fullName: prefs.full_name || '',
        email: user.email || '',
        phoneNumber: prefs.phone_number || null,
        language: (prefs.language === 'tr' || prefs.language === 'en')
          ? prefs.language
          : 'tr',
        currency: prefs.currency || 'TRY',
        meetingReminderMinutes: prefs.meeting_reminder_minutes || 30,
        commissionRate: prefs.commission_rate || 4.0,
      });
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load user preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Update email when user changes
  useEffect(() => {
    if (user?.email) {
      setProfileData((prev) => ({ ...prev, email: user.email || '' }));
    }
  }, [user?.email]);

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
  };

  const handleSaveSuccess = () => {
    // Reload preferences after successful save
    loadPreferences();
  };

  return (
    <MainLayout title={t('profile:pageTitle')}>
      <PageContainer>
        <div className="space-y-6">
          {/* User Info Header - Full Width */}
          <UserInfoHeader />

          {/* Profile Information Card - Read-only with Edit button */}
          <ProfileInfoCard
            data={profileData}
            onEditClick={handleEditClick}
            isLoading={isLoading}
          />

          {/* Account Security - Full Width */}
          <AccountSecurityCard />

          {/* Subscription & Billing - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubscriptionStatusCard />
            <BillingHistoryCard />
          </div>

          {/* Legal Documents - Full Width */}
          <LegalDocumentsCard language={language} />
        </div>

        {/* Edit Profile Dialog/Drawer */}
        <EditProfileInfoDialog
          isOpen={isEditDialogOpen}
          onClose={handleEditClose}
          initialData={profileData}
          onSaveSuccess={handleSaveSuccess}
        />
      </PageContainer>
    </MainLayout>
  );
};
