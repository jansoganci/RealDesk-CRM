import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { organizationService } from '@/services/organization.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/config/constants';
import { supabase } from '@/config/supabase';
import type { InvitationInfo } from '@/types/org';

export const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { t } = useTranslation(['team', 'common', 'auth']);
  const { user, loading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No token provided');
        setLoading(false);
        return;
      }

      try {
        const info = await organizationService.getInvitationInfo(token);
        if (!info.valid) {
          setError(info.expired ? 'Invitation expired' : 'Invalid invitation link');
        } else {
          setInvitation(info);
        }
      } catch (err) {
        console.error('Failed to validate token:', err);
        setError('Failed to validate invitation');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    try {
      const result = await organizationService.acceptInvitation(token);
      if (result.success) {
        toast.success(t('team:success.invitationAccepted', { defaultValue: 'Invitation accepted successfully!' }));
        navigate(ROUTES.DASHBOARD);
      } else {
        toast.error(result.error || t('common:error'));
      }
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      toast.error(t('common:error'));
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-500 dark:text-slate-400 animate-pulse">{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {error === 'Invitation expired' ? t('team:errors.invitationExpired', { defaultValue: 'Invitation Expired' }) : t('team:errors.invalidInvitation', { defaultValue: 'Invalid Invitation' })}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 mt-2">
              {error === 'Invitation expired' 
                ? t('team:errors.invitationExpiredDesc', { defaultValue: 'This invitation link has expired. Please ask the sender to resend the invitation.' })
                : t('team:errors.invalidInvitationDesc', { defaultValue: 'This invitation link is invalid or has already been used.' })}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3 pt-6">
            <Button className="w-full" asChild variant="outline">
              <Link to={ROUTES.HOME}>{t('common:backToHome')}</Link>
            </Button>
            <p className="text-xs text-center text-slate-400 dark:text-slate-500">
              {t('common:needHelp')}{' '}
              <Link to={ROUTES.CONTACT} className="text-blue-600 hover:underline">{t('common:contactSupport')}</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-2xl border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
          {/* Header Image/Pattern */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white dark:bg-slate-400/20 blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white dark:bg-slate-400/20 blur-3xl"></div>
            </div>
            <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-lg z-10">
              {invitation?.org_logo ? (
                <img src={invitation.org_logo} alt={invitation.org_name} className="h-12 w-auto object-contain" />
              ) : (
                <ShieldCheck className="h-12 w-12 text-blue-600" />
              )}
            </div>
          </div>

          <CardHeader className="text-center pt-8">
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
              {t('team:invite.title', { defaultValue: "You're Invited!" })}
            </CardTitle>
            <CardDescription className="text-lg text-slate-600 dark:text-slate-400 mt-4 px-4">
              <span className="font-semibold text-slate-900 dark:text-slate-50">{invitation?.invited_by_name || 'Someone'}</span>{' '}
              {t('team:invite.invitedYouTo', { defaultValue: 'has invited you to join' })}{' '}
              <span className="font-bold text-blue-600">{invitation?.org_name}</span>{' '}
              {t('team:invite.asRole', { defaultValue: 'as a' })}{' '}
              <span className="font-semibold">{t(`team:roles.${invitation?.role}`)}</span>.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8 pt-4">
            {!user ? (
              /* Not Logged In View */
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg shrink-0">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    {t('team:invite.loginPrompt', { defaultValue: 'To accept this invitation and join the team, please log in to your account or create a new one.' })}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Button 
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-blue-500/20" 
                    asChild
                  >
                    <Link to={`${ROUTES.REGISTER}?token=${token}`}>
                      {t('auth:register.title')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 text-base font-semibold bg-white dark:bg-transparent" 
                    asChild
                  >
                    <Link to={`${ROUTES.LOGIN}?redirect=/accept-invite?token=${token}`}>
                      {t('auth:login.title')}
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              /* Logged In View */
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                    {t('team:invite.loggedInAs', { defaultValue: 'Logged in as' })}{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-50">{user.email}</span>
                  </p>
                </div>

                <Button 
                  className="w-full h-14 text-lg font-bold shadow-xl shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleAccept}
                  disabled={accepting}
                >
                  {accepting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('team:addDialog.submitting', { defaultValue: 'Accepting...' })}
                    </>
                  ) : (
                    <>
                      {t('team:invite.acceptButton', { defaultValue: 'Accept Invitation' })}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                  {t('team:invite.wrongAccount', { defaultValue: 'Not your account?' })}{' '}
                  <button 
                    onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {t('auth:logout', { defaultValue: 'Log out' })}
                  </button>
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-slate-50 dark:bg-slate-950/50 px-8 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
              {t('common:appName', { defaultValue: 'EMLAK CRM' })}
            </span>
            <div className="flex gap-4">
              <Link to={ROUTES.ABOUT} className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600">{t('common:about')}</Link>
              <Link to={ROUTES.CONTACT} className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600">{t('common:contact')}</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
