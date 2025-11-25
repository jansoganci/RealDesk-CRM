import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileData } from './hooks/useProfileData';
import { useExchangeRates } from './hooks/useExchangeRates';
import { useProfileForm } from './hooks/useProfileForm';
import { ProfileHeader } from './components/ProfileHeader';
import { PersonalInfoSection } from './components/PersonalInfoSection';
import { PreferencesSection } from './components/PreferencesSection';
import { ExchangeRatesSection } from './components/ExchangeRatesSection';
import { ProfileSuccessAlert } from './components/ProfileSuccessAlert';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer } from '../../components/layout/PageContainer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Form } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { Save, Loader2 } from 'lucide-react';

export const Profile = () => {
  const { t } = useTranslation(['profile', 'common']);
  const { user } = useAuth();

  // Profile form hook
  const { form, normalizeLanguage, normalizeCurrency } = useProfileForm();

  // Profile data hook
  const { loading, saveSuccess, handleSubmit, loadPreferences } = useProfileData({
    form,
    normalizeLanguage,
    normalizeCurrency,
  });

  // Exchange rates hook
  const {
    exchangeRates,
    lastUpdated,
    refreshingRates,
    handleRefreshRates,
    formatLastUpdated,
  } = useExchangeRates();

  // Load user preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return (
    <MainLayout title={t('profile:pageTitle')}>
      <PageContainer>
        {/* Success Alert */}
        <ProfileSuccessAlert show={saveSuccess} />

        {/* Main Profile Card */}
        <Card className="shadow-md border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                {t('profile:pageTitle')}
              </CardTitle>
              <Button
                onClick={form.handleSubmit(handleSubmit)}
                disabled={loading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('profile:actions.saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('profile:actions.save')}
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Header */}
            <ProfileHeader user={user} form={form} />

            {/* Form Section */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Personal Info Section */}
                  <PersonalInfoSection form={form} loading={loading} />

                  {/* Preferences Section */}
                  <PreferencesSection form={form} loading={loading} />
                </div>
              </form>
            </Form>

            <Separator />

            {/* Exchange Rates Section */}
            <ExchangeRatesSection
              exchangeRates={exchangeRates}
              lastUpdated={lastUpdated}
              refreshingRates={refreshingRates}
              onRefreshRates={handleRefreshRates}
              formatLastUpdated={formatLastUpdated}
            />
          </CardContent>
        </Card>
      </PageContainer>
    </MainLayout>
  );
};
