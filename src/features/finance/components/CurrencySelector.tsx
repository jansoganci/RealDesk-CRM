// =====================================================
// Currency Selector Component
// Shows the US-market display currency preference.
// =====================================================

import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { useAuth } from '../../../contexts/AuthContext';
import { userPreferencesService } from '../../../services/userPreferences.service';
import { toast } from 'sonner';

export function CurrencySelector() {
  const { t } = useTranslation(['finance', 'common']);
  const { setCurrency } = useAuth();

  const handleCurrencyChange = async (newCurrency: string) => {
    try {
      await userPreferencesService.updateCurrency(newCurrency);
      setCurrency(newCurrency);
      toast.success(t('finance:currency.updated'));
    } catch (error) {
      console.error('Failed to update currency preference:', error);
      toast.error(t('finance:currency.updateError'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600 dark:text-slate-300 whitespace-nowrap">
        {t('finance:currency.displayCurrency')}:
      </label>
      <Select
        value="USD"
        onValueChange={handleCurrencyChange}
      >
        <SelectTrigger className="w-24 h-8 md:h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="USD">USD</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
