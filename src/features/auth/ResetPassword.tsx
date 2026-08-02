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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t('common:loading')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid/expired session
  if (isValidSession === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl font-bold text-destructive">
              {t('errors.expiredLink').split('.')[0]}
            </CardTitle>
            <CardDescription className="text-center">
              {t('errors.expiredLink')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Link to={ROUTES.FORGOT_PASSWORD} className="w-full">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                <CheckCircle className="h-8 w-8 text-success" />
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
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="mr-2 h-8 w-8 text-primary" />
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
            <div className="mb-4 rounded-lg border border-success/30 bg-success/15 p-3">
              <p className="text-sm text-foreground">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/15 p-3">
              <p className="text-sm text-foreground">{errorMessage}</p>
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
              <div className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/15 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                <p className="text-xs text-foreground/80">
                  {t('register.passwordRequirements')}
                </p>
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
              className="inline-flex items-center text-sm text-primary hover:text-primary/80 hover:underline"
            >
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
