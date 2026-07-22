import { useEffect, useMemo, useState } from 'react';

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

    saveStep2,
    isLoading,
  } = useOnboarding();
  const [saving, setSaving] = useState(false);

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

              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (

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

                    </FormControl>
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
