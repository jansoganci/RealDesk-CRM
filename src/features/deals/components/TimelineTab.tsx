import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { COLORS } from '@/config/colors';
import { cn } from '@/lib/utils';
import { useTimelineTab } from '@/features/deals/hooks/useTimelineTab';
import { MilestoneCard } from '@/features/deals/components/MilestoneCard';
import { PhaseHeader } from '@/features/deals/components/PhaseHeader';
import { ClosingCountdown } from '@/features/deals/components/ClosingCountdown';
import type { DealMilestone } from '@/types';
import type { DealWithRelations } from '@/lib/serviceProxy';

type TimelineTabProps = {
  deal: DealWithRelations;
  readOnly?: boolean;
};

type TimelineFilter = 'all' | 'overdue' | 'my_action' | 'pending' | 'complete';

const PHASE_DEFS = [
  {
    phase: 1 as const,
    nameKey: 'timeline.phase.mutualAcceptance',
    milestoneTypes: [
      'mutual_acceptance',
      'earnest_money_deposit',
      'open_escrow',
      'title_search_initiated',
      'send_executed_contract',
      'loan_application_submitted',
    ],
  },
  {
    phase: 2 as const,
    nameKey: 'timeline.phase.dueDiligence',
    milestoneTypes: [
      'home_inspection',
      'inspection_contingency_removal',
      'appraisal_ordered',
      'appraisal_completed',
      'hoa_doc_review',
    ],
  },
  {
    phase: 3 as const,
    nameKey: 'timeline.phase.financingTitle',
    milestoneTypes: [
      'financing_contingency_deadline',
      'title_report_clear',
      'homeowners_insurance',
      'repairs_completed',
      'clear_to_close',
    ],
  },
  {
    phase: 4 as const,
    nameKey: 'timeline.phase.closing',
    milestoneTypes: ['closing_disclosure_sent', 'closing_disclosure_review', 'final_walkthrough', 'closing_day'],
  },
] as const;

function isOverdue(m: DealMilestone): boolean {
  if (m.status === 'overdue') return true;
  if (!['pending', 'in_progress'].includes(m.status)) return false;
  const today = new Date().toISOString().slice(0, 10);
  return m.due_date < today;
}

function phaseHealth(rows: DealMilestone[]): 'clear' | 'action_needed' | 'overdue' {
  if (rows.some((m) => isOverdue(m))) return 'overdue';
  const today = new Date().toISOString().slice(0, 10);
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);
  const sevenDaysIso = sevenDays.toISOString().slice(0, 10);
  const approaching = rows.some(
    (m) => ['pending', 'in_progress'].includes(m.status) && m.due_date >= today && m.due_date <= sevenDaysIso
  );
  return approaching ? 'action_needed' : 'clear';
}

