import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, RefreshCw, FileText } from 'lucide-react';

interface ExchangeRatesCardProps {
  exchangeRates: Record<string, number>;
  lastUpdated: number | null;
  refreshingRates: boolean;
  onRefresh: () => void;
  formatLastUpdated: (timestamp: number | null) => string;
}

export function ExchangeRatesCard({
  exchangeRates,
  lastUpdated,
  refreshingRates,
  onRefresh,
  formatLastUpdated,
}: ExchangeRatesCardProps) {
  const { t } = useTranslation('dashboard');
  const { t: tContracts } = useTranslation('contracts');
  const navigate = useNavigate();

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
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">{t('exchangeRates.usd_try')}</div>
              <div className="text-sm md:text-base font-semibold text-gray-900">
                {exchangeRates.TRY?.toFixed(2) || '42.30'}
              </div>
            </div>
            <div className="w-px h-6 md:h-8 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">{t('exchangeRates.eur_try')}</div>
              <div className="text-sm md:text-base font-semibold text-gray-900">
                {(exchangeRates.TRY && exchangeRates.EUR) 
                  ? (exchangeRates.TRY / exchangeRates.EUR).toFixed(2) 
                  : '49.09'}
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
            <Button
              onClick={() => navigate('/contracts/rent')}
              variant="default"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md h-8 md:h-10 px-2 md:px-4 text-xs md:text-sm"
            >
              <FileText className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              <span>{tContracts('pdfExtract.buttonText')}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

