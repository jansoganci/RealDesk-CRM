import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COLORS } from '@/config/colors';
import { PropertyOwner } from '@/types';

interface OwnerSelectFieldProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  owners: PropertyOwner[];
  loading: boolean;
  disabled?: boolean;
  error?: string;
}

/**
 * Owner Selection Field Component
 * Displays a dropdown for selecting a property owner
 */
export function OwnerSelectField({
  value,
  onValueChange,
  owners,
  loading,
  disabled = false,
  error,
}: OwnerSelectFieldProps) {
  const { t } = useTranslation(['properties', 'common']);

  return (
    <div className="space-y-2">
      <Label htmlFor="owner_id">{t('dialog.form.owner')} *</Label>
      <Select
        value={value || ''}
        onValueChange={onValueChange}
        disabled={loading || disabled}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={
              loading
                ? t('common:loading', 'Yükleniyor...')
                : t('dialog.form.selectOwner', 'Ev sahibi seçin')
            }
          />
        </SelectTrigger>
        <SelectContent>
          {owners.length === 0 && !loading && (
            <div className="p-2 text-sm text-gray-500">
              {t('dialog.form.noOwners', 'Henüz ev sahibi eklenmemiş')}
            </div>
          )}
          {owners.map((owner) => (
            <SelectItem key={owner.id} value={owner.id}>
              {owner.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className={`text-sm ${COLORS.danger.text}`}>{error}</p>
      )}
    </div>
  );
}

