import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { PropertyTypeSelector } from '../PropertyTypeSelector';

interface PropertyTypeSelectorSectionProps {
  value: 'rental' | 'sale';
  onChange: (value: 'rental' | 'sale') => void;
  disabled?: boolean;
}

/**
 * Property Type Selector Section Component
 * Wrapper component for PropertyTypeSelector with label
 */
export function PropertyTypeSelectorSection({
  value,
  onChange,
  disabled = false,
}: PropertyTypeSelectorSectionProps) {
  const { t } = useTranslation(['properties', 'common']);

  return (
    <div className="space-y-2">
      <Label>{t('dialog.form.propertyType')} *</Label>
      <PropertyTypeSelector
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

