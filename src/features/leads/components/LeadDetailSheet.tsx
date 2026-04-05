import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { leadsService } from '@/lib/serviceProxy';
import type { LeadWithRelations, LeadStatus } from '@/services/leads.service';
import { LEAD_PIPELINE_COLUMNS } from '@/services/leads.service';
import type { PropertyInquiry } from '@/types';
import { getLeadStatusBadgeClasses } from '@/features/inquiries/utils/statusUtils';
import { Eye, Pencil } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { cn } from '@/lib/utils';
import { BuyerAgentAgreementList } from './BuyerAgentAgreementList';
import { ShowingLogList } from './ShowingLogList';

interface LeadDetailSheetProps {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (lead: PropertyInquiry) => void;
  onViewMatches: (lead: PropertyInquiry) => void;
  onUpdated: () => void | Promise<void>;
}

export function LeadDetailSheet({
  leadId,
  open,
  onOpenChange,
  onEdit,
  onViewMatches,
  onUpdated,
}: LeadDetailSheetProps) {
  const { t } = useTranslation('leads');
  const { user } = useAuth();
  const { isMember } = useOrg();
  const [detail, setDetail] = useState<LeadWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const load = useCallback(async () => {
    if (!leadId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    try {
      const data = await leadsService.getLeadWithDetails(leadId);
      setDetail(data);
    } catch (e) {
      toast.error(t('toasts.loadDetailError'));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [leadId, t]);

  useEffect(() => {
    if (open && leadId) {
      void load();
    }
    if (!open) {
      setDetail(null);
    }
  }, [open, leadId, load]);

  const handleStatusChange = async (value: string) => {
    if (!detail || !user?.id) return;
    setStatusSaving(true);
    try {
      const updated = await leadsService.updateLeadStatus(
        detail.id,
        value as LeadStatus,
        user.id
      );
      setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
      toast.success(t('toasts.statusUpdated'));
      await onUpdated();
    } catch {
      toast.error(t('toasts.statusUpdateError'));
    } finally {
      setStatusSaving(false);
    }
  };

  const lead = detail;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-8">
          <SheetTitle>{t('detail.title')}</SheetTitle>
        </SheetHeader>

        {loading && (
          <p className={`text-sm py-6 ${COLORS.muted.text}`}>{t('pipeline.loading')}</p>
        )}

        {!loading && lead && (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{t('detail.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="agreements">{t('detail.tabs.agreements')}</TabsTrigger>
              <TabsTrigger value="showings">{t('detail.tabs.showings')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className={`text-lg font-semibold ${COLORS.gray.text900}`}>{lead.name}</h3>
                  <Badge className={cn('mt-1', getLeadStatusBadgeClasses(lead.status))}>
                    {t(`status.${lead.status}`, { defaultValue: lead.status })}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(lead)}
                    disabled={isMember}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    {t('detail.actions.edit')}
                  </Button>
                  {(lead.status === 'matched' || lead.status === 'contacted') && (
                    <Button type="button" variant="secondary" size="sm" onClick={() => onViewMatches(lead)}>
                      <Eye className="h-4 w-4 mr-1" />
                      {t('detail.actions.matches')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className={`font-medium ${COLORS.muted.text}`}>{t('detail.fields.phone')}: </span>
                  <span>{lead.phone}</span>
                </div>
                {lead.email && (
                  <div>
                    <span className={`font-medium ${COLORS.muted.text}`}>{t('detail.fields.email')}: </span>
                    <span>{lead.email}</span>
                  </div>
                )}
                <div>
                  <span className={`font-medium ${COLORS.muted.text}`}>{t('detail.fields.type')}: </span>
                  <span>{lead.inquiry_type === 'rental' ? t('typeFilter.rental') : t('typeFilter.sale')}</span>
                </div>
                {lead.lead_source && (
                  <div>
                    <span className={`font-medium ${COLORS.muted.text}`}>{t('detail.fields.source')}: </span>
                    <span>{lead.lead_source}</span>
                  </div>
                )}
                {lead.notes && (
                  <div>
                    <span className={`font-medium ${COLORS.muted.text}`}>{t('detail.fields.notes')}: </span>
                    <span className="whitespace-pre-wrap">{lead.notes}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <label className={`text-sm font-medium ${COLORS.gray.text900}`}>{t('detail.fields.status')}</label>
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

            <TabsContent value="agreements" className="mt-4">
              <BuyerAgentAgreementList
                agreement={lead.buyer_agent_agreement ?? undefined}
                leadId={lead.id}
                onRefresh={load}
              />
            </TabsContent>

            <TabsContent value="showings" className="mt-4">
              <ShowingLogList
                showings={lead.showing_logs}
                leadId={lead.id}
                onRefresh={load}
              />
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
