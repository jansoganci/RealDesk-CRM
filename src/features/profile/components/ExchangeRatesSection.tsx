import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

/**
 * Exchange Rates Section Component
 * Displays exchange rates with refresh functionality and last updated timestamp
 */

interface ExchangeRatesSectionProps {
  exchangeRates: Record<string, number>;
  lastUpdated: number | null;
  refreshingRates: boolean;
  onRefreshRates: () => Promise<void>;
  formatLastUpdated: (timestamp: number | null) => string;
}

export function ExchangeRatesSection({
  exchangeRates,
  lastUpdated,
  refreshingRates,
  onRefreshRates,
  formatLastUpdated,
}: ExchangeRatesSectionProps) {
  const { t } = useTranslation('profile');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {t('profile:exchangeRates.title')}
          </h3>
          <p className="text-xs text-gray-500">{t('profile:exchangeRates.description')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshRates}
          disabled={refreshingRates}
          className="h-8"
        >
          {refreshingRates ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center justify-between p-2 rounded-md bg-blue-50 border border-blue-100">
          <span className="text-xs font-medium text-slate-700">USD</span>
          <span className="text-xs font-bold text-slate-900">1.00</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-md bg-emerald-50 border border-emerald-100">
          <span className="text-xs font-medium text-slate-700">TRY</span>
          <span className="text-xs font-bold text-slate-900">
            {exchangeRates.TRY?.toFixed(2) || '42.30'}
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-md bg-purple-50 border border-purple-100">
          <span className="text-xs font-medium text-slate-700">EUR</span>
          <span className="text-xs font-bold text-slate-900">
            {exchangeRates.EUR?.toFixed(2) || '49.09'}
          </span>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-500 text-center">
          {t('profile:exchangeRates.lastUpdated')}: {formatLastUpdated(lastUpdated)}
        </p>
      )}
    </div>
  );
}

