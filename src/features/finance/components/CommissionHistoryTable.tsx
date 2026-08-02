import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { commissionsService, userPreferencesService } from '@/lib/serviceProxy';
import { calculateCommission } from '@/services/commissionCalculator';
import type { BrokerSettings, Commission } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CommissionWaterfall } from '@/features/deals/components/CommissionWaterfall';
import {
  commissionSheetSchema,
  type CommissionSheetFormValues,
} from '@/features/deals/schemas/commissionSheetSchema';

const defaultBrokerSettings: BrokerSettings = {
  broker_model: 'split_with_cap',
  broker_split_pct: 30,
  annual_cap_amount: null,
  cap_anniversary_date: null,
  franchise_fee_enabled: false,
  franchise_fee_pct: null,
  franchise_fee_cap: null,
  default_transaction_fee: 0,
  eo_fee_type: 'per_deal',
  eo_fee_amount: 0,
  default_tc_fee: 0,
  default_rental_commission_type: 'one_month',
  default_rental_commission_rate: null,
  default_rental_flat_fee: null,
};

type HistoryFilters = {
  type: 'all' | 'sale' | 'rental';
  side: 'all' | 'listing' | 'buyer' | 'dual' | 'rental_listing' | 'rental_tenant';
};

type SortColumn = 'closing_date' | 'net_commission' | 'gross_commission' | 'deal_name';
type SortDirection = 'asc' | 'desc';

