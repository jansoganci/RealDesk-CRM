import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FileText, Download, AlertCircle, Plus } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { BuyerAgentAgreementDialog } from './BuyerAgentAgreementDialog';
import type { BuyerAgentAgreement } from '@/services/leads.service';
import { COLORS } from '@/config/colors';
import { useOrg } from '@/contexts/OrgContext';

interface BuyerAgentAgreementListProps {
  agreement?: BuyerAgentAgreement;
  leadId: string;
  onRefresh: () => void;
}

export function BuyerAgentAgreementList({
  agreement,
  leadId,
  onRefresh,
}: BuyerAgentAgreementListProps) {
  const { t } = useTranslation('leads');
  const { isMember } = useOrg();
  const [dialogOpen, setDialogOpen] = useState(false);

  const getDaysUntilExpiration = (expirationDate: string) => {
    return differenceInDays(new Date(expirationDate), new Date());
  };

  const getExpirationBadge = (agreement: BuyerAgentAgreement) => {
    if (agreement.status === 'expired') {
      return (
        <Badge variant="destructive">{t('agreements.expired', 'Expired')}</Badge>
      );
    }
    if (agreement.status === 'terminated') {
      return (
        <Badge variant="secondary">{t('agreements.terminated', 'Terminated')}</Badge>
      );
    }

    const daysLeft = getDaysUntilExpiration(agreement.expiration_date);

    if (daysLeft < 0) {
      return (
        <Badge variant="destructive">{t('agreements.expired', 'Expired')}</Badge>
      );
    }
    if (daysLeft <= 7) {
      return (
        <Badge variant="warning" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          {t('agreements.expiresIn', 'Expires in {{days}} days', { days: daysLeft })}
        </Badge>
      );
    }
    if (daysLeft <= 30) {
      return (
        <Badge variant="secondary">
          {t('agreements.expiresIn', 'Expires in {{days}} days', { days: daysLeft })}
        </Badge>
      );
    }

    return <Badge variant="success">{t('agreements.active', 'Active')}</Badge>;
  };

  const formatCommission = (agreement: BuyerAgentAgreement) => {
    switch (agreement.commission_type) {
      case 'percentage':
        return `${agreement.commission_rate}%`;
      case 'flat_fee':
        return `$${agreement.flat_fee_amount?.toLocaleString()}`;
      case 'tiered':
        return t('agreements.tiered', 'Tiered');
      default:
        return 'N/A';
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-base font-semibold ${COLORS.gray.text900}`}>
          {t('agreements.title', 'Buyer-Agent Agreement')}
        </h3>
        {!agreement && !isMember && (
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('agreements.create', 'Create Agreement')}
          </Button>
        )}
      </div>

      {/* Agreement Card or Empty State */}
      {agreement ? (
        <Card className="p-4 space-y-3">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${COLORS.muted.text}`}>
              {t('detail.agreements.status', 'Status')}
            </span>
            {getExpirationBadge(agreement)}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={COLORS.muted.text}>
                {t('detail.agreements.signed', 'Signed')}
              </span>
              <p className={`font-medium ${COLORS.gray.text900}`}>
                {format(new Date(agreement.signed_date), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <span className={COLORS.muted.text}>
                {t('detail.agreements.expires', 'Expires')}
              </span>
              <p className={`font-medium ${COLORS.gray.text900}`}>
                {format(new Date(agreement.expiration_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Commission */}
          <div className="text-sm">
            <span className={COLORS.muted.text}>
              {t('detail.agreements.commission', 'Commission')}
            </span>
            <p className={`font-medium ${COLORS.gray.text900}`}>
              {formatCommission(agreement)}{' '}
              <span className={COLORS.muted.text}>
                ({agreement.commission_type?.replace('_', ' ')})
              </span>
            </p>
          </div>

          {/* PDF Download */}
          {agreement.pdf_url && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open(agreement.pdf_url!, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('agreements.downloadPdf', 'Download Agreement PDF')}
            </Button>
          )}

          {/* Actions */}
          {agreement.status === 'active' && !isMember && (
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                {t('common:actions.edit', 'Edit')}
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <FileText className={`mx-auto h-12 w-12 ${COLORS.muted.text} mb-3`} />
          <p className={`${COLORS.muted.text} mb-4`}>
            {t('detail.agreements.empty', 'No buyer-agent agreement on file.')}
          </p>
          {!isMember && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('agreements.create', 'Create Agreement')}
            </Button>
          )}
        </Card>
      )}

      {/* Agreement Dialog */}
      <BuyerAgentAgreementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        leadId={leadId}
        existingAgreement={agreement}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
