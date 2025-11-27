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
import { Save, Loader2, FileText, ScrollText, Cookie, ExternalLink } from 'lucide-react';

export const Profile = () => {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const { user } = useAuth();
  const language = i18n.language === 'tr' ? 'tr' : 'en';

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

            <Separator />

            {/* Legal Documents Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {t('profile:legal.title')}
              </h3>

              <div className="space-y-2">
                {/* Privacy Policy */}
                <a
                  href={`/legal/privacy-policy-${language}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <div className="font-medium">{t('profile:legal.privacy.title')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('profile:legal.privacy.description')}</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>

                {/* Terms of Service */}
                <a
                  href={`/legal/terms-of-service-${language}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ScrollText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <div className="font-medium">{t('profile:legal.terms.title')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('profile:legal.terms.description')}</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>

                {/* Cookie Policy */}
                <a
                  href={`/legal/cookie-policy-${language}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Cookie className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <div className="font-medium">{t('profile:legal.cookies.title')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('profile:legal.cookies.description')}</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </MainLayout>
  );
};
