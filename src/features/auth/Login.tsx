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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-0 overflow-hidden rounded-3xl shadow-2xl bg-slate-900/40 backdrop-blur">
        {/* Left Panel - Marketing / Sign Up */}
        <div className="hidden md:flex flex-col justify-center gap-4 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white p-10">
          <h2 className="text-3xl font-bold">
            {t('login.newHereTitle')}
          </h2>
          <p className="text-sm text-indigo-100 max-w-sm">
            {t('login.newHereSubtitle')}
          </p>
          <Button
            variant="outline"
            className="mt-4 bg-white/10 hover:bg-white/20 border-white text-white w-fit"
            onClick={() => navigate(ROUTES.REGISTER)}
          >
            {t('login.newHereCta')}
          </Button>
        </div>

        {/* Right Panel - Login Form */}
        <div className="bg-white dark:bg-slate-950 px-6 py-8 md:px-10 md:py-12">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2 text-slate-900 dark:text-slate-50">
            {t('login.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {t('login.workspaceSubtitle')}
          </p>

          {/* Google Sign In Button (Primary) */}
          <div className="mb-6 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-slate-300 dark:border-slate-700 py-5"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <img
                src="/icons/google-icon.png"
                alt="Google"
                className="h-5 w-5"
              />
              <span className="text-base font-medium text-slate-700 dark:text-slate-200">{t('googleSignIn')}</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span>{t('orSignWithEmail')}</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
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
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
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
                className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
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
            <span className="text-slate-600 dark:text-slate-400">
              {t('login.noAccount')}{' '}
            </span>
            <Link
              to={ROUTES.REGISTER}
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
            >
              {t('login.registerLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
