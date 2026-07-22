import { useState, useEffect } from 'react';
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
import { Building2, Loader2, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { supabase } from '../../config/supabase';
import { getResetPasswordSchema, ResetPasswordFormData } from './authSchemas';

export const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'common']);

  const resetPasswordSchema = getResetPasswordSchema(t);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      // Supabase automatically handles the recovery token from the URL hash
      // When user clicks the email link, Supabase exchanges the token for a session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setIsValidSession(true);
      } else {
        // Wait a bit for Supabase to process the URL hash
        // The recovery token exchange might take a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        setIsValidSession(!!retrySession);
      }
    };

    checkSession();

    // Listen for auth state changes (recovery session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      } else if (session) {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    if (data.password !== data.confirmPassword) {
      setErrorMessage(t('validation.passwordsMismatch'));
      setLoading(false);
      return;
    }

    const result = await updatePassword(data.password);

    if (!result.success) {
      setErrorMessage(t('resetPassword.updateError', { error: result.error }));
      setLoading(false);
    } else {
      setSuccessMessage(t('resetPassword.successMessageInline'));
      setPasswordUpdated(true);
      toast.success(t('toast.passwordUpdatedSuccess'));
      setTimeout(() => {
        navigate(ROUTES.LOGIN, { replace: true });
      }, 2500);
      setLoading(false);
    }
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50} dark:bg-slate-950`}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-gray-500 dark:text-slate-400">{t('common:loading')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid/expired session
  if (isValidSession === false) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50} dark:bg-slate-950`}>
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-red-600 dark:text-red-400">
              {t('errors.expiredLink').split('.')[0]}
            </CardTitle>
            <CardDescription className="text-center">
              {t('errors.expiredLink')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Link to={ROUTES.FORGOT_PASSWORD} className="w-full">
                <Button className={`w-full ${COLORS.primary.bgGradient} ${COLORS.primary.bgGradientHover}`}>
                  {t('forgotPassword.submit')}
                </Button>
              </Link>
              <Link to={ROUTES.LOGIN} className="w-full">
                <Button variant="outline" className="w-full">
                  {t('forgotPassword.backToLogin')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state after password update
  if (passwordUpdated) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50} dark:bg-slate-950`}>
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {t('resetPassword.successTitle')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('resetPassword.successMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className={`w-full ${COLORS.primary.bgGradient} ${COLORS.primary.bgGradientHover}`}
              onClick={() => navigate(ROUTES.LOGIN, { replace: true })}
            >
              {t('resetPassword.goToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50} dark:bg-slate-950`}>
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 mr-2" color={COLORS.primary.hex} />
            <span className="text-2xl font-bold">{APP_NAME}</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {t('resetPassword.title')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('resetPassword.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900">
              <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('resetPassword.password')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('resetPassword.passwordPlaceholder')}
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
                    <FormLabel>{t('resetPassword.confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password requirements hint */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-950/40 dark:border-blue-800">
                <Info className="h-4 w-4 mt-0.5 text-blue-600 shrink-0 dark:text-blue-400" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t('register.passwordRequirements')}
                </p>
              </div>

              <Button
                className={`w-full ${COLORS.primary.bgGradient} ${COLORS.primary.bgGradientHover}`}
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common:loading')}
                  </>
                ) : (
                  t('resetPassword.submit')
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
            >
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
