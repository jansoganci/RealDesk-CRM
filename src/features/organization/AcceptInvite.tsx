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
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="animate-pulse text-muted-foreground">{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {error === 'Invitation expired' ? t('team:errors.invitationExpired', { defaultValue: 'Invitation Expired' }) : t('team:errors.invalidInvitation', { defaultValue: 'Invalid Invitation' })}
            </CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">
              {error === 'Invitation expired' 
                ? t('team:errors.invitationExpiredDesc', { defaultValue: 'This invitation link has expired. Please ask the sender to resend the invitation.' })
                : t('team:errors.invalidInvitationDesc', { defaultValue: 'This invitation link is invalid or has already been used.' })}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3 pt-6">
            <Button className="w-full" asChild variant="outline">
              <Link to={ROUTES.HOME}>{t('common:backToHome')}</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t('common:needHelp')}{' '}
              <Link to={ROUTES.CONTACT} className="text-primary hover:underline">{t('common:contactSupport')}</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background p-4">
      <div className="w-full max-w-lg">
        <Card className="overflow-hidden border-none bg-card/80 shadow-2xl backdrop-blur-sm">
          {/* Header Image/Pattern */}
          <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-r from-primary to-primary/80">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/20 blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary-foreground/20 blur-3xl"></div>
            </div>
            <div className="z-10 rounded-2xl bg-card p-4 shadow-lg">
              {invitation?.org_logo ? (
                <img src={invitation.org_logo} alt={invitation.org_name} className="h-12 w-auto object-contain" />
              ) : (
                <ShieldCheck className="h-12 w-12 text-primary" />
              )}
            </div>
          </div>

          <CardHeader className="text-center pt-8">
            <CardTitle className="text-3xl font-bold leading-tight text-foreground">
              {t('team:invite.title', { defaultValue: "You're Invited!" })}
            </CardTitle>
            <CardDescription className="mt-4 px-4 text-lg text-muted-foreground">
              <span className="font-semibold text-foreground">{invitation?.invited_by_name || 'Someone'}</span>{' '}
              {t('team:invite.invitedYouTo', { defaultValue: 'has invited you to join' })}{' '}
              <span className="font-bold text-primary">{invitation?.org_name}</span>{' '}
              {t('team:invite.asRole', { defaultValue: 'as a' })}{' '}
              <span className="font-semibold">{t(`team:roles.${invitation?.role}`)}</span>.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8 pt-4">
            {!user ? (
              /* Not Logged In View */
              <div className="space-y-6">
                <div className="flex items-start gap-3 rounded-xl bg-info/15 p-4">
                  <div className="shrink-0 rounded-lg bg-info/15 p-2">
                    <Mail className="h-5 w-5 text-info" />
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {t('team:invite.loginPrompt', { defaultValue: 'To accept this invitation and join the team, please log in to your account or create a new one.' })}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Button 
                    className="h-12 w-full text-base font-semibold shadow-lg shadow-primary/20"
                    asChild
                  >
                    <Link to={`${ROUTES.REGISTER}?token=${token}`}>
                      {t('auth:register.title')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 w-full bg-card text-base font-semibold"
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
                <div className="rounded-xl border border-border bg-muted/50 p-4">
                  <p className="text-center text-sm text-muted-foreground">
                    {t('team:invite.loggedInAs', { defaultValue: 'Logged in as' })}{' '}
                    <span className="font-semibold text-foreground">{user.email}</span>
                  </p>
                </div>

                <Button 
                  className="h-14 w-full transform bg-primary text-lg font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]"
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
                
                <p className="text-center text-xs text-muted-foreground">
                  {t('team:invite.wrongAccount', { defaultValue: 'Not your account?' })}{' '}
                  <button 
                    onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                    className="font-medium text-primary hover:underline"
                  >
                    {t('auth:logout', { defaultValue: 'Log out' })}
                  </button>
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-border bg-muted/50 px-8 py-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('common:appName', { defaultValue: 'Closewell' })}
            </span>
            <div className="flex gap-4">
              <Link to={ROUTES.ABOUT} className="text-xs text-muted-foreground hover:text-primary">{t('common:about')}</Link>
              <Link to={ROUTES.CONTACT} className="text-xs text-muted-foreground hover:text-primary">{t('common:contact')}</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
