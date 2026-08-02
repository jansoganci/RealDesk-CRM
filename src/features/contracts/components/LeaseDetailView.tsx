import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { useLeaseDetails } from '@/hooks/useLeaseDetails';
import { contractsService, leaseAgreementService } from '@/lib/serviceProxy';
import { formatCurrency } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { LeaseAmendmentTimeline } from './LeaseAmendmentTimeline';

type LeaseDetailViewProps = {
  contractId: string;
};

const USD = 'USD';

function formatDate(v: string | null | undefined): string {
  if (!v) return '—';
  try {
    return format(new Date(v), 'MMM d, yyyy');
  } catch {
    return v;
  }
}

export function LeaseDetailView({ contractId }: LeaseDetailViewProps) {
  const { t } = useTranslation('contracts');
  const { contract, leaseDetails, amendments, isLoading, error, refresh } = useLeaseDetails(contractId);

  const [regenerating, setRegenerating] = useState(false);
  const [addingAmendment, setAddingAmendment] = useState(false);
  const [amendmentDate, setAmendmentDate] = useState('');
  const [amendmentDescription, setAmendmentDescription] = useState('');
  const [timelineKey, setTimelineKey] = useState(0);

  const amountDueAtSigningBreakdown = useMemo(() => {
    if (!leaseDetails || !contract) {
      return { lines: [] as { key: string; label: string; amount: number }[], total: 0 };
    }
    const n = (v: number | null | undefined) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);
    const lines: { key: string; label: string; amount: number }[] = [];

    const firstMonth = n(contract.rent_amount);
    if (firstMonth > 0) {
      lines.push({ key: 'firstMonth', label: 'leaseDetail.financials.breakdown.firstMonthRent', amount: firstMonth });
    }

    const security = n(leaseDetails.security_deposit_amount);
    if (security > 0) {
      lines.push({ key: 'security', label: 'leaseDetail.financials.breakdown.securityDeposit', amount: security });
    }

    const pet = n(leaseDetails.pets_deposit_amount);
    if (pet > 0) {
      lines.push({ key: 'pet', label: 'leaseDetail.financials.breakdown.petDeposit', amount: pet });
    }

    const early = n(leaseDetails.early_move_in_prorated_rent);
    if (early > 0) {
      lines.push({ key: 'early', label: 'leaseDetail.financials.breakdown.earlyMoveIn', amount: early });
    }

    const prepaid = n(leaseDetails.prepaid_rent_amount);
    if (prepaid > 0) {
      lines.push({ key: 'prepaid', label: 'leaseDetail.financials.breakdown.prepaidRent', amount: prepaid });
    }

    const total = lines.reduce((sum, row) => sum + row.amount, 0);
    return { lines, total };
  }, [leaseDetails, contract]);

  const isPdfStale =
    !!leaseDetails?.updated_at &&
    !!contract?.pdf_generated_at &&
    new Date(leaseDetails.updated_at) > new Date(contract.pdf_generated_at);

  const expiringSoon = !!contract?.end_date && contract.status === 'Active' && (() => {
    const d = new Date(contract.end_date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    return diffMs >= 0 && diffMs <= 1000 * 60 * 60 * 24 * 30;
  })();

  const handleDownloadPdf = async () => {
    if (!contract?.contract_pdf_path) return;
    try {
      const url = await contractsService.getContractPdfUrl(contract.contract_pdf_path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(t('leaseDetail.documents.downloadFailed'), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleRegeneratePdf = async () => {
    setRegenerating(true);
    try {
      await leaseAgreementService.regeneratePdf(contractId);
      await refresh();
      toast.success(t('leaseDetail.documents.regenerated'));
    } catch (err) {
      toast.error(t('leaseDetail.documents.regenerateFailed'), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleAddAmendment = async () => {
    if (!amendmentDate.trim() || !amendmentDescription.trim()) {
      toast.error(t('leaseDetail.documents.amendmentRequired'));
      return;
    }
    setAddingAmendment(true);
    try {
      await leaseAgreementService.addAmendment(contractId, {
        amendment_date: amendmentDate,
        description: amendmentDescription.trim(),
      });
      setAmendmentDate('');
      setAmendmentDescription('');
      setTimelineKey((k) => k + 1);
      await refresh();
      toast.success(t('leaseDetail.documents.amendmentSaved'));
    } catch (err) {
      toast.error(t('leaseDetail.documents.amendmentSaveFailed'), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setAddingAmendment(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('leaseDetail.loading')}</p>;
  }
  if (error || !contract || !leaseDetails) {
    return (
      <p className="text-sm text-destructive">
        {error || t('leaseDetail.loadError')}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t('leaseDetail.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('leaseDetail.subtitle')}</p>
        </div>
        {contract.status === 'Archived' ? (
          <Badge variant="secondary">{t('leaseDetail.status.archived')}</Badge>
        ) : expiringSoon ? (
          <Badge className="bg-amber-500 text-white">{t('leaseDetail.status.expiringSoon')}</Badge>
        ) : (
          <Badge className="bg-success text-white">{t('leaseDetail.status.active')}</Badge>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('leaseDetail.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="financials">{t('leaseDetail.tabs.financials')}</TabsTrigger>
          <TabsTrigger value="policies">{t('leaseDetail.tabs.policies')}</TabsTrigger>
          <TabsTrigger value="documents">{t('leaseDetail.tabs.documents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{t('leaseDetail.overview.parties')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">{t('leaseDetail.fields.landlord')}:</span> {leaseDetails.landlord_name || '—'}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.landlordAddress')}:</span> {[leaseDetails.landlord_mailing_street, leaseDetails.landlord_mailing_city, leaseDetails.landlord_mailing_state, leaseDetails.landlord_mailing_zip].filter(Boolean).join(', ') || '—'}</p>
              <Separator />
              <p><span className="font-medium">{t('leaseDetail.fields.tenant1')}:</span> {leaseDetails.tenant_name || '—'}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.tenant1Contact')}:</span> {[leaseDetails.tenant_phone, leaseDetails.tenant_email].filter(Boolean).join(' • ') || '—'}</p>
              {leaseDetails.tenant_name_2 && (
                <>
                  <p><span className="font-medium">{t('leaseDetail.fields.tenant2')}:</span> {leaseDetails.tenant_name_2}</p>
                  <p><span className="font-medium">{t('leaseDetail.fields.tenant2Contact')}:</span> {[leaseDetails.tenant_phone_2, leaseDetails.tenant_email_2].filter(Boolean).join(' • ') || '—'}</p>
                </>
              )}
              {leaseDetails.co_signer_name && (
                <p><span className="font-medium">{t('leaseDetail.fields.cosigner')}:</span> {leaseDetails.co_signer_name} ({leaseDetails.co_signer_role || '—'})</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('leaseDetail.overview.property')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">{t('leaseDetail.fields.address')}:</span> {[leaseDetails.property_street, leaseDetails.property_unit, leaseDetails.property_city, leaseDetails.property_state, leaseDetails.property_zip].filter(Boolean).join(', ')}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.residenceType')}:</span> {leaseDetails.residence_type}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.bedsBaths')}:</span> {leaseDetails.bedrooms} / {leaseDetails.bathrooms}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('leaseDetail.overview.term')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">{t('leaseDetail.fields.startDate')}:</span> {formatDate(contract.start_date)}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.endDate')}:</span> {contract.lease_type === 'month_to_month' ? t('leaseDetail.fields.monthToMonth') : formatDate(contract.end_date)}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.afterTerm')}:</span> {contract.after_term_action || '—'}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{t('leaseDetail.financials.title')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">{t('leaseDetail.fields.monthlyRent')}:</span> {formatCurrency(contract.rent_amount || 0, USD)}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.rentDueDay')}:</span> {leaseDetails.rent_due_day}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.securityDeposit')}:</span> {leaseDetails.security_deposit_enabled ? formatCurrency(leaseDetails.security_deposit_amount || 0, USD) : t('leaseDetail.fields.notEnabled')}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.securityReturnDays')}:</span> {leaseDetails.security_deposit_return_days ?? '—'}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.lateFee')}:</span> {leaseDetails.late_fee_type}</p>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('leaseDetail.financials.amountDue')}</p>
                {amountDueAtSigningBreakdown.lines.map((row) => (
                  <div
                    key={row.key}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <span className="text-muted-foreground">{t(row.label)}</span>
                    <span className="tabular-nums">{formatCurrency(row.amount, USD)}</span>
                  </div>
                ))}
                <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-semibold">
                  <span>{t('leaseDetail.financials.breakdown.total')}</span>
                  <span className="tabular-nums">
                    {formatCurrency(amountDueAtSigningBreakdown.total, USD)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{t('leaseDetail.policies.title')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">{t('leaseDetail.fields.pets')}:</span> {leaseDetails.pets_allowed ? t('leaseDetail.fields.allowed') : t('leaseDetail.fields.notAllowed')}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.subletting')}:</span> {leaseDetails.subletting_policy}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.rentersInsurance')}:</span> {leaseDetails.renters_insurance_required ? t('leaseDetail.fields.required') : t('leaseDetail.fields.notRequired')}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.smoking')}:</span> {leaseDetails.smoking_allowed ? t('leaseDetail.fields.allowed') : t('leaseDetail.fields.notAllowed')}</p>
              <Separator />
              <p><span className="font-medium">{t('leaseDetail.fields.paymentMethods')}:</span> {(leaseDetails.payment_methods || []).join(', ') || '—'}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.utilities')}:</span> {(leaseDetails.utilities_landlord_covered || []).join(', ') || '—'}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.furnished')}:</span> {leaseDetails.furnished_enabled ? t('leaseDetail.fields.yes') : t('leaseDetail.fields.no')}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.appliances')}:</span> {leaseDetails.appliances_enabled ? t('leaseDetail.fields.yes') : t('leaseDetail.fields.no')}</p>
              <p><span className="font-medium">{t('leaseDetail.fields.parking')}:</span> {leaseDetails.parking_enabled ? t('leaseDetail.fields.yes') : t('leaseDetail.fields.no')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{t('leaseDetail.documents.title')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isPdfStale ? (
                <Badge className="bg-amber-500 text-white">{t('leaseDetail.documents.stale')}</Badge>
              ) : contract.pdf_generated_at ? (
                <Badge className="bg-success text-white">{t('leaseDetail.documents.upToDate')}</Badge>
              ) : (
                <Badge variant="secondary">{t('leaseDetail.documents.notGenerated')}</Badge>
              )}

              <div className="flex flex-wrap gap-2">
                {contract.contract_pdf_path && (
                  <Button type="button" variant="outline" onClick={() => void handleDownloadPdf()}>
                    {t('leaseDetail.documents.downloadPdf')}
                  </Button>
                )}
                {(isPdfStale || !contract.pdf_generated_at) && (
                  <Button type="button" onClick={() => void handleRegeneratePdf()} disabled={regenerating}>
                    {regenerating
                      ? t('leaseDetail.documents.regenerating')
                      : contract.pdf_generated_at
                        ? t('leaseDetail.documents.regeneratePdf')
                        : t('leaseDetail.documents.generatePdf')}
                  </Button>
                )}
              </div>

              <p className="text-sm text-muted-foreground">{t('leaseDetail.documents.uploadPlaceholder')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('leaseDetail.documents.amendments')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="amendment-date">{t('leaseDetail.documents.amendmentDate')}</Label>
                  <Input
                    id="amendment-date"
                    type="date"
                    value={amendmentDate}
                    onChange={(e) => setAmendmentDate(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="amendment-description">{t('leaseDetail.documents.amendmentDescription')}</Label>
                  <Textarea
                    id="amendment-description"
                    rows={3}
                    value={amendmentDescription}
                    onChange={(e) => setAmendmentDescription(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={() => void handleAddAmendment()}
                disabled={addingAmendment}
              >
                {addingAmendment ? t('leaseDetail.documents.savingAmendment') : t('leaseDetail.documents.addAmendment')}
              </Button>

              <Separator />
              <p className="text-sm text-muted-foreground">
                {t('leaseDetail.documents.amendmentCount', { count: amendments.length })}
              </p>
              <LeaseAmendmentTimeline key={timelineKey} contractId={contractId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
