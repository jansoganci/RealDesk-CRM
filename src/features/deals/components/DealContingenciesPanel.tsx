import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DateField } from '@/components/ui/date-field';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COLORS } from '@/config/colors';
import {
  offerContingenciesService,
  type ContingencyResolution,
  type DealWithRelations,
} from '@/lib/serviceProxy';
import type { OfferContingency } from '@/types';

const RESOLUTIONS: ContingencyResolution[] = [
  'satisfied',
  'waived',
  'negotiated_out',
  'expired',
  'terminated_deal',
];

function formatDeadline(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

interface DealContingenciesPanelProps {
  deal: DealWithRelations;
  onRefresh: () => void | Promise<void>;
  readOnly?: boolean;
}

export function DealContingenciesPanel({
  deal,
  onRefresh,
  readOnly = false,
}: DealContingenciesPanelProps) {
  const { t } = useTranslation('deals');
  const { toast } = useToast();
  const [rows, setRows] = useState<OfferContingency[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [selected, setSelected] = useState<OfferContingency | null>(null);
  const [resolution, setResolution] = useState<ContingencyResolution>('satisfied');
  const [resolvedDate, setResolvedDate] = useState(() =>
    format(new Date(), 'yyyy-MM-dd')
  );
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await offerContingenciesService.getActiveByDeal(deal.id);
      setRows(data);
    } catch {
      setRows([]);
      toast({ title: t('contingencies.loadError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [deal.id, t, toast]);

  useEffect(() => {
    void load();
  }, [load, deal.updated_at]);

  const openResolve = (c: OfferContingency) => {
    setSelected(c);
    setResolution('satisfied');
    setResolvedDate(format(new Date(), 'yyyy-MM-dd'));
    setResolveOpen(true);
  };

  const confirmResolve = async () => {
    if (!selected || readOnly) return;
    setSubmitting(true);
    try {
      await offerContingenciesService.resolveContingency(
        selected.id,
        resolution,
        resolvedDate
      );
      toast({ title: t('contingencies.toastResolved') });
      setResolveOpen(false);
      setSelected(null);
      await load();
      await onRefresh();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('contingencies.toastError'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const typeLabel = (type: string) =>
    t(`contingencies.types.${type}`, { defaultValue: type });

  const statusLabel = (s: string) =>
    t(`contingencies.status.${s}`, { defaultValue: s });

  return (
    <>
      <Card className="border-border/80 dark:border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t('contingencies.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className={`text-sm ${COLORS.muted.text} dark:text-muted-foreground/70`}>{t('contingencies.loading')}</p>
          ) : rows.length === 0 ? (
            <p className={`text-sm ${COLORS.muted.text} dark:text-muted-foreground/70`}>
              {t('contingencies.empty')}
            </p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('contingencies.type')}</TableHead>
                      <TableHead>{t('contingencies.deadline')}</TableHead>
                      <TableHead>{t('list.tableStage')}</TableHead>
                      <TableHead className="w-[70px] text-right">
                        {t('contingencies.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {c.label_override || typeLabel(c.contingency_type)}
                        </TableCell>
                        <TableCell>{formatDeadline(c.deadline_date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{statusLabel(c.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {!readOnly && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label={t('contingencies.resolve')}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openResolve(c)}
                                >
                                  {t('contingencies.resolve')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      await offerContingenciesService.waiveContingency(
                                        c.id
                                      );
                                      toast({ title: t('contingencies.toastWaived') });
                                      await load();
                                      await onRefresh();
                                    } catch (e) {
                                      toast({
                                        title:
                                          e instanceof Error
                                            ? e.message
                                            : t('contingencies.toastError'),
                                        variant: 'destructive',
                                      });
                                    }
                                  }}
                                >
                                  {t('contingencies.waiveQuick')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ul className="md:hidden space-y-3">
                {rows.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-border dark:border-border p-3 text-sm space-y-2"
                  >
                    <div className="font-medium">
                      {c.label_override || typeLabel(c.contingency_type)}
                    </div>
                    <div className={`${COLORS.muted.text} dark:text-muted-foreground/70`}>
                      {formatDeadline(c.deadline_date)} · {statusLabel(c.status)}
                    </div>
                    {!readOnly && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => openResolve(c)}
                        >
                          {t('contingencies.resolve')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await offerContingenciesService.waiveContingency(c.id);
                              toast({ title: t('contingencies.toastWaived') });
                              await load();
                              await onRefresh();
                            } catch (e) {
                              toast({
                                title:
                                  e instanceof Error
                                    ? e.message
                                    : t('contingencies.toastError'),
                                variant: 'destructive',
                              });
                            }
                          }}
                        >
                          {t('contingencies.waiveQuick')}
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contingencies.resolveTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('contingencies.resolveHint')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('contingencies.resolutionLabel')}</Label>
              <Select
                value={resolution}
                onValueChange={(v) => setResolution(v as ContingencyResolution)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`contingencies.resolution.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-date">{t('contingencies.resolvedDate')}</Label>
              <DateField
                id="res-date"
                value={resolvedDate}
                onChange={(next) => setResolvedDate(next ?? '')}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              {t('creation.cancel')}
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={() => void confirmResolve()}
              disabled={submitting || readOnly}
            >
              {t('contingencies.confirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
