import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { ROUTES, APP_NAME } from '../../config/constants';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { supabase } from '../../config/supabase';

export const EmailConfirmation = () => {
  const [status, setStatus] = useState<'checking' | 'confirmed' | 'error' | 'expired'>('checking');
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'common']);

  useEffect(() => {
    const checkConfirmation = async () => {
      try {
        // Check if user has a session (email was confirmed)
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Check if email is confirmed (check directly from session user)
          const confirmed = session.user.email_confirmed_at !== null && session.user.email_confirmed_at !== undefined;

          if (confirmed) {
            setStatus('confirmed');
            toast.success(t('emailConfirmation.confirmed'));

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              navigate(ROUTES.ONBOARDING, { replace: true });
            }, 2000);
          } else {
            // User has session but email not confirmed (shouldn't happen, but handle gracefully)
            setStatus('error');
          }
        } else {
          // No session - check URL hash for confirmation token
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const type = hashParams.get('type');

          if (accessToken && type === 'signup') {
            // Token is in URL - Supabase will handle it automatically
            // Wait a moment for Supabase to process it
            await new Promise(resolve => setTimeout(resolve, 1000));

            const { data: { session: newSession } } = await supabase.auth.getSession();
            const confirmed = newSession?.user?.email_confirmed_at !== null && newSession?.user?.email_confirmed_at !== undefined;
            if (newSession?.user && confirmed) {
              setStatus('confirmed');
              toast.success(t('emailConfirmation.confirmed'));
              setTimeout(() => {
                navigate(ROUTES.ONBOARDING, { replace: true });
              }, 2000);
            } else {
              setStatus('error');
            }
          } else {
            // No token in URL - link might be expired or invalid
            setStatus('expired');
          }
        }
      } catch (error) {
        console.error('Error checking email confirmation:', error);
        setStatus('error');
      }
    };

    checkConfirmation();

    // Listen for auth state changes (when user confirms email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const confirmed = session.user.email_confirmed_at !== null && session.user.email_confirmed_at !== undefined;
        if (confirmed) {
          setStatus('confirmed');
          toast.success(t('emailConfirmation.confirmed'));
          setTimeout(() => {
            navigate(ROUTES.ONBOARDING, { replace: true });
          }, 2000);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, t]);

  if (status === 'checking') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">{t('emailConfirmation.checking')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <span className="text-2xl font-bold">{APP_NAME}</span>
            </div>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              {t('emailConfirmation.successTitle')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('emailConfirmation.successMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-600 text-center">
                {t('emailConfirmation.redirecting')}
              </p>
              <Link
                to={ROUTES.ONBOARDING}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                {t('emailConfirmation.goToOnboarding')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <span className="text-2xl font-bold">{APP_NAME}</span>
            </div>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <XCircle className="h-6 w-6 text-red-600" />
              {t('emailConfirmation.expiredTitle')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('emailConfirmation.expiredMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <Mail className="h-5 w-5 mt-0.5 text-red-600 shrink-0" />
              <p className="text-sm text-red-900">
                {t('emailConfirmation.expiredHint')}
              </p>
            </div>

            <div className="space-y-3">
              <Link to={ROUTES.LOGIN}>
                <Button className="w-full" variant="default">
                  {t('emailConfirmation.backToLogin')}
                </Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button className="w-full" variant="outline">
                  {t('emailConfirmation.registerAgain')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <span className="text-2xl font-bold">{APP_NAME}</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <XCircle className="h-6 w-6 text-red-600" />
            {t('emailConfirmation.errorTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('emailConfirmation.errorMessage')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link to={ROUTES.LOGIN}>
            <Button className="w-full" variant="default">
              {t('emailConfirmation.backToLogin')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

