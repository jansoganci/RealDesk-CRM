import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ExternalLink, ArrowUpCircle } from 'lucide-react';
import { supabase } from '@/config/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useBilling } from '@/contexts/BillingContext';
import { calculateTrialDaysRemaining } from '@/utils/trial';

type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';

export const SubscriptionStatusCard = () => {
  const { t } = useTranslation('profile');
  const { t: tBilling } = useTranslation('billing');
  const { toast } = useToast();
  const { billingStatus, billingLoading } = useBilling();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const trialDaysRemaining = useMemo(
    () => calculateTrialDaysRemaining(billingStatus?.trialEndsAt ?? null),
    [billingStatus?.trialEndsAt]
  );

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error('Failed to create portal session');

      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        variant: 'destructive',
        title: t('subscriptionCard.errors.portalTitle'),
        description: error instanceof Error ? error.message : t('subscriptionCard.errors.portalFailed'),
      });
      setLoadingPortal(false);
    }
  };

  const handleUpgradePlan = () => {
    window.location.href = '/pricing';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: SubscriptionStatus | null) => {
    if (!status) return null;

    const badges = {
      active: { color: 'bg-green-500 dark:bg-green-400', text: t('subscriptionCard.status.active'), variant: 'default' as const },
      trialing: { color: 'bg-blue-500 dark:bg-blue-400', text: t('subscriptionCard.status.trialing'), variant: 'default' as const },
      past_due: { color: 'bg-yellow-500 dark:bg-yellow-400', text: t('subscriptionCard.status.pastDue'), variant: 'outline' as const },
      canceled: { color: 'bg-red-500 dark:bg-red-400', text: t('subscriptionCard.status.canceled'), variant: 'destructive' as const },
      incomplete: { color: 'bg-gray-500 dark:bg-slate-500', text: t('subscriptionCard.status.incomplete'), variant: 'outline' as const },
      incomplete_expired: { color: 'bg-gray-500 dark:bg-slate-500', text: t('subscriptionCard.status.expired'), variant: 'outline' as const },
      unpaid: { color: 'bg-red-500 dark:bg-red-400', text: t('subscriptionCard.status.unpaid'), variant: 'destructive' as const },
    };

    const badge = badges[status] || { color: 'bg-gray-500 dark:bg-slate-500', text: status, variant: 'outline' as const };

    return (
      <Badge variant={badge.variant} className="gap-2">
        <div className={`h-2 w-2 rounded-full ${badge.color}`}></div>
        {badge.text}
      </Badge>
    );
  };

  const getPlanDisplayName = (plan: string | null) => {
    if (!plan) return '-';
    const names: Record<string, string> = {
      baslangic: t('subscriptionCard.plans.baslangic'),
      profesyonel: t('subscriptionCard.plans.profesyonel'),
      ofis_plus: t('subscriptionCard.plans.ofisPlus'),
    };
    return names[plan] || plan;
  };

  const canUpgrade = () => {
    if (billingStatus?.isTrial) return true;
    if (!billingStatus?.plan) return false;
    if (billingStatus.plan === 'baslangic') return true;
    if (billingStatus.plan === 'profesyonel') return true;
    return false;
  };

  if (billingLoading && !billingStatus) {
    return (
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-950/40">
        <CardHeader>
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4 mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
            <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!billingStatus?.hasActiveAccess) {
    return (
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-950/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <CreditCard className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            {t('subscriptionCard.title')}
          </CardTitle>
          <CardDescription>
            {t('subscriptionCard.noSubscription.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-4">
            <p className="text-gray-600 dark:text-slate-300">
              {t('subscriptionCard.noSubscription.message')}
            </p>
            <Button
              type="button"
              onClick={() => window.location.href = '/pricing'}
              size="lg"
              className="w-full gap-2"
            >
              <ArrowUpCircle className="h-5 w-5" />
              {t('subscriptionCard.noSubscription.viewPlans')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-950/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <CreditCard className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          {t('subscriptionCard.title')}
        </CardTitle>
        <CardDescription>
          {t('subscriptionCard.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {billingStatus?.isTrial && (
          <div className="rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/40 p-4">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {tBilling('trialReminder.profile.label', { date: formatDate(billingStatus.trialEndsAt) })}
            </p>
            <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
              {trialDaysRemaining !== null
                ? tBilling('trialReminder.profile.countdown', { count: trialDaysRemaining })
                : tBilling('trialReminder.banner.message.default')}
            </p>
          </div>
        )}

        {/* Plan Info */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">
              {t('subscriptionCard.currentPlan')}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {getPlanDisplayName(billingStatus.plan)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">
              {t('subscriptionCard.statusLabel')}
            </p>
            {getStatusBadge(billingStatus.status)}
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">
              {billingStatus.cancelAtPeriodEnd
                ? t('subscriptionCard.cancelsOn')
                : t('subscriptionCard.renewsOn')}
            </p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {formatDate(billingStatus.currentPeriodEnd)}
            </p>
          </div>
        </div>

        {/* Cancel Warning */}
        {billingStatus.cancelAtPeriodEnd && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900/40 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
              {t('subscriptionCard.cancelWarning')}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Primary Action - Manage Subscription (only if has subscription status) */}
          {billingStatus?.status && (
            <div className="space-y-2">
              <Button
                type="button"
                onClick={handleManageSubscription}
                disabled={loadingPortal}
                size="lg"
                className="w-full gap-2"
              >
                {loadingPortal ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t('subscriptionCard.buttons.opening')}
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-5 w-5" />
                    {t('subscriptionCard.buttons.manageSubscription')}
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500 dark:text-slate-400">
                {t('subscription.manageHelperText')}
              </p>
            </div>
          )}

          {/* Secondary Action - Upgrade Plan */}
          {canUpgrade() && (
            <Button
              type="button"
              onClick={handleUpgradePlan}
              variant="outline"
              className="w-full gap-2 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
            >
              <ArrowUpCircle className="h-4 w-4" />
              {t('subscriptionCard.buttons.upgradePlan')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