export function TimelineTab({ deal, readOnly = false }: TimelineTabProps) {
  const { t } = useTranslation('deals');
  const { toast } = useToast();
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customMilestoneForm, setCustomMilestoneForm] = useState({
    title: '',
    dueDate: '',
    responsibleParty: 'buyer_agent' as NonNullable<DealMilestone['responsible_party']>,
    notes: '',
  });
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  const {
    milestones,
    loading,
    error,
    setStatus,
    addNote,
    uploadDocument,
    getDocumentUrl,
    createCustomMilestone,
  } = useTimelineTab(deal.id);

  const filteredMilestones = useMemo(() => {
    if (filter === 'all') return milestones;
    if (filter === 'overdue') return milestones.filter((m) => isOverdue(m));
    if (filter === 'my_action') return milestones.filter((m) => m.responsible_party === 'buyer_agent');
    if (filter === 'pending') return milestones.filter((m) => m.status === 'pending' || m.status === 'in_progress');
    return milestones.filter((m) => m.status === 'complete');
  }, [filter, milestones]);

  const grouped = useMemo(() => {
    return PHASE_DEFS.map((phase) => {
      const rows = filteredMilestones.filter((m) => phase.milestoneTypes.includes(m.milestone_type as never));
      const completedCount = rows.filter((m) => m.status === 'complete').length;
      return {
        ...phase,
        rows,
        completedCount,
        health: phaseHealth(rows),
      };
    });
  }, [filteredMilestones]);

  const customMilestones = useMemo(
    () => filteredMilestones.filter((m) => m.milestone_type === 'custom'),
    [filteredMilestones]
  );

  const handleOpenDocument = async (milestoneId: string) => {
    const url = await getDocumentUrl(milestoneId);
    if (!url) {
      toast({
        title: t('milestones.toastError'),
        description: t('documents.toastNoDocumentDescription'),
        variant: 'destructive',
      });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCreateCustomMilestone = async () => {
    const title = customMilestoneForm.title.trim();
    if (!title || !customMilestoneForm.dueDate) return;

    try {
      setIsSubmitting(true);
      await createCustomMilestone({
        title,
        due_date: customMilestoneForm.dueDate,
        responsible_party: customMilestoneForm.responsibleParty,
        notes: customMilestoneForm.notes.trim() || null,
      });
      setCustomMilestoneForm({
        title: '',
        dueDate: '',
        responsibleParty: 'buyer_agent',
        notes: '',
      });
      setIsDialogOpen(false);
      toast({ title: t('timeline.toastMilestoneAdded') });
    } catch (error) {
      toast({
        title: t('milestones.toastError'),
        description: error instanceof Error ? error.message : t('timeline.toastMilestoneAddError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 relative">
      {deal.projected_close_date && (
        <div className="sticky top-0 z-10">
          <ClosingCountdown closingDate={deal.projected_close_date} dealName={deal.deal_name} />
        </div>
      )}

      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
              {t('timeline.filter.all')}
            </Button>
            <Button
              size="sm"
              variant={filter === 'overdue' ? 'default' : 'outline'}
              onClick={() => setFilter('overdue')}
            >
              {t('timeline.filter.overdue')}
            </Button>
            <Button
              size="sm"
              variant={filter === 'my_action' ? 'default' : 'outline'}
              onClick={() => setFilter('my_action')}
            >
              {t('timeline.filter.myAction')}
            </Button>
            <Button
              size="sm"
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              {t('timeline.filter.pending')}
            </Button>
            <Button
              size="sm"
              variant={filter === 'complete' ? 'default' : 'outline'}
              onClick={() => setFilter('complete')}
            >
              {t('timeline.filter.complete')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <p className={cn('text-sm', COLORS.gray.text600)}>{t('timeline.loading')}</p>}
      {error && <p className={cn('text-sm', COLORS.danger.text)}>{error}</p>}

      {!loading &&
        grouped.map((group) => (
          <div key={group.phase} className="space-y-3">
            <PhaseHeader
              phaseNumber={group.phase}
              phaseName={t(group.nameKey)}
              completedCount={group.completedCount}
              totalCount={group.rows.length}
              health={group.health}
              collapsed={collapsed[group.phase]}
              onToggle={() =>
                setCollapsed((prev) => ({ ...prev, [group.phase]: !prev[group.phase] }))
              }
            />
            {!collapsed[group.phase] && (
              <div className="space-y-3">
                {group.rows.length === 0 ? (
                  <Card>
                    <CardContent className="py-4">
                      <p className={cn('text-sm', COLORS.gray.text600)}>{t('timeline.emptyPhase')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  group.rows.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone as unknown as DealMilestone}
                      isBusy={readOnly}
                      onStatusChange={async (id, status) => {
                        await setStatus(id, status);
                      }}
                      onAddNote={async (id, note) => {
                        await addNote(id, note);
                      }}
                      onUploadDocument={async (id, file) => {
                        await uploadDocument(id, file);
                      }}
                      onOpenDocument={(id) => handleOpenDocument(id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}

      {!loading && customMilestones.length > 0 && (
        <div className="space-y-3">
          <Card>
            <CardContent className="py-3">
              <p className={cn('text-sm font-semibold', COLORS.gray.text900)}>{t('timeline.customSectionTitle')}</p>
            </CardContent>
          </Card>
          {customMilestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone as unknown as DealMilestone}
              isBusy={readOnly}
              onStatusChange={async (id, status) => {
                await setStatus(id, status);
              }}
              onAddNote={async (id, note) => {
                await addNote(id, note);
              }}
              onUploadDocument={async (id, file) => {
                await uploadDocument(id, file);
              }}
              onOpenDocument={(id) => handleOpenDocument(id)}
            />
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="pt-1">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                {t('timeline.addMilestone')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('timeline.addMilestoneTitle')}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="custom-milestone-title">{t('timeline.form.title')}</Label>
                  <Input
                    id="custom-milestone-title"
                    value={customMilestoneForm.title}
                    onChange={(event) =>
                      setCustomMilestoneForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder={t('timeline.form.titlePlaceholder')}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="custom-milestone-due-date">{t('timeline.form.dueDate')}</Label>
                  <Input
                    id="custom-milestone-due-date"
                    type="date"
                    value={customMilestoneForm.dueDate}
                    onChange={(event) =>
                      setCustomMilestoneForm((prev) => ({ ...prev, dueDate: event.target.value }))
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="custom-milestone-responsible-party">{t('timeline.form.responsibleParty')}</Label>
                  <select
                    id="custom-milestone-responsible-party"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={customMilestoneForm.responsibleParty}
                    onChange={(event) =>
                      setCustomMilestoneForm((prev) => ({
                        ...prev,
                        responsibleParty: event.target.value as NonNullable<DealMilestone['responsible_party']>,
                      }))
                    }
                    disabled={isSubmitting}
                  >
                    <option value="buyer">{t('timeline.responsibleParty.buyer')}</option>
                    <option value="seller">{t('timeline.responsibleParty.seller')}</option>
                    <option value="buyer_agent">{t('timeline.responsibleParty.buyerAgent')}</option>
                    <option value="seller_agent">{t('timeline.responsibleParty.sellerAgent')}</option>
                    <option value="lender">{t('timeline.responsibleParty.lender')}</option>
                    <option value="title_co">{t('timeline.responsibleParty.titleCo')}</option>
                    <option value="inspector">{t('timeline.responsibleParty.inspector')}</option>
                    <option value="other">{t('timeline.responsibleParty.other')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="custom-milestone-notes">{t('timeline.form.notes')}</Label>
                  <Textarea
                    id="custom-milestone-notes"
                    value={customMilestoneForm.notes}
                    onChange={(event) =>
                      setCustomMilestoneForm((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    placeholder={t('timeline.form.notesPlaceholder')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => void handleCreateCustomMilestone()}
                  disabled={isSubmitting || !customMilestoneForm.title.trim() || !customMilestoneForm.dueDate}
                >
                  {t('timeline.form.submit')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
