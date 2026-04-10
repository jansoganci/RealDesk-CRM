import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CommissionSheet } from './CommissionSheet';
import { COLORS } from '@/config/colors';
import { dealsService, type DealWithRelations } from '@/lib/serviceProxy';
import type { DealStage } from '@/types';

const TERMINAL: DealStage[] = ['closed_won', 'fell_through'];

/** Stages where “record closing” (closed won) is offered */
const CLOSING_ELIGIBLE_STAGES = new Set<DealStage>([
  'under_contract',
  'pending',
  'closing_scheduled',
]);

interface DealOutcomeActionsProps {
  deal: DealWithRelations;
  onSuccess: () => void | Promise<void>;
  readOnly?: boolean;
}

export function DealOutcomeActions({
  deal,
  onSuccess,
  readOnly = false,
}: DealOutcomeActionsProps) {
  const { t } = useTranslation('deals');
  const { toast } = useToast();
  const [closedOpen, setClosedOpen] = useState(false);
  const [fellOpen, setFellOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const stage = deal.deal_stage as DealStage;
  const isTerminal = TERMINAL.includes(stage);
  const canRecordClosing = CLOSING_ELIGIBLE_STAGES.has(stage);
  const canFellThrough = !isTerminal;

  if (readOnly || isTerminal || (!canRecordClosing && !canFellThrough)) {
    return null;
  }

  const handleFellThrough = async () => {
    const r = reason.trim();
    if (r.length < 3) {
      toast({ title: t('outcome.reasonTooShort'), variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      await dealsService.markFellThrough(deal.id, r);
      toast({ title: t('outcome.toastFellThrough') });
      setFellOpen(false);
      setReason('');
      await onSuccess();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('outcome.toastError'),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {canRecordClosing && (
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => setClosedOpen(true)}
          >
            <CheckCircle2 className="h-4 w-4" />
            {t('outcome.recordClosing')}
          </Button>
        )}
        {canFellThrough && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={`gap-1.5 border-red-200 ${COLORS.danger.text} hover:bg-red-50`}
            onClick={() => setFellOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            {t('outcome.fellThrough')}
          </Button>
        )}
      </div>

      <CommissionSheet
        deal={deal}
        open={closedOpen}
        onOpenChange={setClosedOpen}
        onSuccess={onSuccess}
      />

      <AlertDialog open={fellOpen} onOpenChange={setFellOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('outcome.fellThroughTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('outcome.fellThroughDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="ft-reason">{t('outcome.reason')}</Label>
            <Textarea
              id="ft-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('outcome.reasonPlaceholder')}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('creation.cancel')}</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void handleFellThrough()}
            >
              {t('outcome.confirmFellThrough')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
