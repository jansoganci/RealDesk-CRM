import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOnboarding, type TeamSize } from '../hooks/useOnboarding';
import { cn } from '@/lib/utils';

interface Step2OrganizationSetupProps {
  onContinue: () => void;
  onBack: () => void;
}

const teamSizeOptions: Array<{
  value: TeamSize;
  labelKey: string;
}> = [
  { value: '1', labelKey: 'solo' },
  { value: '2-5', labelKey: 'small' },
  { value: '6-20', labelKey: 'medium' },
  { value: '21+', labelKey: 'large' },
];

export function Step2OrganizationSetup({ onContinue, onBack }: Step2OrganizationSetupProps) {
  const { t } = useTranslation('onboarding');
  const {
    organizationName,
    teamSize,
    currency,
    setOrganizationName,
    setTeamSize,
    setCurrency,
    saveStep2,
    isLoading,
  } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    teamSize?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!organizationName || organizationName.trim().length < 2) {
      newErrors.name = t('step2.validation.nameMin');
    } else if (organizationName.length > 255) {
      newErrors.name = t('step2.validation.nameMax');
    }

    if (!teamSize) {
      newErrors.teamSize = t('step2.validation.teamSizeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      await saveStep2();
      onContinue();
    } catch (error) {
      // Error is already handled in saveStep2 with toast
      console.error('Failed to save Step 2:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl md:text-3xl font-bold">
          {t('step2.title')}
        </CardTitle>
        <CardDescription className="text-base">
          {t('step2.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Organization Information Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              {t('step2.organization.title')}
            </Label>

            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="org-name" className="text-sm">
                {t('step2.organization.name')}
              </Label>
              <Input
                id="org-name"
                value={organizationName}
                onChange={(e) => {
                  setOrganizationName(e.target.value);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                placeholder={t('step2.organization.namePlaceholder')}
                disabled={saving || isLoading}
                className={cn(errors.name && 'border-red-500')}
                maxLength={255}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Team Size */}
            <div className="space-y-2">
              <Label className="text-sm">
                {t('step2.organization.teamSize')}
              </Label>
              <RadioGroup
                value={teamSize || ''}
                onValueChange={(value) => {
                  setTeamSize(value as TeamSize);
                  if (errors.teamSize) {
                    setErrors((prev) => ({ ...prev, teamSize: undefined }));
                  }
                }}
                className="space-y-3"
                disabled={saving || isLoading}
              >
                {teamSizeOptions.map((option) => {
                  const isSelected = teamSize === option.value;
                  
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        'flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                        'hover:bg-slate-50 hover:border-blue-300 dark:hover:bg-slate-800/50 dark:hover:border-blue-600',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
                          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                      )}
                      onClick={() => !saving && !isLoading && setTeamSize(option.value)}
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={`team-${option.value}`}
                        className="flex-shrink-0"
                      />
                      <Label
                        htmlFor={`team-${option.value}`}
                        className="flex-1 cursor-pointer"
                      >
                        <span className={cn(
                          'text-sm font-medium',
                          isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-slate-700 dark:text-slate-200'
                        )}>
                          {t(`step2.organization.teamSizeOptions.${option.labelKey}`)}
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              {errors.teamSize && (
                <p className="text-sm text-red-500">{errors.teamSize}</p>
              )}
            </div>
          </div>
        </div>

        {/* Preferences Section (Optional) */}
        <div className="space-y-4 pt-4 border-t dark:border-slate-800">
          <div className="space-y-2">
            <Label className="text-base font-semibold text-muted-foreground">
              {t('step2.preferences.title')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('step2.preferences.description')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm">
                  {t('step2.preferences.currency')}
                </Label>
                <Select
                  value={currency}
                  onValueChange={(value) => setCurrency(value as 'TRY' | 'USD' | 'EUR')}
                  disabled={saving || isLoading}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">TRY (₺)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={saving || isLoading}
            className="flex-1"
          >
            {t('step2.back')}
          </Button>
          <Button
            onClick={handleContinue}
            disabled={saving || isLoading || !organizationName.trim() || !teamSize}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('step2.saving')}
              </>
            ) : (
              t('step2.continue')
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

