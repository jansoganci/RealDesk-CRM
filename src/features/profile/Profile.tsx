import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { UserInfoHeader } from './components/UserInfoHeader';
import { ProfileInfoCard } from './components/ProfileInfoCard';
import { EditProfileInfoDialog } from './components/EditProfileInfoDialog';
import { OrganizationSettingsCard } from './components/OrganizationSettingsCard';
import { EditOrganizationDialog } from './components/EditOrganizationDialog';
import { SubscriptionStatusCard } from './components/SubscriptionStatusCard';
import { BillingHistoryCard } from './components/BillingHistoryCard';
import { AccountSecurityCard } from './components/AccountSecurityCard';
import { LegalDocumentsCard } from './components/LegalDocumentsCard';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrokerSettingsForm } from './components/BrokerSettingsForm';

interface ProfileData {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  currency: string;
  meetingReminderMinutes: number;
  commissionRate: number;
}

export const Profile = () => {
  const { t } = useTranslation(['profile', 'common']);
  const { 
    user, 
    loading: authLoading,
    fullName,
    phoneNumber,
    currency,
    meetingReminderMinutes,
    commissionRate
  } = useAuth();
  const { currentOrg, isOwner } = useOrg();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditOrgDialogOpen, setIsEditOrgDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    email: user?.email || '',
    phoneNumber: null,
    currency: 'USD',
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
        currency: currency || 'USD',
        meetingReminderMinutes: meetingReminderMinutes || 30,
        commissionRate: commissionRate || 4.0,
      });
    }
  }, [authLoading, user, fullName, phoneNumber, currency, meetingReminderMinutes, commissionRate]);

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

  const handleEditOrgClick = () => {
    setIsEditOrgDialogOpen(true);
  };

  const handleEditOrgClose = () => {
    setIsEditOrgDialogOpen(false);
  };

  const handleOrgSaveSuccess = () => {
    // OrgContext will refresh automatically via refreshOrg call in dialog
  };

  return (
    <MainLayout title={t('profile:pageTitle')}>
      <PageContainer>
        <div className="space-y-6">
          {/* User Info Header - Full Width */}
          <UserInfoHeader />

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700 rounded-lg">
              <TabsTrigger value="general">{t('profile:tabs.general')}</TabsTrigger>
              <TabsTrigger value="commission">{t('profile:tabs.commission')}</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-4 rounded-lg">
              {/* Profile Information Card - Read-only with Edit button */}
              <ProfileInfoCard
                data={profileData}
                onEditClick={handleEditClick}
                isLoading={authLoading}
              />

              {/* Organization Settings Card - Only show if user is owner */}
              {isOwner && currentOrg && (
                <OrganizationSettingsCard
                  onEditClick={handleEditOrgClick}
                />
              )}

              {/* Account Security - Full Width */}
              <AccountSecurityCard />

              {/* Subscription & Billing - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubscriptionStatusCard />
                <BillingHistoryCard />
              </div>

              {/* Legal Documents - Full Width */}
              <LegalDocumentsCard language="en" />
            </TabsContent>

            <TabsContent value="commission" className="mt-4">
              <BrokerSettingsForm />
            </TabsContent>
          </Tabs>
        </div>

        {/* Edit Profile Dialog/Drawer */}
        <EditProfileInfoDialog
          isOpen={isEditDialogOpen}
          onClose={handleEditClose}
          initialData={profileData}
          onSaveSuccess={handleSaveSuccess}
        />

        {/* Edit Organization Dialog/Drawer */}
        {currentOrg && (
          <EditOrganizationDialog
            isOpen={isEditOrgDialogOpen}
            onClose={handleEditOrgClose}
            initialName={currentOrg.name}
            onSaveSuccess={handleOrgSaveSuccess}
          />
        )}
      </PageContainer>
    </MainLayout>
  );
};
