import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { leaseAgreementService } from '@/lib/serviceProxy';
import type { LeaseAmendment } from '@/types';

type LeaseAmendmentTimelineProps = {
  contractId: string;
};

function formatDateSafe(v: string): string {
  try {
    return format(new Date(v), 'MMM d, yyyy');
  } catch {
    return v;
  }
}

export function LeaseAmendmentTimeline({ contractId }: LeaseAmendmentTimelineProps) {
  const { t } = useTranslation('contracts');
  const [items, setItems] = useState<LeaseAmendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await leaseAgreementService.getAmendments(contractId);
        if (!cancelled) setItems(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load amendments');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contractId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('leaseDetail.documents.loadingAmendments')}</p>;
  }
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('leaseDetail.documents.noAmendments')}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="relative border-l border-border pl-4">
          <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
          <p className="text-sm font-medium">{formatDateSafe(item.amendment_date)}</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
