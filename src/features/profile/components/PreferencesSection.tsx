/**
 * @deprecated This component is being replaced by ProfileInfoCard + EditProfileInfoDialog.
 * The new approach uses a read-only card display with an edit modal instead of inline editing.
 *
 * This file is kept for reference during the transition period.
 * TODO: Delete this file after profile redesign is complete and tested.
 *
 * New components:
 * - ProfileInfoCard.tsx - Read-only display of profile information
 * - EditProfileInfoDialog.tsx - Modal for editing profile info
 */

import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
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
import { Lock } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { getProfileSchema } from '../profileSchema';
import type * as z from 'zod';

/**
 * @deprecated Use ProfileInfoCard and EditProfileInfoDialog instead.
 * Preferences Section Component
 * Displays form fields for language, currency, meeting reminder, and commission rate
 */

type ProfileFormData = z.infer<ReturnType<typeof getProfileSchema>>;

interface PreferencesSectionProps {
  form: UseFormReturn<ProfileFormData>;
  loading?: boolean;
}

export function PreferencesSection({ form, loading = false }: PreferencesSectionProps) {
  const { t } = useTranslation('profile');
  const { user } = useAuth();

  return (
    <>
      {/* Full Name */}
      <FormField
        control={form.control}
        name="full_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm">{t('profile:fields.fullName')}</FormLabel>
            <FormControl>
              <Input
                placeholder={t('profile:fields.fullNamePlaceholder')}
                disabled={loading}
                className="h-9"
                {...field}
              />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {/* Phone Number */}
      <FormField
        control={form.control}
        name="phone_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm">{t('profile:fields.phoneNumber')}</FormLabel>
            <FormControl>
              <Input
                type="tel"
                placeholder={t('profile:fields.phoneNumberPlaceholder')}
                disabled={loading}
                className="h-9"
                {...field}
              />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {/* Email (Read-only) */}
      <FormItem>
        <FormLabel className="text-sm">{t('profile:fields.emailLocked')}</FormLabel>
        <div className="relative">
          <Input
            value={user?.email || ''}
            disabled
            className="h-9 bg-slate-50 text-slate-600 border border-slate-200 cursor-not-allowed pr-10 dark:bg-slate-900/90 dark:text-slate-400 dark:border-slate-700"
          />
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
        <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
          {t('accountSecurity.description')}
        </FormDescription>
      </FormItem>

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
            <FormDescription className="text-xs text-slate-600 dark:text-slate-400">
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
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400">
                  %
                </span>
              </div>
            </FormControl>
            <FormDescription className="text-xs text-slate-600 dark:text-slate-400">
              {t('profile:fields.commissionRateDescription')}
            </FormDescription>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    </>
  );
}
