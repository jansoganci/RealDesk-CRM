import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Home, Users, FileText, UserCog, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useOnboarding, type PrimaryUseCase } from '../hooks/useOnboarding';
import { useOrg } from '@/contexts/OrgContext';
import { onboardingService } from '../services/onboarding.service';
import { getAuthenticatedUserId } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Step1GoalSelectionProps {
  onContinue: () => void;
}

const useCaseOptions: Array<{
  value: PrimaryUseCase;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}> = [
  { value: 'properties', icon: Home, labelKey: 'properties' },
  { value: 'clients', icon: Users, labelKey: 'clients' },
  { value: 'contracts', icon: FileText, labelKey: 'contracts' },
  { value: 'team', icon: UserCog, labelKey: 'team' },
  { value: 'all', icon: Sparkles, labelKey: 'all' },
];

export function Step1GoalSelection({ onContinue }: Step1GoalSelectionProps) {
  const { t } = useTranslation('onboarding');
  const { primaryUseCase, setPrimaryUseCase, isLoading } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const { currentOrg } = useOrg();

  const handleSkip = async () => {
    if (!currentOrg?.id) {
      toast.error('Organization not found');
      return;
    }

    setSaving(true);
    try {
      const userId = await getAuthenticatedUserId();
      
      // Default to "all" when skipping
      await onboardingService.savePrimaryUseCase(currentOrg.id, 'all');
      
      // Track skip event
      await onboardingService.trackEvent(
        currentOrg.id,
        userId,
        1,
        'goal_selection',
        'skipped',
        { primary_use_case: 'all' }
      );

      setPrimaryUseCase('all');
      onContinue();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to skip step';
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

    if (!currentOrg?.id) {
      toast.error('Organization not found');
      return;
    }

    setSaving(true);
    try {
      const userId = await getAuthenticatedUserId();
      
      await onboardingService.savePrimaryUseCase(currentOrg.id, primaryUseCase);
      
      await onboardingService.trackEvent(
        currentOrg.id,
        userId,
        1,
        'goal_selection',
        'completed',
        { primary_use_case: primaryUseCase }
      );

      onContinue();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save selection';
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
                    className="flex-1 cursor-pointer flex items-center gap-3"
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        isSelected ? 'text-blue-600' : 'text-slate-400'
                      )}
                    />
                    <span className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-blue-900' : 'text-slate-700'
                    )}>
                      {t(`step1.options.${option.labelKey}`)}
                    </span>
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

