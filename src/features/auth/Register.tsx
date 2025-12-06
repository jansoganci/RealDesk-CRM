import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { toast } from 'sonner';
import { ROUTES, APP_NAME } from '../../config/constants';
import { Loader2, Info } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { getRegisterSchema, RegisterFormData } from './authSchemas';

export const Register = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const { signUp, resendConfirmationEmail } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['auth', 'common']);
  const language = i18n.language || 'tr';

  const registerSchema = getRegisterSchema(t);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: true, // Set to true to pass schema validation, but we use local state for actual validation
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    // Validate terms acceptance
    if (!acceptTerms) {
      setTermsError(t('auth.termsRequired', 'You must accept the terms to continue.'));
      return;
    }
    setTermsError(null);

    setLoading(true);
    try {
      const result = await signUp(data.email, data.password);
      
      if (result.requiresEmailConfirmation) {
        // Email confirmation required - show message
        setUserEmail(data.email);
        setEmailSent(true);
        toast.success(t('toast.emailConfirmationSent'));
      } else {
        // No email confirmation needed (shouldn't happen if enabled, but handle gracefully)
        toast.success(t('toast.signUpSuccess'));
        navigate(ROUTES.LOGIN, { replace: true });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.generic');
      // Check for specific error messages
      if (errorMessage.toLowerCase().includes('already registered') || errorMessage.toLowerCase().includes('already in use')) {
        toast.error(t('errors.emailInUse'));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!userEmail) return;
    
    setLoading(true);
    try {
      await resendConfirmationEmail(userEmail);
      toast.success(t('toast.emailConfirmationResent'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.generic');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show email confirmation message if email was sent
  if (emailSent) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <span className="text-2xl font-bold">{APP_NAME}</span>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {t('emailConfirmation.title')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('emailConfirmation.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <Info className="h-5 w-5 mt-0.5 text-blue-600 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm text-blue-900 font-medium">
                  {t('emailConfirmation.message', { email: userEmail })}
                </p>
                <p className="text-xs text-blue-700">
                  {t('emailConfirmation.checkSpam')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common:loading')}
                  </>
                ) : (
                  t('emailConfirmation.resendEmail')
                )}
              </Button>

              <Link
                to={ROUTES.LOGIN}
                className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                {t('emailConfirmation.backToLogin')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <span className="text-2xl font-bold">{APP_NAME}</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {t('register.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('register.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('register.emailPlaceholder')}
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.password')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('register.passwordPlaceholder')}
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('register.confirmPasswordPlaceholder')}
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password requirements hint */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <Info className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-700">
                  {t('register.passwordRequirements')}
                </p>
              </div>

              {/* Terms acceptance checkbox */}
              <div className="flex items-start gap-2 mt-4">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    setTermsError(null);
                  }}
                  disabled={loading}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="acceptTerms" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  {t('auth.termsLabel', 'By creating an account, I accept the')}{' '}
                  <a
                    href={`/legal/terms-of-service-${language === 'tr' ? 'tr' : 'en'}.html`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 text-blue-600 dark:text-blue-400 hover:text-blue-700"
                  >
                    {t('auth.termsLink', 'Terms of Service')}
                  </a>{' '}
                  {t('auth.termsAnd', 'and')}{' '}
                  <a
                    href={`/legal/privacy-policy-${language === 'tr' ? 'tr' : 'en'}.html`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 text-blue-600 dark:text-blue-400 hover:text-blue-700"
                  >
                    {t('auth.privacyLink', 'Privacy Policy')}
                  </a>.
                </label>
              </div>
              {termsError && (
                <p className="mt-2 text-xs text-red-500">
                  {termsError}
                </p>
              )}

              <Button
                className={`w-full ${COLORS.primary.bgGradient} ${COLORS.primary.bgGradientHover}`}
                type="submit"
                disabled={loading || !acceptTerms}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common:loading')}
                  </>
                ) : (
                  t('register.signUp')
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <span className={COLORS.text.secondary}>
              {t('register.hasAccount')}{' '}
            </span>
            <Link
              to={ROUTES.LOGIN}
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              {t('register.loginLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
