import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { MoreHorizontal, Plus } from 'lucide-react';
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
  DropdownMenuSeparator,
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
import { COLORS } from '@/config/colors';
import { formatCurrency } from '@/lib/currency';
import { offerRoundsService, type DealWithRelations } from '@/lib/serviceProxy';
import type { OfferRound } from '@/types';
import { CounterOfferModal } from '@/features/deals/components/CounterOfferModal';
import { OfferHistoryTimeline } from '@/features/deals/components/OfferHistoryTimeline';
import { OfferRoundSheet } from '@/features/deals/components/OfferRoundSheet';

function formatOptionalDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

/** Stages where new offer rounds are still allowed */
const NEGOTIATION_OPEN_STAGES = new Set([
  'offer_prep',
  'submitted',
  'negotiating',
  'verbal_accepted',
]);

function canAddRounds(deal: DealWithRelations): boolean {
  return NEGOTIATION_OPEN_STAGES.has(deal.deal_stage);
}


interface DealOffersPanelProps {
  deal: DealWithRelations;
  onRefresh: () => void | Promise<void>;
  readOnly?: boolean;
}

export function DealOffersPanel({
  deal,
  onRefresh,
  readOnly = false,
}: DealOffersPanelProps) {
  const { t } = useTranslation('deals');
  const { toast } = useToast();

  const roundStatusLabel = (status: string) =>
    t(`offers.roundStatus.${status}`, { defaultValue: status });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'first' | 'counter'>('first');
  const [priorRound, setPriorRound] = useState<OfferRound | null>(null);

  const [maOpen, setMaOpen] = useState(false);
  const [maRoundId, setMaRoundId] = useState<string | null>(null);
  const [maDate, setMaDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [maLoading, setMaLoading] = useState(false);

  const [actionId, setActionId] = useState<string | null>(null);

  const rounds = useMemo(() => {
    const rows = deal.offer_rounds ?? [];
    return [...rows].sort((a, b) => a.round_number - b.round_number);
  }, [deal.offer_rounds]);

  const lastRound = rounds.length ? rounds[rounds.length - 1] : null;
  const allowNegotiation = canAddRounds(deal);

  const openFirstOffer = () => {
    setSheetMode('first');
    setPriorRound(null);
    setSheetOpen(true);
  };

  const openCounterOffer = () => {
    if (!lastRound) return;
    setSheetMode('counter');
    setPriorRound(lastRound);
    setSheetOpen(true);
  };

  const runRefresh = async () => {
    await onRefresh();
  };

  const handleSubmit = async (roundId: string) => {
    if (readOnly) return;
    setActionId(roundId);
    try {
      await offerRoundsService.submitOffer(roundId);
      toast({ title: t('offers.toastSubmit') });
      await runRefresh();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('offers.toastError'),
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  const handleVerbal = async (roundId: string) => {
    if (readOnly) return;
    setActionId(roundId);
    try {
      await offerRoundsService.markVerbalAccepted(roundId);
      toast({ title: t('offers.toastVerbal') });
      await runRefresh();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('offers.toastError'),
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (roundId: string) => {
    if (readOnly) return;
    setActionId(roundId);
    try {
      await offerRoundsService.markRejected(roundId);
      toast({ title: t('offers.toastReject') });
      await runRefresh();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('offers.toastError'),
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  const handleExpire = async (roundId: string) => {
    if (readOnly) return;
    setActionId(roundId);
    try {
      await offerRoundsService.markExpired(roundId);
      toast({ title: t('offers.toastExpire') });
      await runRefresh();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('offers.toastError'),
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  const openMutual = (roundId: string) => {
    setMaRoundId(roundId);
    setMaDate(format(new Date(), 'yyyy-MM-dd'));
    setMaOpen(true);
  };

  const confirmMutual = async () => {
    if (!maRoundId || readOnly) return;
    setMaLoading(true);
    try {
      const iso = `${maDate}T12:00:00.000Z`;
      const { milestonesCreated } =
        await offerRoundsService.markMutualAcceptance(maRoundId, iso);
      toast({
        title: t('offers.toastMutual', { count: milestonesCreated }),
      });
      setMaOpen(false);
      setMaRoundId(null);
      await runRefresh();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('offers.toastError'),
        variant: 'destructive',
      });
    } finally {
      setMaLoading(false);
    }
  };

  const renderActions = (r: OfferRound) => {
    const busy = actionId === r.id;
    const draft = r.status === 'draft';
    const submitted = r.status === 'submitted';
    const verbal = r.status === 'verbal_accepted';

    const showSubmit = draft;
    const showVerbal = submitted;
    const showMutual = submitted || verbal;
    const showReject = draft || submitted || verbal;
    const showExpire = draft || submitted;

    if (readOnly || (!showSubmit && !showVerbal && !showMutual && !showReject && !showExpire)) {
      return null;
    }

    // Happy-path CTA outside the menu; destructive / secondary stay behind ⋯
    const primary: { label: string; onClick: () => void } | null = showSubmit
      ? { label: t('offers.submitRound'), onClick: () => void handleSubmit(r.id) }
      : showMutual
        ? { label: t('offers.mutualAcceptance'), onClick: () => openMutual(r.id) }
        : null;

    const menuHasItems = showVerbal || showReject || showExpire;

    return (
      <div className="flex items-center justify-end gap-1.5">
        {primary && (
          <Button
            type="button"
            size="sm"
            variant="default"
            className="h-8 shrink-0"
            disabled={busy}
            onClick={primary.onClick}
          >
            {primary.label}
          </Button>
        )}
        {menuHasItems && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={busy}
                aria-label={t('offers.actions')}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {showVerbal && (
                <DropdownMenuItem
                  onClick={() => void handleVerbal(r.id)}
                  disabled={busy}
                >
                  {t('offers.verbalAccepted')}
                </DropdownMenuItem>
              )}
              {showVerbal && (showReject || showExpire) ? <DropdownMenuSeparator /> : null}
              {showReject && (
                <DropdownMenuItem
                  onClick={() => void handleReject(r.id)}
                  disabled={busy}
                  className="text-destructive"
                >
                  {t('offers.reject')}
                </DropdownMenuItem>
              )}
              {showExpire && (
                <DropdownMenuItem
                  onClick={() => void handleExpire(r.id)}
                  disabled={busy}
                >
                  {t('offers.expire')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <>
      <Card className="border-border/80 dark:border-border shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <CardTitle className="text-lg">{t('detail.section.offerRounds')}</CardTitle>
          {allowNegotiation && !readOnly && (
            <div className="flex flex-wrap gap-2">
              {rounds.length === 0 && (
                <Button type="button" size="sm" onClick={openFirstOffer}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('offers.firstOffer')}
                </Button>
              )}
              {rounds.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={openCounterOffer}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('offers.counterOffer')}
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {rounds.length > 0 && <OfferHistoryTimeline rounds={rounds} />}
          {rounds.length === 0 ? (
            <p className={`text-sm ${COLORS.muted.text} dark:text-muted-foreground/70`}>
              {t('detail.offersEmpty')}
            </p>
          ) : (
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('detail.round')}</TableHead>
                    <TableHead>{t('detail.offerPrice')}</TableHead>
                    <TableHead>{t('list.tableStage')}</TableHead>
                    <TableHead>{t('detail.submitted')}</TableHead>
                    <TableHead className="w-[220px] text-right">
                      {t('offers.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rounds.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.round_number}</TableCell>
                      <TableCell>{formatCurrency(r.offer_price)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {roundStatusLabel(r.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatOptionalDate(r.submitted_at)}</TableCell>
                      <TableCell className="text-right">
                        {renderActions(r)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {rounds.length > 0 && (
            <ul className="md:hidden space-y-3">
              {rounds.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-border dark:border-border p-3 text-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {t('detail.round')} {r.round_number} ·{' '}
                        {formatCurrency(r.offer_price)}
                      </div>
                      <div className={`${COLORS.muted.text} dark:text-muted-foreground/70`}>
                        {roundStatusLabel(r.status)}
                        {r.submitted_at
                          ? ` · ${formatOptionalDate(r.submitted_at)}`
                          : ''}
                      </div>
                    </div>
                    {renderActions(r)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {sheetMode === 'first' ? (
        <OfferRoundSheet
          dealId={deal.id}
          deal={deal}
          mode="first"
          priorRound={null}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSuccess={runRefresh}
          disabled={readOnly}
        />
      ) : (
        priorRound && (
          <CounterOfferModal
            dealId={deal.id}
            deal={deal}
            priorRound={priorRound}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            onSuccess={runRefresh}
            disabled={readOnly}
          />
        )
      )}

      <AlertDialog open={maOpen} onOpenChange={setMaOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('offers.mutualTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('offers.mutualDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="ma-date">{t('offers.mutualDate')}</Label>
            <DateField
              id="ma-date"
              value={maDate}
              onChange={(next) => setMaDate(next ?? '')}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={maLoading}>
              {t('creation.cancel')}
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={() => void confirmMutual()}
              disabled={maLoading || readOnly}
            >
              {t('offers.mutualConfirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
