import { useTranslation } from 'react-i18next';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import type { UseFormReturn } from 'react-hook-form';
import type { getProfileSchema } from '../profileSchema';
import type * as z from 'zod';

/**
 * Personal Info Section Component
 * Displays form fields for full name and phone number
 */

type ProfileFormData = z.infer<ReturnType<typeof getProfileSchema>>;

interface PersonalInfoSectionProps {
  form: UseFormReturn<ProfileFormData>;
  loading: boolean;
}

export function PersonalInfoSection({ form, loading }: PersonalInfoSectionProps) {
  const { t } = useTranslation('profile');

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
                {...field}
                disabled={loading}
                className="h-9"
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
                placeholder={t('profile:fields.phoneNumberPlaceholder')}
                {...field}
                disabled={loading}
                className="h-9"
              />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    </>
  );
}

