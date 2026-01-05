import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOnboarding } from '../hooks/useOnboarding';
import { ROUTES } from '@/config/constants';
import { toast } from 'sonner';
import { onboardingService } from '../services/onboarding.service';
import { getAuthenticatedUserId } from '@/lib/auth';
import { useOrg } from '@/contexts/OrgContext';

interface Step3QuickStartProps {
  onComplete: () => void;
}

export function Step3QuickStart({ onComplete }: Step3QuickStartProps) {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const { primaryUseCase, completeOnboarding, isLoading } = useOnboarding();
  const { currentOrg } = useOrg();
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    if (!currentOrg?.id) {
      toast.error('Organization not found');
      return;
    }

    setCompleting(true);
    try {
      const userId = await getAuthenticatedUserId();
      
      // Mark onboarding as complete
      await onboardingService.completeOnboarding(currentOrg.id);

      // Track completion event
      await onboardingService.trackEvent(
        currentOrg.id,
        userId,
        3,
        'quick_start',
        'completed',
        { primary_use_case: primaryUseCase }
      );

      // Navigate to dashboard
      navigate(ROUTES.DASHBOARD);
      onComplete();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete onboarding';
      toast.error(errorMessage);
    } finally {
      setCompleting(false);
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
        {/* Go to Dashboard Button */}
        <Button
          onClick={handleComplete}
          disabled={completing || isLoading}
          className="w-full h-auto py-6 px-6 flex items-center justify-center gap-3"
          size="lg"
        >
          {completing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('step3.completing')}
            </>
          ) : (
            <>
              <LayoutDashboard className="h-5 w-5" />
              {t('step3.goToDashboard')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

