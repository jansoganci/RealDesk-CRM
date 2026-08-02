/**
 * Sprint 6B T14 — Key dates from purchase contract + purchase_details.
 */

import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { COLORS } from '@/config/colors';
import type { KeyDatesData } from '@/types';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export type KeyDatesCardProps = {
  data: KeyDatesData;
};

export function KeyDatesCard({ data }: KeyDatesCardProps) {
  const { t } = useTranslation('deals');

  const rows: { key: keyof KeyDatesData; label: string }[] = [
    { key: 'effective_date', label: t('purchaseDetail.keyDates.effective') },
    { key: 'earnest_money_due_date', label: t('purchaseDetail.keyDates.earnestMoney') },
    { key: 'bank_preapproval_letter_date', label: t('purchaseDetail.keyDates.preapproval') },
    { key: 'inspection_contractor_deadline_date', label: t('purchaseDetail.keyDates.inspectionAccess') },
    { key: 'inspection_disclosures_deadline_date', label: t('purchaseDetail.keyDates.disclosures') },
    { key: 'offer_expiration_date', label: t('purchaseDetail.keyDates.offerExpiration') },
    { key: 'closing_date', label: t('purchaseDetail.keyDates.closing') },
  ];

  return (
    <Card className="border-border/80 dark:border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{t('purchaseDetail.keyDates.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          {rows.map(({ key, label }) => (
            <div
              key={key}
              className="flex flex-col gap-0.5 border-b border-border dark:border-border py-2 last:border-0 sm:flex-row sm:justify-between"
            >
              <dt className={`text-sm font-medium ${COLORS.muted.text} dark:text-muted-foreground/70`}>{label}</dt>
              <dd className={`text-sm ${COLORS.gray.text900} dark:text-foreground`}>{formatDate(data[key])}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
