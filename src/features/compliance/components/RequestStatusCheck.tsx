import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ccpaService, type CheckRequestStatusResult } from '@/lib/serviceProxy';
import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  in_review: 'bg-warning/15 text-warning',
  verification_sent: 'bg-info/15 text-info',
  completed: 'bg-success/15 text-success',
  denied: 'bg-destructive/15 text-destructive',
};

export function RequestStatusCheck() {
  const { t } = useTranslation('compliance');
  const [requestId, setRequestId] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<CheckRequestStatusResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const canCheck = requestId.trim().length > 0 && email.trim().length > 0;

  const handleCheck = async () => {
    if (!canCheck) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    try {
      const data = await ccpaService.checkRequestStatus(requestId.trim(), email.trim());
      setResult(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="requestId">{t('statusCheck.requestIdLabel')}</Label>
          <Input
            id="requestId"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder={t('statusCheck.requestIdPlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="statusEmail">{t('statusCheck.emailLabel')}</Label>
          <Input
            id="statusEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('statusCheck.emailPlaceholder')}
          />
        </div>
        <Button onClick={handleCheck} disabled={loading || !canCheck} className="w-full sm:w-auto">
          <Search className="h-4 w-4 mr-2" />
          {loading ? t('statusCheck.checking') : t('statusCheck.check')}
        </Button>
      </div>

      {notFound && (
        <p className="text-sm text-red-500">{t('statusCheck.notFound')}</p>
      )}

      {result && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{t(`requestTypes.${result.requestType}`)}</p>
            <Badge className={cn('text-xs', STATUS_CLASSES[result.status] ?? STATUS_CLASSES.pending)}>
              {t(`statuses.${result.status}`)}
            </Badge>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>
              {t('statusCheck.submitted')}:{' '}
              {new Date(result.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
