import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, LayoutDashboard, Home, UserPlus } from 'lucide-react';
import { Building2, FileSignature, Handshake, LayoutDashboard, Loader2, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOnboarding } from '../hooks/useOnboarding';
import { ROUTES } from '@/config/constants';
import { toast } from 'sonner';
import { onboardingService } from '@/lib/serviceProxy';
import { getAuthenticatedUserId } from '@/lib/auth';
import { useOrg } from '@/contexts/OrgContext';

interface Step3QuickStartProps {
  onComplete: () => void;
  onBack: () => void;
}

interface QuickStartAction {
  id: 'lead' | 'property' | 'lease' | 'purchase' | 'deals' | 'dashboard';
  route: string;
  icon: React.ComponentType<{ className?: string }>;
}

const actionSets: Record<string, QuickStartAction[]> = {
  rentals: [
    { id: 'property', route: ROUTES.PROPERTIES, icon: Building2 },
    { id: 'lead', route: `${ROUTES.LEADS}?action=add`, icon: Handshake },
    { id: 'lease', route: ROUTES.CONTRACTS_LEASE_NEW, icon: FileSignature },
    { id: 'dashboard', route: ROUTES.DASHBOARD, icon: LayoutDashboard },
  ],
  sales: [
    { id: 'lead', route: `${ROUTES.LEADS}?action=add`, icon: Handshake },
    { id: 'deals', route: ROUTES.DEALS, icon: Building2 },
    { id: 'purchase', route: ROUTES.CONTRACTS_PURCHASE_NEW, icon: FileSignature },
    { id: 'dashboard', route: ROUTES.DASHBOARD, icon: LayoutDashboard },
  ],
  both: [
    { id: 'lead', route: `${ROUTES.LEADS}?action=add`, icon: Handshake },
    { id: 'property', route: ROUTES.PROPERTIES, icon: Building2 },
    { id: 'deals', route: ROUTES.DEALS, icon: FileSignature },
    { id: 'dashboard', route: ROUTES.DASHBOARD, icon: LayoutDashboard },
  ],
  exploring: [
    { id: 'dashboard', route: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { id: 'lead', route: `${ROUTES.LEADS}?action=add`, icon: Handshake },
    { id: 'property', route: ROUTES.PROPERTIES, icon: Building2 },
    { id: 'deals', route: ROUTES.DEALS, icon: FileSignature },
  ],
};

export function Step3QuickStart({ onComplete, onBack }: Step3QuickStartProps) {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const { primaryUseCase, isLoading } = useOnboarding();
  const { currentOrg } = useOrg();
  const [completing, setCompleting] = useState(false);


    if (!currentOrg?.id) {
      toast.error(t('step3.errors.organizationNotFound'));
      return;
    }

    setCompleting(true);
    try {
      const userId = await getAuthenticatedUserId();
      await onboardingService.completeOnboarding(currentOrg.id);
      await onboardingService.trackEvent(
        currentOrg.id,
        userId,
        3,
        'quick_start',
        'completed',
        {
          primary_use_case: primaryUseCase,
          selected_action: action.id,
        }
      );

      toast.error(errorMessage);
    } finally {
      setCompleting(false);
    }
  };

  const renderActions = () => {
    switch (primaryUseCase) {
      case 'rentals':
        return (
          <Button
            onClick={() => completeAndNavigate(ROUTES.PROPERTIES)}
            disabled={completing || isLoading}
            className="w-full h-auto py-6 px-6 flex items-center justify-center gap-3"
            size="lg"
          >
            {completing ? (
              <><Loader2 className="h-5 w-5 animate-spin" />{t('step3.completing')}</>
            ) : (
              <><Home className="h-5 w-5" />{t('step3.actions.addFirstProperty')}</>
            )}
          </Button>
        );
      case 'sales':
        return (
          <Button
            onClick={() => completeAndNavigate(ROUTES.LEADS)}
            disabled={completing || isLoading}
            className="w-full h-auto py-6 px-6 flex items-center justify-center gap-3"
            size="lg"
          >
            {completing ? (
              <><Loader2 className="h-5 w-5 animate-spin" />{t('step3.completing')}</>
            ) : (
              <><UserPlus className="h-5 w-5" />{t('step3.actions.addFirstLead')}</>
            )}
          </Button>
        );
      case 'both':
        return (
          <div className="space-y-3">
            <Button
              onClick={() => completeAndNavigate(ROUTES.PROPERTIES)}
              disabled={completing || isLoading}
              className="w-full h-auto py-6 px-6 flex items-center justify-center gap-3"
              size="lg"
              variant="outline"
            >
              <Home className="h-5 w-5" />{t('step3.actions.addFirstProperty')}
            </Button>
            <Button
              onClick={() => completeAndNavigate(ROUTES.LEADS)}
              disabled={completing || isLoading}
              className="w-full h-auto py-6 px-6 flex items-center justify-center gap-3"
              size="lg"
            >
              <UserPlus className="h-5 w-5" />{t('step3.actions.addFirstLead')}
            </Button>
          </div>
        );
      case 'exploring':
      default:
        return (
          <Button
            onClick={() => completeAndNavigate(ROUTES.DASHBOARD)}
            disabled={completing || isLoading}
            className="w-full h-auto py-6 px-6 flex items-center justify-center gap-3"
            size="lg"
          >
            {completing ? (
              <><Loader2 className="h-5 w-5 animate-spin" />{t('step3.completing')}</>
            ) : (
              <><LayoutDashboard className="h-5 w-5" />{t('step3.actions.goToDashboard')}</>
            )}
          </Button>
        );
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl md:text-3xl font-bold">
          {t('step3.title')}
        </CardTitle>
        <CardDescription className="text-base">
          {t('step3.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderActions()}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('step3.profile.title')}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('step3.profile.description')}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBack}
              disabled={completing || isLoading}
              className="shrink-0"
            >
              <PencilLine className="mr-2 h-4 w-4" />
              {t('step3.edit')}
            </Button>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profileRows.map((row) => (
              <div key={row.label} className="rounded-md bg-white p-3 dark:bg-slate-950">
                <dt className="text-xs font-medium uppercase text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {row.value || t('step3.profile.missing')}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t('step3.actions.title')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('step3.actions.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {actions.map((action) => {
              const Icon = action.icon;

              return (
                <Button
                  key={action.id}
                  type="button"
                  variant={action.id === 'dashboard' ? 'outline' : 'default'}
                  onClick={() => handleComplete(action)}
                  disabled={completing || isLoading}
                  className="h-auto justify-start gap-3 px-4 py-4 text-left"
                >
                  {completing ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5 shrink-0" />
                  )}
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold">
                      {t(`step3.actions.${action.id}.title`)}
                    </span>
                    <span className="whitespace-normal text-xs font-normal opacity-80">
                      {t(`step3.actions.${action.id}.description`)}
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
