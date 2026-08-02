import { type ChangeEvent, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { COLORS } from '@/config/colors';
import { cn } from '@/lib/utils';
import type { DealMilestone, MilestoneStatus } from '@/types';

type ContingencySummary = {
  contingencyId: string;
  status: string;
  resolutionType?: string | null;
};

type MilestoneCardProps = {
  milestone: DealMilestone;
  isBusy?: boolean;
  contingency?: ContingencySummary | null;
  onStatusChange: (id: string, status: MilestoneStatus) => Promise<void> | void;
  onAddNote: (id: string, note: string) => Promise<void> | void;
  onUploadDocument: (id: string, file: File) => Promise<void> | void;
  onOpenDocument?: (id: string) => Promise<void> | void;
};

function getStatusClasses(status: string): string {
  if (status === 'complete') {
    return `${COLORS.success.bgLight} ${COLORS.success.textDark} ${COLORS.success.border}`;
  }
  if (status === 'overdue') {
    return `${COLORS.danger.bgLight} ${COLORS.danger.textDark} ${COLORS.danger.border}`;
  }
  if (status === 'in_progress') {
    return `${COLORS.warning.bgLight} ${COLORS.warning.textDark} ${COLORS.warning.border}`;
  }
  if (status === 'waived') {
    return `${COLORS.gray.bg100} ${COLORS.gray.text700} ${COLORS.gray.border200} dark:bg-muted dark:text-muted-foreground dark:border-border`;
  }
  return `${COLORS.info.bgLight} ${COLORS.info.text} border-sky-200`;
}

function getCountdownLabel(
  dueDateIso: string,
  t: (key: string, options?: Record<string, unknown>) => string
): { label: string; className: string } {
  const today = new Date();
  const due = parseISO(dueDateIso);
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diff = Math.floor((dueDateOnly.getTime() - todayDateOnly.getTime()) / (24 * 60 * 60 * 1000));

  if (diff < 0) {
    return {
      label: t('timeline.countdown.overdue', { count: Math.abs(diff) }),
      className: COLORS.danger.text,
    };
  }
  if (diff === 0) {
    return { label: t('timeline.countdown.dueToday'), className: COLORS.warning.textDark };
  }
  if (diff === 1) {
    return { label: t('timeline.countdown.tomorrow'), className: COLORS.warning.textDark };
  }
  return {
    label: t('timeline.countdown.days', { count: diff }),
    className: COLORS.success.text,
  };
}

export function MilestoneCard({
  milestone,
  isBusy = false,
  contingency,
  onStatusChange,
  onAddNote,
  onUploadDocument,
  onOpenDocument,
}: MilestoneCardProps) {
  const { t } = useTranslation('deals');
  const [noteDraft, setNoteDraft] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [uploading, setUploading] = useState(false);

  const dueDateLabel = useMemo(() => {
    try {
      return format(parseISO(milestone.due_date), 'MMM d, yyyy');
    } catch {
      return milestone.due_date;
    }
  }, [milestone.due_date]);

  const countdown = useMemo(() => getCountdownLabel(milestone.due_date, t), [milestone.due_date, t]);

  const lastNote = useMemo(() => {
    if (!milestone.notes?.trim()) return null;
    const lines = milestone.notes.trim().split('\n');
    return lines[lines.length - 1];
  }, [milestone.notes]);

  const hasDocument = Boolean(milestone.document_path);
  const showMissingWarning = milestone.document_required && !hasDocument;
  const isTerminal =
    milestone.status === 'complete' || milestone.status === 'waived';

  const handleSaveNote = async () => {
    const text = noteDraft.trim();
    if (!text) return;
    await onAddNote(milestone.id, text);
    setNoteDraft('');
    setShowNoteInput(false);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUploadDocument(milestone.id, file);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <Card className={cn('border shadow-sm dark:border-border', showMissingWarning ? COLORS.warning.border : COLORS.border.color)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-base">{milestone.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn('border', getStatusClasses(milestone.status))}>
                {t(`milestones.status.${milestone.status}`, { defaultValue: milestone.status })}
              </Badge>
              {milestone.is_cfpb_required && (
                <Badge className="border border-primary/30 bg-primary text-primary dark:border-primary/30 dark:bg-primary dark:text-primary">
                  {t('timeline.badges.federalRequirement')}
                </Badge>
              )}
              {milestone.responsible_party && (
                <Badge variant="outline">
                  {t(`timeline.responsibleParty.${milestone.responsible_party}`, {
                    defaultValue: milestone.responsible_party,
                  })}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={cn('text-sm font-medium', COLORS.gray.text900, 'dark:text-foreground')}>
              {t('timeline.dueDate', { date: dueDateLabel })}
            </p>
            <p className={cn('text-xs', countdown.className)}>{countdown.label}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {isTerminal ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isBusy}
              onClick={() => void onStatusChange(milestone.id, 'pending')}
            >
              {t('milestones.actionReopen')}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => void onStatusChange(milestone.id, 'complete')}
              >
                {t('milestones.actionComplete')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy || milestone.status === 'in_progress'}
                onClick={() => void onStatusChange(milestone.id, 'in_progress')}
              >
                {t('milestones.actionInProgress')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => void onStatusChange(milestone.id, 'waived')}
              >
                {t('milestones.actionWaive')}
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={() => setShowNoteInput((prev) => !prev)}
          >
            {t('timeline.actions.addNote')}
          </Button>
        </div>

        {showNoteInput && (
          <div className="space-y-2">
            <Label htmlFor={`note-${milestone.id}`}>{t('timeline.note.label')}</Label>
            <Textarea
              id={`note-${milestone.id}`}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder={t('timeline.note.placeholder')}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => void handleSaveNote()}
                disabled={isBusy || noteDraft.trim().length === 0}
              >
                {t('timeline.note.save')}
              </Button>
            </div>
          </div>
        )}

        {lastNote && (
          <div className={cn('rounded-md border p-2 text-sm', COLORS.gray.border200, COLORS.gray.bg50, 'dark:border-border dark:bg-muted')}>
            <p className={cn('font-medium', COLORS.gray.text700, 'dark:text-muted-foreground')}>{t('timeline.note.last')}</p>
            <p className={cn('mt-1', COLORS.gray.text600, 'dark:text-muted-foreground')}>{lastNote}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={`doc-${milestone.id}`}>{t('documents.label')}</Label>
          <Input
            id={`doc-${milestone.id}`}
            type="file"
            disabled={isBusy || uploading}
            onChange={(e) => void handleFileChange(e)}
          />
          {hasDocument && (
            <div className="flex items-center justify-between rounded-md border border-success/30 bg-success/15 px-3 py-2 text-sm text-success">
              <span>{t('documents.uploaded')}</span>
              {onOpenDocument && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void onOpenDocument(milestone.id)}
                >
                  {t('documents.open')}
                </Button>
              )}
            </div>
          )}
          {showMissingWarning && (
            <p className={cn('text-sm', COLORS.warning.textDark)}>
              {t('documents.missingRequired')}
            </p>
          )}
        </div>

        {contingency && (
          <div className={cn('rounded-md border p-2 text-sm', COLORS.border.color, COLORS.card.bg, 'dark:border-border dark:bg-muted')}>
            <p className={cn('font-medium', COLORS.gray.text700, 'dark:text-muted-foreground')}>{t('timeline.contingency.title')}</p>
            <p className={cn('mt-1', COLORS.gray.text600, 'dark:text-muted-foreground')}>
              {t('timeline.contingency.status', { status: contingency.status })}
              {contingency.resolutionType
                ? ` · ${t('timeline.contingency.resolution', { resolution: contingency.resolutionType })}`
                : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
