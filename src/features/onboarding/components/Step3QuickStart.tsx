import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, LayoutDashboard, Home, UserPlus } from 'lucide-react';
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
}

export function Step3QuickStart({ onComplete }: Step3QuickStartProps) {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const { primaryUseCase, isLoading } = useOnboarding();
  const { currentOrg } = useOrg();
  const [completing, setCompleting] = useState(false);

  const completeAndNavigate = async (path: string) => {
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
        { primary_use_case: primaryUseCase }
      );
      navigate(path);
      onComplete();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('step3.errors.completeFailed');
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
      </CardContent>
    </Card>
  );
}
