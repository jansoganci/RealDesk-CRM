import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { COLORS } from '@/config/colors';

export interface KeyDatesCardProps {
  effectiveDate?: string;
  earnestMoneyDueDate?: string;
  inspectionDeadline?: string;
  appraisalContingency?: boolean;
  closingDate?: string;
}

type Node = {
  key: string;
  label: string;
  value?: string;
};

function fmt(v?: string): string {
  if (!v) return '—';
  try {
    return format(parseISO(v), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export function KeyDatesCard({
  effectiveDate,
  earnestMoneyDueDate,
  inspectionDeadline,
  appraisalContingency = false,
  closingDate,
}: KeyDatesCardProps) {
  const { t } = useTranslation('contracts');

  const nodes: Node[] = [
    { key: 'effective', label: t('purchaseWizard.step9.keyDates.effectiveDate'), value: effectiveDate },
    { key: 'earnest', label: t('purchaseWizard.step9.keyDates.earnestMoneyDueDate'), value: earnestMoneyDueDate },
    { key: 'inspection', label: t('purchaseWizard.step9.keyDates.inspectionDeadline'), value: inspectionDeadline },
  ];

  if (appraisalContingency) {
    nodes.push({
      key: 'appraisal',
      label: t('purchaseWizard.step9.keyDates.appraisal'),
      value: inspectionDeadline,
    });
  }

  nodes.push({ key: 'closing', label: t('purchaseWizard.step9.keyDates.closingDate'), value: closingDate });

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{t('purchaseWizard.step9.keyDates.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {nodes.map((node, idx) => {
            const hasValue = Boolean(node.value);
            return (
              <div key={node.key} className="relative rounded-md border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      hasValue ? COLORS.primary.bg : COLORS.gray.bg200
                    }`}
                  />
                  <p className={`text-xs font-medium ${COLORS.muted.text}`}>{node.label}</p>
                </div>
                <p className={`text-sm ${hasValue ? COLORS.gray.text900 : COLORS.muted.text}`}>{fmt(node.value)}</p>
                {idx < nodes.length - 1 && (
                  <span className={`absolute right-[-10px] top-1/2 hidden h-px w-4 ${COLORS.gray.bg200} lg:block`} />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

