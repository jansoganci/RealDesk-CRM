import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CheckCircle, Clock, Trash2, XCircle, ShieldOff } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ccpaService, type DataSubjectRequest } from '@/lib/serviceProxy';
import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  in_review: 'bg-warning/15 text-warning',
  verification_sent: 'bg-info/15 text-info',
  processing: 'bg-warning/15 text-warning',
  completed: 'bg-success/15 text-success',
  denied: 'bg-destructive/15 text-destructive',
};

interface RequestDetailSheetProps {
  request: DataSubjectRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function RequestDetailSheet({ request, open, onOpenChange, onRefresh }: RequestDetailSheetProps) {
  const { t } = useTranslation('compliance');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!request) return null;

  const handle = async (action: () => Promise<unknown>) => {
    setProcessing(true);
    try {
      await action();
      toast.success(t('admin.actionSuccess'));
      onRefresh();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.actionError'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>{t('admin.requestDetail')}</SheetTitle>
          <SheetDescription>
            <Badge className={cn('text-xs', STATUS_CLASSES[request.status])}>
              {t(`statuses.${request.status}`)}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          {/* Requester info */}
          <section className="space-y-1.5">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('admin.requesterInfo')}</h4>
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3">
              <p><span className="font-medium">{t('form.name')}:</span> {request.requester_name}</p>
              <p><span className="font-medium">{t('form.email')}:</span> {request.requester_email}</p>
              {request.requester_phone && (
                <p><span className="font-medium">{t('form.phone')}:</span> {request.requester_phone}</p>
              )}
              <p><span className="font-medium">{t('form.relationship')}:</span> {t(`relationships.${request.relationship_to_org}`)}</p>
              {request.relationship_description && (
                <p><span className="font-medium">{t('form.relationshipDescription')}:</span> {request.relationship_description}</p>
              )}
            </div>
          </section>

          <Separator />

          {/* Request type + details */}
          <section className="space-y-1.5">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('admin.requestInfo')}</h4>
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3">
              <p><span className="font-medium">{t('form.requestType')}:</span> {t(`requestTypes.${request.request_type}`)}</p>
              {request.details && (
                <p><span className="font-medium">{t('form.details')}:</span> {request.details}</p>
              )}
              <p><span className="font-medium">{t('admin.submitted')}:</span> {new Date(request.created_at).toLocaleString()}</p>
              {request.completed_at && (
                <p><span className="font-medium">{t('admin.completed')}:</span> {new Date(request.completed_at).toLocaleString()}</p>
              )}
              {request.deletion_summary && (
                <p><span className="font-medium">{t('admin.deletionSummary')}:</span> {request.deletion_summary}</p>
              )}
            </div>
          </section>

          {request.status_notes && (
            <>
              <Separator />
              <section className="space-y-1.5">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('admin.notes')}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3">{request.status_notes}</p>
              </section>
            </>
          )}

          {/* Actions — only show if not completed/denied */}
          {request.status !== 'completed' && request.status !== 'denied' && (
            <>
              <Separator />
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('admin.actions')}</h4>

                <div>
                  <Label className="text-xs text-slate-500 dark:text-slate-400">{t('admin.notesOptional')}</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('admin.notesPlaceholder')}
                    rows={3}
                    className="mt-1 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {request.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={processing}
                      onClick={() => handle(() => ccpaService.updateRequestStatus(request.id, 'in_review', notes || null))}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {t('admin.markInReview')}
                    </Button>
                  )}

                  {(request.status === 'pending' || request.status === 'in_review') && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={processing}
                      onClick={() => handle(() => ccpaService.updateRequestStatus(request.id, 'verification_sent', notes || null))}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('admin.sendVerification')}
                    </Button>
                  )}

                  {request.request_type === 'know' && (
                    <Button
                      size="sm"
                      disabled={processing}
                      className="bg-success hover:bg-success/90 text-success-foreground"
                      onClick={() => handle(() => ccpaService.completeKnowRequest(request.id, notes || null))}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('admin.completeKnow')}
                    </Button>
                  )}

                  {request.request_type === 'delete' && (
                    <Button
                      size="sm"
                      disabled={processing}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handle(() => ccpaService.completeDeleteRequest(request.id))}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {request.status === 'processing'
                        ? t('admin.resumeDelete')
                        : t('admin.executeDelete')}
                    </Button>
                  )}

                  {(request.request_type === 'opt_out_sale' || request.request_type === 'opt_out_share') && (
                    <Button
                      size="sm"
                      disabled={processing}
                      className="bg-warning hover:bg-warning/90 text-warning-foreground"
                      onClick={() => handle(() => ccpaService.completeOptOutRequest(request.id, notes || null))}
                    >
                      <ShieldOff className="h-4 w-4 mr-2" />
                      {t('admin.completeOptOut')}
                    </Button>
                  )}

                  {request.request_type === 'correct' && (
                    <Button
                      size="sm"
                      disabled={processing}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => handle(() => ccpaService.completeKnowRequest(request.id, notes || null))}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('admin.completeCorrect')}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={processing}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handle(() => ccpaService.updateRequestStatus(request.id, 'denied', notes || null))}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('admin.deny')}
                  </Button>
                </div>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
