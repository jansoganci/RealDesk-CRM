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
  const { 
    user, 
    loading: authLoading,
    fullName,
    phoneNumber,
    language: prefLanguage,
    currency,
    meetingReminderMinutes,
    commissionRate
  } = useAuth();
  const language = i18n.language === 'tr' ? 'tr' : 'en';

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

  // Sync profile data from AuthContext
  useEffect(() => {
    if (!authLoading && user) {
      setProfileData({
        fullName: fullName || '',
        email: user.email || '',
        phoneNumber: phoneNumber || null,
        language: (prefLanguage === 'tr' || prefLanguage === 'en') ? prefLanguage : 'tr',
        currency: currency || 'TRY',
        meetingReminderMinutes: meetingReminderMinutes || 30,
        commissionRate: commissionRate || 4.0,
      });
    }
  }, [authLoading, user, fullName, phoneNumber, prefLanguage, currency, meetingReminderMinutes, commissionRate]);

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
  };

  const handleSaveSuccess = () => {
    // No need to reload locally, AuthContext should be updated or we can just let it be
    // If the dialog updates preferences, it might need to trigger an AuthContext refresh
    // but for now we follow the plan of using AuthContext data.
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
            isLoading={authLoading}
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
