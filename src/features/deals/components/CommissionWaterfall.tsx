import { useTranslation } from 'react-i18next';
import type { CommissionCalculationResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CommissionWaterfallProps {
  result: CommissionCalculationResult;
}

const money = (value: number): string =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const CommissionWaterfall = ({ result }: CommissionWaterfallProps) => {
  const { t } = useTranslation('deals');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('commissionSheet.waterfall.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>{t('commissionSheet.waterfall.dealGci')}: {money(result.dealGCI)}</p>
        <p>{t('commissionSheet.waterfall.referral')}: -{money(result.referralFeeAmount)}</p>
        <p>{t('commissionSheet.waterfall.postReferral')}: {money(result.postReferralGCI)}</p>
        <p>{t('commissionSheet.waterfall.broker')}: -{money(result.brokerDollar)}</p>
        <p>{t('commissionSheet.waterfall.franchise')}: -{money(result.franchiseFee)}</p>
        <p>{t('commissionSheet.waterfall.transaction')}: -{money(result.transactionFee)}</p>
        <p>{t('commissionSheet.waterfall.eo')}: -{money(result.eoFee)}</p>
        <p>{t('commissionSheet.waterfall.tc')}: -{money(result.tcFee)}</p>
        <p>{t('commissionSheet.waterfall.other')}: -{money(result.otherFees)}</p>
        <p className="font-semibold">{t('commissionSheet.waterfall.net')}: {money(result.netCommission)}</p>
      </CardContent>
    </Card>
  );
};
