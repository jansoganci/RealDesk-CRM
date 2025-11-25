import { useTranslation } from 'react-i18next';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import type { UseFormReturn } from 'react-hook-form';
import type { getProfileSchema } from '../profileSchema';
import type * as z from 'zod';

/**
 * Preferences Section Component
 * Displays form fields for language, currency, meeting reminder, and commission rate
 */

type ProfileFormData = z.infer<ReturnType<typeof getProfileSchema>>;

interface PreferencesSectionProps {
  form: UseFormReturn<ProfileFormData>;
  loading: boolean;
}

export function PreferencesSection({ form, loading }: PreferencesSectionProps) {
  const { t } = useTranslation('profile');

  return (
    <>
      {/* Language */}
      <FormField
        control={form.control}
        name="language"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm">{t('profile:fields.language')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('profile:fields.languagePlaceholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="en">{t('profile:languages.en')}</SelectItem>
                <SelectItem value="tr">{t('profile:languages.tr')}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {/* Currency */}
      <FormField
        control={form.control}
        name="currency"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm">{t('profile:fields.currency')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('profile:fields.currencyPlaceholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="USD">{t('profile:currencies.USD')}</SelectItem>
                <SelectItem value="TRY">{t('profile:currencies.TRY')}</SelectItem>
                <SelectItem value="EUR">{t('profile:currencies.EUR')}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {/* Meeting Reminder */}
      <FormField
        control={form.control}
        name="meeting_reminder_minutes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm">{t('profile:fields.meetingReminder')}</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(parseInt(value))}
              value={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('profile:fields.meetingReminderPlaceholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="30">{t('profile:reminderMinutes.30')}</SelectItem>
                <SelectItem value="60">{t('profile:reminderMinutes.60')}</SelectItem>
                <SelectItem value="90">{t('profile:reminderMinutes.90')}</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription className="text-xs">
              {t('profile:fields.meetingReminderDescription')}
            </FormDescription>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {/* Commission Rate */}
      <FormField
        control={form.control}
        name="commission_rate"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm">{t('profile:fields.commissionRate')}</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="20"
                  placeholder="4.0"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  disabled={loading}
                  className="h-9 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
              </div>
            </FormControl>
            <FormDescription className="text-xs">
              {t('profile:fields.commissionRateDescription')}
            </FormDescription>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    </>
  );
}

