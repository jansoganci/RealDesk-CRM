import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, Handshake, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { leadsService } from '@/lib/serviceProxy';
import { ROUTES } from '@/config/constants';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getLeadStatusBadgeClasses } from '@/features/inquiries/utils/statusUtils';
import { LEAD_PIPELINE_COLUMNS } from '@/services/leads.service';
import type { LeadStatus } from '@/services/leads.service';
import { BuyerAgentAgreementList } from './components/BuyerAgentAgreementList';
import { ShowingLogList } from './components/ShowingLogList';
import { DealCreationSheet } from '@/features/deals/components/DealCreationSheet';
import { useLeadDetail } from './hooks/useLeadDetail';

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('leads');
  const { t: tDeals } = useTranslation('deals');
  const { user } = useAuth();
  const { isMember } = useOrg();
  const { detail, loading, refresh, setDetail } = useLeadDetail(id);
  const [statusSaving, setStatusSaving] = useState(false);
  const [dealSheetOpen, setDealSheetOpen] = useState(false);

  const lead = detail;
  const canRender = useMemo(() => Boolean(id && lead), [id, lead]);

  const handleStatusChange = async (value: string) => {
    if (!lead || !user?.id) return;
    setStatusSaving(true);
    try {
      const updated = await leadsService.updateLeadStatus(lead.id, value as LeadStatus, user.id);
      setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
      toast.success(t('toasts.statusUpdated'));
    } catch {
      toast.error(t('toasts.statusUpdateError'));
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <>
      <PageContainer className="py-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.LEADS)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common:actions.back', 'Back')}
          </Button>
          <h1 className="text-lg font-semibold">{t('detail.title', 'Lead Detail')}</h1>
          <div />
        </div>

        {loading && <p className="text-sm text-muted-foreground">{t('pipeline.loading')}</p>}
        {!loading && !canRender && (
          <p className="text-sm text-muted-foreground">{t('toasts.loadDetailError')}</p>
        )}

        {!loading && lead && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{t('detail.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="agreements">{t('detail.tabs.agreements')}</TabsTrigger>
              <TabsTrigger value="showings">{t('detail.tabs.showings')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold">{lead.name}</h3>
                  <Badge className={cn('mt-1', getLeadStatusBadgeClasses(lead.status))}>
                    {t(`status.${lead.status}`, { defaultValue: lead.status })}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={isMember}>
                    <Pencil className="h-4 w-4 mr-1" />
                    {t('detail.actions.edit')}
                  </Button>
                  {(lead.status === 'matched' || lead.status === 'contacted') && (
                    <Button type="button" variant="secondary" size="sm" disabled>
                      <Eye className="h-4 w-4 mr-1" />
                      {t('detail.actions.matches')}
                    </Button>
                  )}
                  {lead.status === 'active' && !lead.deal_id && (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => setDealSheetOpen(true)}
                      disabled={isMember}
                    >
                      <Handshake className="h-4 w-4 mr-1" />
                      {tDeals('creation.convertFromLead')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">{t('detail.fields.phone')}: </span>
                  <span>{lead.phone}</span>
                </div>
                {lead.email && (
                  <div>
                    <span className="font-medium text-muted-foreground">{t('detail.fields.email')}: </span>
                    <span>{lead.email}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-muted-foreground">{t('detail.fields.type')}: </span>
                  <span>{lead.inquiry_type === 'rental' ? t('typeFilter.rental') : t('typeFilter.sale')}</span>
                </div>
                {lead.lead_source && (
                  <div>
                    <span className="font-medium text-muted-foreground">{t('detail.fields.source')}: </span>
                    <span>{lead.lead_source}</span>
                  </div>
                )}
                {lead.notes && (
                  <div>
                    <span className="font-medium text-muted-foreground">{t('detail.fields.notes')}: </span>
                    <span className="whitespace-pre-wrap">{lead.notes}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('detail.fields.status')}</label>
                <Select
                  value={lead.status}
                  onValueChange={handleStatusChange}
                  disabled={isMember || statusSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('detail.statusPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {!LEAD_PIPELINE_COLUMNS.includes(lead.status as LeadStatus) && (
                      <SelectItem value={lead.status}>
                        {t(`status.${lead.status}`, { defaultValue: lead.status })}
                      </SelectItem>
                    )}
                    {LEAD_PIPELINE_COLUMNS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`status.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="agreements">
              <BuyerAgentAgreementList
                agreement={lead.buyer_agent_agreement ?? undefined}
                leadId={lead.id}
                onRefresh={refresh}
              />
            </TabsContent>

            <TabsContent value="showings">
              <ShowingLogList showings={lead.showing_logs} leadId={lead.id} onRefresh={refresh} />
            </TabsContent>
          </Tabs>
        )}
      </PageContainer>

      {detail && (
        <DealCreationSheet
          lead={detail}
          open={dealSheetOpen}
          onOpenChange={setDealSheetOpen}
          disabled={isMember}
          onSuccess={refresh}
        />
      )}
    </>
  );
}
