import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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

const teamSizeOptions: Array<{ value: TeamSize; labelKey: string }> = [
  { value: '1', labelKey: 'solo' },
  { value: '2-5', labelKey: 'small' },
  { value: '6-20', labelKey: 'team' },
];

const usStateOptions: Array<{ value: string; labelKey: string }> = [
  { value: 'AL', labelKey: 'alabama' },
  { value: 'AK', labelKey: 'alaska' },
  { value: 'AZ', labelKey: 'arizona' },
  { value: 'AR', labelKey: 'arkansas' },
  { value: 'CA', labelKey: 'california' },
  { value: 'CO', labelKey: 'colorado' },
  { value: 'CT', labelKey: 'connecticut' },
  { value: 'DE', labelKey: 'delaware' },
  { value: 'DC', labelKey: 'districtOfColumbia' },
  { value: 'FL', labelKey: 'florida' },
  { value: 'GA', labelKey: 'georgia' },
  { value: 'HI', labelKey: 'hawaii' },
  { value: 'ID', labelKey: 'idaho' },
  { value: 'IL', labelKey: 'illinois' },
  { value: 'IN', labelKey: 'indiana' },
  { value: 'IA', labelKey: 'iowa' },
  { value: 'KS', labelKey: 'kansas' },
  { value: 'KY', labelKey: 'kentucky' },
  { value: 'LA', labelKey: 'louisiana' },
  { value: 'ME', labelKey: 'maine' },
  { value: 'MD', labelKey: 'maryland' },
  { value: 'MA', labelKey: 'massachusetts' },
  { value: 'MI', labelKey: 'michigan' },
  { value: 'MN', labelKey: 'minnesota' },
  { value: 'MS', labelKey: 'mississippi' },
  { value: 'MO', labelKey: 'missouri' },
  { value: 'MT', labelKey: 'montana' },
  { value: 'NE', labelKey: 'nebraska' },
  { value: 'NV', labelKey: 'nevada' },
  { value: 'NH', labelKey: 'newHampshire' },
  { value: 'NJ', labelKey: 'newJersey' },
  { value: 'NM', labelKey: 'newMexico' },
  { value: 'NY', labelKey: 'newYork' },
  { value: 'NC', labelKey: 'northCarolina' },
  { value: 'ND', labelKey: 'northDakota' },
  { value: 'OH', labelKey: 'ohio' },
  { value: 'OK', labelKey: 'oklahoma' },
  { value: 'OR', labelKey: 'oregon' },
  { value: 'PA', labelKey: 'pennsylvania' },
  { value: 'RI', labelKey: 'rhodeIsland' },
  { value: 'SC', labelKey: 'southCarolina' },
  { value: 'SD', labelKey: 'southDakota' },
  { value: 'TN', labelKey: 'tennessee' },
  { value: 'TX', labelKey: 'texas' },
  { value: 'UT', labelKey: 'utah' },
  { value: 'VT', labelKey: 'vermont' },
  { value: 'VA', labelKey: 'virginia' },
  { value: 'WA', labelKey: 'washington' },
  { value: 'WV', labelKey: 'westVirginia' },
  { value: 'WI', labelKey: 'wisconsin' },
  { value: 'WY', labelKey: 'wyoming' },
];

const usStateCodes = new Set(usStateOptions.map((state) => state.value));

