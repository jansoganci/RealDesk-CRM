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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type * as z from 'zod';
import { PreferencesSection } from './PreferencesSection';
import type { getProfileSchema } from '../profileSchema';

type ProfileFormData = z.infer<ReturnType<typeof getProfileSchema>>;

/**
 * @deprecated Use ProfileInfoCard and EditProfileInfoDialog instead.
 */
interface AccountSettingsCardProps {
  form: UseFormReturn<ProfileFormData>;
  loading: boolean;
  onSave: () => void;
}

export const AccountSettingsCard = ({ form, loading, onSave }: AccountSettingsCardProps) => {
  const { t } = useTranslation('profile');

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pb-4">
        <div>
          <CardTitle>{t('sections.preferences')}</CardTitle>
          <CardDescription className="mt-1.5">
            {t('sections.preferencesDescription')}
          </CardDescription>
        </div>
        <Button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="gap-2 w-full sm:w-auto"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t('actions.save')}
        </Button>
      </CardHeader>
      <CardContent>
        <PreferencesSection form={form} />
      </CardContent>
    </Card>
  );
};
