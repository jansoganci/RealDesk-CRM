import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { US_STATES } from '@/lib/serviceProxy';
import { useOnboarding } from '../hooks/useOnboarding';

interface Step2OrganizationSetupProps {
  onContinue: () => void;
  onBack: () => void;
}

const usStateCodes = US_STATES.map((state) => state.code);

const createOrganizationProfileSchema = (t: (key: string) => string) =>
  z.object({
    organizationName: z
      .string()
      .trim()
      .min(2, { message: t('step2.validation.organizationNameMin') })
      .max(255, { message: t('step2.validation.organizationNameMax') }),
    brokerageName: z
      .string()
      .trim()
      .min(1, { message: t('step2.validation.brokerageNameRequired') })
      .max(255, { message: t('step2.validation.brokerageNameMax') }),
    licenseState: z
      .string()
      .refine((value) => usStateCodes.includes(value), {
        message: t('step2.validation.licenseStateRequired'),
      }),
    primaryMarketCity: z
      .string()
      .trim()
      .min(1, { message: t('step2.validation.primaryMarketCityRequired') })
      .max(120, { message: t('step2.validation.primaryMarketCityMax') }),
    primaryMarketState: z
      .string()
      .refine((value) => usStateCodes.includes(value), {
        message: t('step2.validation.primaryMarketStateRequired'),
      }),
  });

type OrganizationProfileFormData = z.infer<ReturnType<typeof createOrganizationProfileSchema>>;

export function Step2OrganizationSetup({ onContinue, onBack }: Step2OrganizationSetupProps) {
  const { t } = useTranslation('onboarding');
  const {
    organizationName,
    brokerageName,
    licenseState,
    primaryMarketCity,
    primaryMarketState,
    saveStep2,
    isLoading,
  } = useOnboarding();
  const [saving, setSaving] = useState(false);

  const schema = useMemo(
    () => createOrganizationProfileSchema((key: string) => t(key)),
    [t]
  );

  const form = useForm<OrganizationProfileFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationName,
      brokerageName,
      licenseState,
      primaryMarketCity,
      primaryMarketState,
    },
  });

  useEffect(() => {
    form.reset({
      organizationName,
      brokerageName,
      licenseState,
      primaryMarketCity,
      primaryMarketState,
    });
  }, [brokerageName, form, licenseState, organizationName, primaryMarketCity, primaryMarketState]);

  const onSubmit = async (data: OrganizationProfileFormData) => {
    setSaving(true);
    try {
      await saveStep2(data);
      onContinue();
    } catch {
      // saveStep2 owns the user-facing toast.
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
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('step2.organization.organizationName')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('step2.organization.organizationNamePlaceholder')}
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
                  <FormItem className="sm:col-span-2">
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
                        {US_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primaryMarketCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('step2.organization.primaryMarketCity')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('step2.organization.primaryMarketCityPlaceholder')}
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
                    <FormLabel>{t('step2.organization.primaryMarketState')}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={saving || isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('step2.organization.primaryMarketStatePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