const createStep2Schema = (translate: (key: string) => string) =>
  z.object({
    organizationName: z
      .string()
      .trim()
      .min(2, translate('step2.validation.nameMin'))
      .max(255, translate('step2.validation.nameMax')),
    brokerageName: z
      .string()
      .trim()
      .max(255, translate('step2.validation.brokerageMax'))
      .refine((value) => value.length === 0 || value.length >= 2, {
        message: translate('step2.validation.brokerageMin'),
      }),
    licenseState: z
      .string()
      .min(1, translate('step2.validation.licenseStateRequired'))
      .refine((value) => usStateCodes.has(value), {
        message: translate('step2.validation.licenseStateRequired'),
      }),
    primaryMarketCity: z
      .string()
      .trim()
      .min(2, translate('step2.validation.primaryMarketCityMin'))
      .max(120, translate('step2.validation.primaryMarketCityMax')),
    primaryMarketState: z
      .string()
      .min(1, translate('step2.validation.primaryMarketStateRequired'))
      .refine((value) => usStateCodes.has(value), {
        message: translate('step2.validation.primaryMarketStateRequired'),
      }),
    teamSize: z.enum(['1', '2-5', '6-20'], {
      required_error: translate('step2.validation.teamSizeRequired'),
      invalid_type_error: translate('step2.validation.teamSizeRequired'),
    }),
  });

type Step2FormValues = z.infer<ReturnType<typeof createStep2Schema>>;

export function Step2OrganizationSetup({ onContinue, onBack }: Step2OrganizationSetupProps) {
  const { t } = useTranslation('onboarding');
  const {
    organizationName,
    brokerageName,
    licenseState,
    primaryMarketCity,
    primaryMarketState,
    teamSize,
    currency,
    saveStep2,
    isLoading,
  } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const step2Schema = useMemo(() => createStep2Schema(t), [t]);

  const form = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      organizationName,
      brokerageName,
      licenseState,
      primaryMarketCity,
      primaryMarketState,
      teamSize: teamSize ?? undefined,
    },
  });

  useEffect(() => {
    form.reset({
      organizationName,
      brokerageName,
      licenseState,
      primaryMarketCity,
      primaryMarketState,
      teamSize: teamSize ?? undefined,
    });
  }, [
    organizationName,
    brokerageName,
    licenseState,
    primaryMarketCity,
    primaryMarketState,
    teamSize,
    form,
  ]);

  const handleContinue = async (values: Step2FormValues) => {
    setSaving(true);
    try {
      await saveStep2({
        ...values,
        currency: 'USD',
      });
      onContinue();
    } catch {
      // Error is handled in useOnboarding with toast feedback
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleContinue)} className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                {t('step2.organization.title')}
              </Label>

              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t('step2.organization.name')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('step2.organization.namePlaceholder')}
                        disabled={saving || isLoading}
                        maxLength={255}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brokerageName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t('step2.organization.brokerageName')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('step2.organization.brokerageNamePlaceholder')}
                        disabled={saving || isLoading}
                        maxLength={255}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licenseState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('step2.organization.licenseState')}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={saving || isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('step2.organization.licenseStatePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {usStateOptions.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {t(`step2.states.${state.labelKey}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="text-base font-semibold">
                {t('step2.market.title')}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryMarketCity"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>{t('step2.market.city')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('step2.market.cityPlaceholder')}
                          disabled={saving || isLoading}
                          maxLength={120}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primaryMarketState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('step2.market.state')}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={saving || isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('step2.market.statePlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {usStateOptions.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {t(`step2.states.${state.labelKey}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-base font-semibold">
                      {t('step2.organization.teamSize')}
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="space-y-3"
                        disabled={saving || isLoading}
                      >
                        {teamSizeOptions.map((option) => {
                          const isSelected = field.value === option.value;

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
                              onClick={() => !saving && !isLoading && field.onChange(option.value)}
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
                                <span
                                  className={cn(
                                    'text-sm font-medium',
                                    isSelected ? 'text-blue-900' : 'text-slate-700'
                                  )}
                                >
                                  {t(`step2.organization.teamSizeOptions.${option.labelKey}`)}
                                </span>
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label className="text-base font-semibold text-muted-foreground">
                  {t('step2.preferences.title')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('step2.preferences.description')}
                </p>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="currency" className="text-sm">
                    {t('step2.preferences.currency')}
                  </Label>
                  <Select value={currency} disabled>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">
                        {t('step2.preferences.currencyOptions.usd')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={saving || isLoading}
                className="flex-1"
              >
                {t('step2.back')}
              </Button>
              <Button
                type="submit"
                disabled={saving || isLoading}
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
