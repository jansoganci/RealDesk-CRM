import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ccpaService, type DataSubjectRequest } from '@/lib/serviceProxy';
import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  in_review: 'bg-yellow-100 text-yellow-800',
  verification_sent: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-800',
  denied: 'bg-red-100 text-red-700',
};

export function RequestStatusCheck() {
  const { t } = useTranslation('compliance');
  const [requestId, setRequestId] = useState('');
  const [result, setResult] = useState<DataSubjectRequest | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!requestId.trim()) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    try {
      const data = await ccpaService.getRequestById(requestId.trim());
      if (data) {
        setResult(data);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="requestId">{t('statusCheck.requestIdLabel')}</Label>
        <div className="flex gap-2">
          <Input
            id="requestId"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder={t('statusCheck.requestIdPlaceholder')}
            className="flex-1"
          />
          <Button onClick={handleCheck} disabled={loading || !requestId.trim()}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? t('statusCheck.checking') : t('statusCheck.check')}
          </Button>
        </div>
      </div>

      {notFound && (
        <p className="text-sm text-red-500">{t('statusCheck.notFound')}</p>
      )}

      {result && (
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t(`requestTypes.${result.request_type}`)}</p>
            <Badge className={cn('text-xs', STATUS_CLASSES[result.status])}>
              {t(`statuses.${result.status}`)}
            </Badge>
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            <p>{t('statusCheck.submitted')}: {new Date(result.created_at).toLocaleDateString()}</p>
            {result.completed_at && (
              <p>{t('statusCheck.completed')}: {new Date(result.completed_at).toLocaleDateString()}</p>
            )}
            {result.status_notes && (
              <p>{t('statusCheck.notes')}: {result.status_notes}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
