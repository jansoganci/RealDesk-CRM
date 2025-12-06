import { useEffect, useState } from 'react';
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
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';
import { Save, Loader2, FileText, ScrollText, Cookie, ExternalLink, Mail } from 'lucide-react';
import { ReauthModal } from '../../components/common/ReauthModal';

export const Profile = () => {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const { user, changeEmail, updatePassword, reauthenticate } = useAuth();
  const language = i18n.language === 'tr' ? 'tr' : 'en';

  // Change email state
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null);
  const [showReauthForEmail, setShowReauthForEmail] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);

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

  // Handle email change (called after successful reauthentication)
  const handleChangeEmail = async () => {
    setEmailSuccessMessage(null);
    setEmailErrorMessage(null);

    if (!newEmail.trim()) {
      setEmailErrorMessage('Lütfen yeni e-posta adresini gir.');
      return;
    }

    setEmailLoading(true);

    const result = await changeEmail(newEmail.trim());

    if (!result.success) {
      setEmailErrorMessage(`E-posta güncellenemedi: ${result.error ?? 'Bilinmeyen hata'}`);
    } else {
      setEmailSuccessMessage('Onay linki yeni e-posta adresine gönderildi. Lütfen e-postanı kontrol et.');
      setNewEmail('');
    }

    setEmailLoading(false);
  };

  // Handle email change button click (opens reauth modal)
  const handleEmailChangeClick = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSuccessMessage(null);
    setEmailErrorMessage(null);

    if (!newEmail.trim()) {
      setEmailErrorMessage('Lütfen yeni e-posta adresini gir.');
      return;
    }

    setShowReauthForEmail(true);
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMessage(null);
    setPasswordErrorMessage(null);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setPasswordErrorMessage('Lütfen tüm şifre alanlarını doldur.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordErrorMessage('Yeni şifreler eşleşmiyor.');
      return;
    }

    setPasswordLoading(true);

    // 1) Reauth with current password
    const reauthResult = await reauthenticate(currentPassword);
    if (!reauthResult.success) {
      setPasswordLoading(false);
      setPasswordErrorMessage(reauthResult.error ?? 'Şifre doğrulanamadı. Lütfen tekrar dene.');
      return;
    }

    // 2) Update password
    const updateResult = await updatePassword(newPassword);
    setPasswordLoading(false);

    if (!updateResult.success) {
      setPasswordErrorMessage(updateResult.error ?? 'Şifre güncellenemedi. Lütfen tekrar dene.');
      return;
    }

    setPasswordSuccessMessage('Şifren başarıyla güncellendi.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

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

            <Separator />

            {/* Change Email Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">E-posta adresini değiştir</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Yeni e-posta adresini gir, onay linki bu adrese gönderilecektir.
                  <br />
                  <span className="text-xs text-gray-500">
                    Enter your new email address. A confirmation link will be sent to this address.
                  </span>
                </p>
              </div>

              {emailSuccessMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-emerald-800">{emailSuccessMessage}</p>
                </div>
              )}

              {emailErrorMessage && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-800">{emailErrorMessage}</p>
                </div>
              )}

              <form onSubmit={handleEmailChangeClick} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Yeni e-posta adresi"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    disabled={emailLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={emailLoading}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {emailLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Gönder
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            <Separator />

            {/* Change Password Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Şifreni değiştir</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Mevcut şifreni ve yeni şifreni girerek hesabının şifresini güncelleyebilirsin.
                  <br />
                  <span className="text-xs text-gray-500">
                    Enter your current and new password to update your account password.
                  </span>
                </p>
              </div>

              {passwordSuccessMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-emerald-800">{passwordSuccessMessage}</p>
                </div>
              )}

              {passwordErrorMessage && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-800">{passwordErrorMessage}</p>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <Input
                  type="password"
                  placeholder="Mevcut şifre"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={passwordLoading}
                />
                <Input
                  type="password"
                  placeholder="Yeni şifre"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={passwordLoading}
                />
                <Input
                  type="password"
                  placeholder="Yeni şifre (tekrar)"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  disabled={passwordLoading}
                />
                <Button
                  type="submit"
                  disabled={passwordLoading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    'Şifreyi Güncelle'
                  )}
                </Button>
              </form>
            </div>

            <Separator />

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

        {/* Reauthentication Modal for Email Change */}
        <ReauthModal
          isOpen={showReauthForEmail}
          onClose={() => setShowReauthForEmail(false)}
          onSuccess={handleChangeEmail}
        />
      </PageContainer>
    </MainLayout>
  );
};
