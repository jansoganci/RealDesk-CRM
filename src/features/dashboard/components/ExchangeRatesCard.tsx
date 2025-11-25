import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, RefreshCw } from 'lucide-react';
import { QuickAddButton } from '@/features/quick-add';
import { PDFExtractButton } from '../PDFExtractButton';

interface ExchangeRatesCardProps {
  exchangeRates: Record<string, number>;
  lastUpdated: number | null;
  refreshingRates: boolean;
  onRefresh: () => void;
  formatLastUpdated: (timestamp: number | null) => string;
  onQuickAddSuccess: () => void;
}

export function ExchangeRatesCard({
  exchangeRates,
  lastUpdated,
  refreshingRates,
  onRefresh,
  formatLastUpdated,
  onQuickAddSuccess,
}: ExchangeRatesCardProps) {
  const { t } = useTranslation('dashboard');

  return (
    <Card className="mb-6 shadow-sm border border-gray-200 bg-white">
      <CardContent className="py-2 md:py-3 px-3 md:px-4">
        <div className="flex items-center justify-between gap-2 md:gap-6">
          {/* Left: Title (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <DollarSign className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {t('exchangeRates.title')}
            </span>
          </div>

          {/* Center: Rates */}
          <div className="flex items-center gap-3 md:gap-4 flex-1 justify-start md:justify-center">
            <div className="text-center hidden md:block">
              <div className="text-xs text-gray-500 mb-0.5">USD</div>
              <div className="text-sm md:text-base font-semibold text-gray-900">1.00</div>
            </div>
            <div className="w-px h-6 md:h-8 bg-gray-200 hidden md:block"></div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">TRY</div>
              <div className="text-sm md:text-base font-semibold text-gray-900">
                {exchangeRates.TRY?.toFixed(2) || '42.30'}
              </div>
            </div>
            <div className="w-px h-6 md:h-8 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">EUR</div>
              <div className="text-sm md:text-base font-semibold text-gray-900">
                {exchangeRates.EUR?.toFixed(2) || '49.09'}
              </div>
            </div>
          </div>

          {/* Right: Last Updated, Refresh & Quick Add */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {lastUpdated && (
              <span className="text-xs text-gray-400 hidden lg:inline">
                {t('exchangeRates.lastUpdated')}: {formatLastUpdated(lastUpdated)}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={refreshingRates}
              className="h-7 w-7 p-0 hover:bg-gray-100"
              title={t('exchangeRates.refreshButton')}
            >
              {refreshingRates ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-gray-600" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-gray-600" />
              )}
            </Button>
            <PDFExtractButton />
            <QuickAddButton onSuccess={onQuickAddSuccess} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

