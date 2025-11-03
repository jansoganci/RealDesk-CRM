import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { ROUTES, APP_NAME } from '../../config/constants';
import { Building2 } from 'lucide-react';
import { COLORS } from '@/config/colors';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, enableDemoMode } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'common']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t('login.validation.required'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('login.validation.passwordLength'));
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success(t('login.toast.signUpSuccess'));
        setIsSignUp(false);
        setPassword('');
      } else {
        await signIn(email, password);
        toast.success(t('login.toast.loginSuccess'));
        navigate(ROUTES.DASHBOARD);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isSignUp ? t('login.toast.signUpError') : t('login.toast.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    enableDemoMode();
    navigate(ROUTES.DASHBOARD);
  };

  return (
    // Note: PageContainer intentionally NOT used here - auth pages require full-screen centered layout
    // without navbar/sidebar, which is standard UX for login/signup flows
    <div className={`flex items-center justify-center min-h-screen ${COLORS.gray.bg50}`}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 mr-2" color={COLORS.primary.DEFAULT} />
            <span className="text-2xl font-bold">{APP_NAME}</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? t('login.createAccount') : t('login.welcomeBack')}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp ? t('login.createAccount') : t('login.welcomeDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('login.password')}</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? t('common:loading') : isSignUp ? t('login.signUp') : t('login.signIn')}
            </Button>
          </form>

          {/* Demo Mode Button - Only show on sign in mode */}
          {!isSignUp && (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleDemoMode}
                disabled={loading}
              >
                {t('login.demoMode')}
              </Button>
              <p className="text-xs text-center mt-2 text-gray-500">
                {t('login.demoDescription')}
              </p>
            </div>
          )}

          <div className="mt-4 text-center text-sm">
            <div className="text-center text-sm">
              {isSignUp ? t('login.hasAccount') : t('login.noAccount')}{' '}
              <button
                type="button"
                className="underline"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={loading}
              >
                {isSignUp ? t('login.signIn') : t('login.signUp')}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
