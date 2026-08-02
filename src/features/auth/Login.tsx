import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { toast } from 'sonner';
import { ROUTES } from '../../config/constants';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { getLoginSchema, LoginFormData } from './authSchemas';
import { useTurnstile } from '../../hooks/useTurnstile';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { signIn, signInWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'common']);

  const { token: turnstileToken, isReady: turnstileReady, resetWidget: resetTurnstile } = useTurnstile('turnstile-login');

  // Redirect if user is already logged in (e.g. after Google OAuth redirect)
  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirect || ROUTES.DASHBOARD, { replace: true });
    }
  }, [user, authLoading, navigate, redirect]);

  const loginSchema = getLoginSchema(t);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      localStorage.setItem("pending_login_method", "email");
      await signIn(data.email, data.password, turnstileToken!);

      // Wait for auth state to sync (critical for iOS Safari/PWA)
      let sessionConfirmed = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!sessionConfirmed && attempts < maxAttempts) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          sessionConfirmed = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      toast.success(t('toast.loginSuccess'));
      navigate(redirect || ROUTES.DASHBOARD, { replace: true });
    } catch (error) {
      resetTurnstile();
      const errorMessage = error instanceof Error ? error.message : t('errors.generic');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    localStorage.setItem("pending_login_method", "google");
    if (redirect) {
      localStorage.setItem("oauth_redirect", redirect);
    }
    const result = await signInWithGoogle();
    if (!result.success) {
      toast.error(result.error ?? t('errors.generic'));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted to-background px-4">
      <div className="grid w-full max-w-5xl gap-0 overflow-hidden rounded-3xl bg-card/80 shadow-2xl backdrop-blur md:grid-cols-2">
        {/* Left Panel - Marketing / Sign Up */}
        <div className="hidden flex-col justify-center gap-4 bg-gradient-to-br from-primary via-primary to-primary/80 p-10 text-primary-foreground md:flex">
          <h2 className="text-3xl font-bold">
            {t('login.newHereTitle')}
          </h2>
          <p className="max-w-sm text-sm text-primary-foreground/80">
            {t('login.newHereSubtitle')}
          </p>
          <Button
            variant="outline"
            className="mt-4 w-fit border-primary-foreground/60 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
            onClick={() => navigate(ROUTES.REGISTER)}
          >
            {t('login.newHereCta')}
          </Button>
        </div>

        {/* Right Panel - Login Form */}
        <div className="bg-card px-6 py-8 md:px-10 md:py-12">
          <h1 className="mb-2 text-2xl font-semibold text-foreground md:text-3xl">
            {t('login.title')}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {t('login.workspaceSubtitle')}
          </p>

          {/* Google Sign In Button (Primary) */}
          <div className="mb-6 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex w-full items-center justify-center gap-2 border-border py-5"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <img
                src="/icons/google-icon.png"
                alt="Google"
                className="h-5 w-5"
              />
              <span className="text-base font-medium text-foreground">{t('googleSignIn')}</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>{t('orSignWithEmail')}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('login.emailPlaceholder')}
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
                    <div className="flex items-center justify-between">
                      <FormLabel>{t('login.password')}</FormLabel>
                      <Link
                        to={ROUTES.FORGOT_PASSWORD}
                        className="text-sm text-primary hover:text-primary/80 hover:underline"
                      >
                        {t('login.forgotPassword')}
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('login.passwordPlaceholder')}
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cloudflare Turnstile */}
              <div id="turnstile-login" />

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                type="submit"
                disabled={loading || !turnstileReady}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common:loading')}
                  </>
                ) : (
                  t('login.signIn')
                )}
              </Button>
            </form>
          </Form>

          {/* Mobile Sign Up Link */}
          <div className="mt-6 text-center text-sm md:hidden">
            <span className="text-muted-foreground">
              {t('login.noAccount')}{' '}
            </span>
            <Link
              to={ROUTES.REGISTER}
              className="font-medium text-primary hover:text-primary/80 hover:underline"
            >
              {t('login.registerLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
