import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateField } from '@/components/ui/date-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAmendmentsTab } from '@/features/deals/hooks/useAmendmentsTab';
import type { DealWithRelations } from '@/lib/serviceProxy';

type AmendmentsTabProps = {
  deal: DealWithRelations;
  readOnly?: boolean;
};

const AMENDMENT_TYPES = [
  'price_change',
  'deadline_extension',
  'repair_agreement',
  'contingency_waiver',
  'other',
] as const;

function safeDate(value: string): string {
  try {
    return format(parseISO(value), 'MMM d, yyyy');
  } catch {
    return value;
  }
}

export function AmendmentsTab({ deal, readOnly = false }: AmendmentsTabProps) {
  const { t } = useTranslation('deals');
  const { toast } = useToast();
  const { amendments, milestones, loading, error, createAmendment } = useAmendmentsTab(deal.id);

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amendmentType: 'other',
    description: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    oldValue: '',
    newValue: '',
    milestoneId: '',
    milestoneDueDate: '',
  });

  const submit = async () => {
    if (!form.description.trim()) return;
    setSubmitting(true);
    try {
      let milestoneId: string | null = null;
      let milestoneDueDate: string | null = null;

      if (form.amendmentType === 'deadline_extension' && form.milestoneId) {
        const shouldSync = window.confirm(t('detail.amendments.syncConfirm'));
        if (shouldSync) {
          milestoneId = form.milestoneId;
          milestoneDueDate = form.milestoneDueDate || null;
        }
      }

      await createAmendment({
        amendmentType: form.amendmentType,
        description: form.description.trim(),
        effectiveDate: form.effectiveDate,
        oldValue: form.oldValue.trim() || null,
        newValue: form.newValue.trim() || null,
        milestoneId,
        milestoneDueDate,
      });

      setForm({
        amendmentType: 'other',
        description: '',
        effectiveDate: new Date().toISOString().slice(0, 10),
        oldValue: '',
        newValue: '',
        milestoneId: '',
        milestoneDueDate: '',
      });

      toast({
        title: t('detail.amendments.saved'),
      });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('detail.amendments.saveError'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t('detail.amendments.add')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('detail.amendments.type')}</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.amendmentType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amendmentType: e.target.value }))
                  }
                  disabled={submitting}
                >
                  {AMENDMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(`detail.amendments.types.${type}`, { defaultValue: type })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t('detail.amendments.effectiveDate')}</Label>
                <DateField
                  value={form.effectiveDate || null}
                  onChange={(next) =>
                    setForm((prev) => ({ ...prev, effectiveDate: next ?? '' }))
                  }
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{t('fields.notes')}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('detail.amendments.oldValue')}</Label>
                <Input
                  value={form.oldValue}
                  onChange={(e) => setForm((prev) => ({ ...prev, oldValue: e.target.value }))}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('detail.amendments.newValue')}</Label>
                <Input
                  value={form.newValue}
                  onChange={(e) => setForm((prev) => ({ ...prev, newValue: e.target.value }))}
                  disabled={submitting}
                />
              </div>
            </div>

            {form.amendmentType === 'deadline_extension' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t('detail.amendments.milestone')}</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.milestoneId}
                    onChange={(e) => setForm((prev) => ({ ...prev, milestoneId: e.target.value }))}
                    disabled={submitting}
                  >
                    <option value="">{t('detail.amendments.selectMilestone')}</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{t('detail.amendments.newDueDate')}</Label>
                  <DateField
                    value={form.milestoneDueDate || null}
                    onChange={(next) =>
                      setForm((prev) => ({ ...prev, milestoneDueDate: next ?? '' }))
                    }
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => void submit()} disabled={submitting || !form.description.trim()}>
                {t('detail.amendments.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t('detail.amendments.log')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">{t('detail.loading')}</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : amendments.length === 0 ? (
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {t('detail.amendments.empty')}
            </p>
          ) : (
            amendments.map((a) => (
              <div key={a.id} className="rounded-lg border border-border dark:border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline">{a.amendment_type ?? 'other'}</Badge>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground/70">{safeDate(a.effective_date)}</span>
                </div>
                <p className="text-sm text-foreground dark:text-foreground mt-2">{a.description}</p>
                {(a.old_value || a.new_value) && (
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                    {a.old_value ?? '—'} {'->'} {a.new_value ?? '—'}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
