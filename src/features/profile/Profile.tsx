import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileData } from './hooks/useProfileData';
import { useProfileForm } from './hooks/useProfileForm';
import { AccountSecurityCard } from './components/AccountSecurityCard';
import { PreferencesCard } from './components/PreferencesCard';
import { LegalDocumentsCard } from './components/LegalDocumentsCard';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Form } from '../../components/ui/form';

export const Profile = () => {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const { user } = useAuth();
  const language = i18n.language === 'tr' ? 'tr' : 'en';

  // Profile form hook
  const { form, normalizeLanguage, normalizeCurrency } = useProfileForm();

  // Profile data hook
  const { loading, handleSubmit, loadPreferences } = useProfileData({
    form,
    normalizeLanguage,
    normalizeCurrency,
  });

  // Load user preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return (
    <MainLayout title={t('profile:pageTitle')}>
      <PageContainer>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account & Personal Info Card */}
              <AccountSecurityCard
                user={user}
                form={form}
                loading={loading}
                onSave={form.handleSubmit(handleSubmit)}
              />

              {/* Preferences Card */}
              <PreferencesCard
                form={form}
                loading={loading}
                onSave={form.handleSubmit(handleSubmit)}
              />

              {/* Legal Documents Card */}
              <LegalDocumentsCard language={language} />
            </div>
          </form>
        </Form>
      </PageContainer>
    </MainLayout>
  );
};
