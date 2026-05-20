import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Home, Handshake, Layers, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useOnboarding, type PrimaryUseCase } from '../hooks/useOnboarding';
import { useOrg } from '@/contexts/OrgContext';
import { onboardingService, organizationService } from '@/lib/serviceProxy';
import { getAuthenticatedUserId } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Step1GoalSelectionProps {
  onContinue: () => void;
}

const useCaseOptions: Array<{
  value: PrimaryUseCase;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: 'rentals', icon: Home },
  { value: 'sales', icon: Handshake },
  { value: 'both', icon: Layers },
  { value: 'exploring', icon: Compass },
];

export function Step1GoalSelection({ onContinue }: Step1GoalSelectionProps) {
  const { t } = useTranslation('onboarding');
  const { primaryUseCase, setPrimaryUseCase, isLoading } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const { currentOrg, refreshOrg } = useOrg();

  const handleSkip = async () => {
    setSaving(true);
    try {
      const userId = await getAuthenticatedUserId();
      let orgId = currentOrg?.id;

      // If no organization exists, create one first
      if (!orgId) {
        orgId = await organizationService.createFirstOrganization('My Organization');
        // Refresh org context to load the newly created organization
        await refreshOrg();
      }
      
      // Default to "exploring" when skipping
      await onboardingService.savePrimaryUseCase(orgId, 'exploring');
      
      // Track skip event
      await onboardingService.trackEvent(
        orgId,
        userId,
        1,
        'goal_selection',
        'skipped',
        { primary_use_case: 'exploring' }
      );

      setPrimaryUseCase('exploring');
      onContinue();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('step1.errors.skipFailed');
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    if (!primaryUseCase) {
      toast.error(t('step1.validation.required'));
      return;
    }

    setSaving(true);
    try {
      const userId = await getAuthenticatedUserId();
      let orgId = currentOrg?.id;

      // If no organization exists, create one first
      if (!orgId) {
        orgId = await organizationService.createFirstOrganization('My Organization');
        // Refresh org context to load the newly created organization
        await refreshOrg();
      }
      
      await onboardingService.savePrimaryUseCase(orgId, primaryUseCase);
      
      await onboardingService.trackEvent(
        orgId,
        userId,
        1,
        'goal_selection',
        'completed',
        { primary_use_case: primaryUseCase }
      );

      onContinue();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('step1.errors.saveFailed');
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl md:text-3xl font-bold">
          {t('step1.title')}
        </CardTitle>
        <CardDescription className="text-base">
          {t('step1.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            {t('step1.question')}
          </Label>
          <RadioGroup
            value={primaryUseCase || ''}
            onValueChange={(value) => setPrimaryUseCase(value as PrimaryUseCase)}
            className="space-y-3"
            disabled={saving || isLoading}
          >
            {useCaseOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = primaryUseCase === option.value;
              
              return (
                <div
                  key={option.value}
                  className={cn(
                    'flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                    'hover:bg-slate-50 hover:border-blue-300',
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white'
                  )}
                  onClick={() => !saving && !isLoading && setPrimaryUseCase(option.value)}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="flex-shrink-0"
                  />
                  <Label
                    htmlFor={option.value}
                    className="flex-1 cursor-pointer flex items-start gap-3"
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        isSelected ? 'text-blue-600' : 'text-slate-400'
                      )}
                    />
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isSelected ? 'text-blue-900' : 'text-slate-700'
                        )}
                      >
                        {t(`step1.options.${option.value}.label`)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {t(`step1.options.${option.value}.description`)}
                      </span>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={saving || isLoading}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('step1.saving')}
              </>
            ) : (
              t('step1.skip')
            )}
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!primaryUseCase || saving || isLoading}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('step1.saving')}
              </>
            ) : (
              t('step1.continue')
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