export const CommissionHistoryTable = () => {
  const { t } = useTranslation(['finance', 'deals', 'common']);
  const [filters, setFilters] = useState<HistoryFilters>({
    type: 'all',
    side: 'all',
  });
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [rows, setRows] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: 'closing_date',
    direction: 'desc',
  });
  const [editRow, setEditRow] = useState<Commission | null>(null);
  const [saving, setSaving] = useState(false);
  const [brokerSettings, setBrokerSettings] = useState<BrokerSettings>(defaultBrokerSettings);

  const form = useForm<CommissionSheetFormValues>({
    resolver: zodResolver(commissionSheetSchema),
    defaultValues: {
      sale_price: null,
      commission_type: 'percentage',
      commission_rate: 2.5,
      flat_fee_amount: null,
      commission_side: 'listing',
      referral_enabled: false,
      referral_pct: null,
      referral_to: null,
      tc_fee: 0,
      other_fees: 0,
      closing_date: format(new Date(), 'yyyy-MM-dd'),
      override_broker_settings: false,
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await commissionsService.getCommissionHistory({
        type: filters.type === 'all' ? undefined : filters.type,
        side: filters.side === 'all' ? undefined : filters.side,
        page: 1,
        pageSize: 500,
      });
      setRows(result.rows);
    } catch {
      toast.error(t('finance:commissionHistory.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [filters.type, filters.side, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const run = async () => {
      try {
        const settings = await userPreferencesService.getBrokerSettings();
        setBrokerSettings(settings);
      } catch {
        // keep defaults
      }
    };
    void run();
  }, []);

  const monthOptions = useMemo(() => {
    const unique = new Map<string, string>();
    rows.forEach((row) => {
      if (!row.closing_date) return;
      const d = new Date(`${row.closing_date}T00:00:00`);
      if (Number.isNaN(d.getTime())) return;
      const key = format(d, 'yyyy-MM');
      if (!unique.has(key)) {
        unique.set(key, format(d, 'MMM yyyy'));
      }
    });
    return Array.from(unique.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (monthFilter === 'all') return rows;
    return rows.filter((row) => row.closing_date?.startsWith(monthFilter));
  }, [rows, monthFilter]);

  const sortedRows = useMemo(() => {
    const { column, direction } = sortConfig;
    const list = [...filteredRows];
    list.sort((a, b) => {
      const sign = direction === 'asc' ? 1 : -1;
      if (column === 'closing_date') {
        const aDate = new Date(a.closing_date ?? a.created_at).getTime();
        const bDate = new Date(b.closing_date ?? b.created_at).getTime();
        return (aDate - bDate) * sign;
      }
      if (column === 'net_commission') {
        const aNet = a.net_commission ?? a.amount ?? 0;
        const bNet = b.net_commission ?? b.amount ?? 0;
        return (aNet - bNet) * sign;
      }
      if (column === 'gross_commission') {
        const aGci = a.gross_commission ?? 0;
        const bGci = b.gross_commission ?? 0;
        return (aGci - bGci) * sign;
      }
      const aDeal = (a.property_address ?? '').toLowerCase();
      const bDeal = (b.property_address ?? '').toLowerCase();
      return aDeal.localeCompare(bDeal) * sign;
    });
    return list;
  }, [filteredRows, sortConfig]);

  const setSort = (column: SortColumn) => {
    setSortConfig((prev) =>
      prev.column === column
        ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: column === 'deal_name' ? 'asc' : 'desc' }
    );
  };

  const indicator = (column: SortColumn): string => {
    if (sortConfig.column !== column) return '';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const openEdit = (row: Commission) => {
    setEditRow(row);
    form.reset({
      sale_price: row.sale_price ?? null,
      commission_type: row.commission_type ?? 'percentage',
      commission_rate: row.commission_rate ?? 2.5,
      flat_fee_amount: row.commission_type === 'flat_fee' ? row.gross_commission ?? row.amount : null,
      commission_side: row.commission_side ?? (row.type === 'rental' ? 'rental_listing' : 'listing'),
      referral_enabled: (row.referral_fee_pct ?? 0) > 0,
      referral_pct: row.referral_fee_pct ?? null,
      referral_to: row.referral_to ?? null,
      tc_fee: row.tc_fee ?? 0,
      other_fees: row.other_fees ?? 0,
      closing_date: row.closing_date ?? format(new Date(), 'yyyy-MM-dd'),
      override_broker_settings: false,
    });
  };

  const values = form.watch();
  const calculation = useMemo(
    () =>
      calculateCommission({
        salePrice: values.sale_price ?? 0,
        commissionRate: values.commission_rate ?? 0,
        commissionType: values.commission_type,
        side: values.commission_side,
        referralPct: values.referral_enabled ? values.referral_pct ?? 0 : 0,
        brokerSettings,
        perDealFees: {
          tcFee: values.tc_fee ?? 0,
          otherFees: values.other_fees ?? 0,
        },
        flatFeeAmount: values.flat_fee_amount ?? 0,
        capContext: { ytdCompanyDollar: 0, ytdRoyaltyDollar: 0 },
      }),
    [values, brokerSettings]
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await commissionsService.exportCSV(new Date().getFullYear());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commissions-${new Date().getFullYear()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('finance:commissionHistory.messages.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleSaveEdit = async (data: CommissionSheetFormValues) => {
    if (!editRow) return;
    setSaving(true);
    try {
      await commissionsService.updateCommission(editRow.id, {
        commission_side: data.commission_side,
        commission_type: data.commission_type,
        commission_rate: data.commission_type === 'percentage' ? data.commission_rate : null,
        sale_price: data.sale_price,
        gross_commission: calculation.dealGCI,
        referral_fee_pct: data.referral_enabled ? data.referral_pct : 0,
        referral_fee_amount: calculation.referralFeeAmount,
        referral_to: data.referral_enabled ? data.referral_to : null,
        post_referral_gci: calculation.postReferralGCI,
        broker_split_pct: brokerSettings.broker_split_pct,
        broker_dollar: calculation.brokerDollar,
        capped_at_close: calculation.cappedAtClose,
        franchise_fee_amount: calculation.franchiseFee,
        transaction_fee: calculation.transactionFee,
        eo_fee: calculation.eoFee,
        tc_fee: calculation.tcFee,
        other_fees: calculation.otherFees,
        net_commission: calculation.netCommission,
        amount: calculation.netCommission,
        closing_date: data.closing_date,
      });
      toast.success(t('finance:commissionHistory.messages.updateSuccess'));
      setEditRow(null);
      await load();
    } catch {
      toast.error(t('finance:commissionHistory.messages.updateError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-border dark:border-border bg-card dark:bg-muted">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle>{t('finance:commissionHistory.title')}</CardTitle>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            className="dark:bg-muted dark:hover:bg-muted dark:text-muted-foreground dark:border-border"
          >
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {t('finance:commissionHistory.export')}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={filters.type} onValueChange={(value) => setFilters((p) => ({ ...p, type: value as HistoryFilters['type'] }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance:commissionHistory.filters.allTypes')}</SelectItem>
              <SelectItem value="sale">{t('finance:commissionHistory.filters.sale')}</SelectItem>
              <SelectItem value="rental">{t('finance:commissionHistory.filters.rental')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.side} onValueChange={(value) => setFilters((p) => ({ ...p, side: value as HistoryFilters['side'] }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance:commissionHistory.filters.allSides')}</SelectItem>
              <SelectItem value="listing">{t('deals:commissionSheet.options.side.listing')}</SelectItem>
              <SelectItem value="buyer">{t('deals:commissionSheet.options.side.buyer')}</SelectItem>
              <SelectItem value="dual">{t('deals:commissionSheet.options.side.dual')}</SelectItem>
              <SelectItem value="rental_listing">{t('deals:commissionSheet.options.side.rentalListing')}</SelectItem>
              <SelectItem value="rental_tenant">{t('deals:commissionSheet.options.side.rentalTenant')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance:commissionHistory.filters.allTime', { defaultValue: 'All Time' })}</SelectItem>
              {monthOptions.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={2000}
            max={2100}
            value={new Date().getFullYear()}
            disabled
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">{t('finance:commissionHistory.loading')}</div>
        ) : sortedRows.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t('finance:commissionHistory.empty')}</div>
        ) : (
          <div className="rounded-md border border-border dark:border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button type="button" onClick={() => setSort('closing_date')}>
                      {t('finance:commissionHistory.columns.date')} {indicator('closing_date')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" onClick={() => setSort('deal_name')}>
                      {t('finance:commissionHistory.columns.dealName', { defaultValue: t('finance:commissionHistory.columns.address') })} {indicator('deal_name')}
                    </button>
                  </TableHead>
                  <TableHead>{t('finance:commissionHistory.columns.type')}</TableHead>
                  <TableHead>
                    <button type="button" onClick={() => setSort('gross_commission')}>
                      {t('finance:commissionHistory.columns.gci')} {indicator('gross_commission')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" onClick={() => setSort('net_commission')}>
                      {t('finance:commissionHistory.columns.net')} {indicator('net_commission')}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((row) => (
                  <TableRow key={row.id} className="cursor-pointer" onClick={() => openEdit(row)}>
                    <TableCell>{row.closing_date ?? '-'}</TableCell>
                    <TableCell>{row.property_address}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>${(row.gross_commission ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-success dark:text-emerald-400">${(row.net_commission ?? row.amount ?? 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Sheet open={!!editRow} onOpenChange={(open) => !open && setEditRow(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('finance:commissionHistory.editTitle')}</SheetTitle>
            <SheetDescription>{t('finance:commissionHistory.editDescription')}</SheetDescription>
          </SheetHeader>

          <div className="grid gap-6 mt-4 lg:grid-cols-2">
            <Form {...form}>
              <form id="commission-history-edit-form" className="space-y-4" onSubmit={form.handleSubmit(handleSaveEdit)}>
                <FormField
                  control={form.control}
                  name="sale_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('deals:commissionSheet.fields.salePrice')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commission_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('deals:commissionSheet.fields.commissionType')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">{t('deals:commissionSheet.options.type.percentage')}</SelectItem>
                          <SelectItem value="flat_fee">{t('deals:commissionSheet.options.type.flatFee')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commission_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('deals:commissionSheet.fields.commissionRate')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.001" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referral_pct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('deals:commissionSheet.fields.referralPct')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tc_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('deals:commissionSheet.fields.tcFee')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="other_fees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('deals:commissionSheet.fields.otherFees')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="closing_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('deals:commissionSheet.fields.closingDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>

            <CommissionWaterfall result={calculation} />
          </div>

          <SheetFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setEditRow(null)} disabled={saving}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" form="commission-history-edit-form" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('finance:commissionHistory.saving')}
                </>
              ) : (
                t('finance:commissionHistory.save')
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
};
