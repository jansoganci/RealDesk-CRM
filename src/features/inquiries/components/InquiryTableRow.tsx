import { useTranslation } from 'react-i18next';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableActionButtons } from '@/components/common/TableActionButtons';
import { Phone, Mail, MapPin, Eye, Loader2 } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { cn } from '@/lib/utils';
import { useOrg } from '@/contexts/OrgContext';
import type { PropertyInquiry } from '@/types';
import { getLeadStatusBadgeClasses } from '../utils/statusUtils';
import { formatCurrencyRange } from '@/lib/currency';

interface InquiryTableRowProps {
  inquiry: PropertyInquiry;
  onEdit: (inquiry: PropertyInquiry) => void;
  onDelete: (inquiry: PropertyInquiry) => void;
  onViewMatches: (inquiry: PropertyInquiry) => void;
  matchesLoading?: string | null;
  /** Opens lead detail panel (e.g. list + pipeline). */
  onOpenDetail?: (inquiry: PropertyInquiry) => void;
}

export function InquiryTableRow({
  inquiry,
  onEdit,
  onDelete,
  onViewMatches,
  matchesLoading,
  onOpenDetail,
}: InquiryTableRowProps) {
  const { t } = useTranslation(['leads', 'common']);
  const { isMember } = useOrg();

  return (
    <TableRow key={inquiry.id}>
      <TableCell>
        <div className="space-y-1">
          {onOpenDetail ? (
            <button
              type="button"
              className={cn(
                'text-left font-medium',
                COLORS.gray.text900,
                'hover:underline cursor-pointer'
              )}
              onClick={() => onOpenDetail(inquiry)}
            >
              {inquiry.name}
            </button>
          ) : (
            <div className={`font-medium ${COLORS.gray.text900}`}>{inquiry.name}</div>
          )}
          <div className={`text-sm ${COLORS.gray.text500} flex items-center gap-1`}>
            <Phone className="h-3 w-3" />
            {inquiry.phone}
          </div>
          {inquiry.email && (
            <div className={`text-sm ${COLORS.gray.text500} flex items-center gap-1`}>
              <Mail className="h-3 w-3" />
              {inquiry.email}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {inquiry.preferred_city || inquiry.preferred_district ? (
          <div className="flex items-center gap-1">
            <MapPin className={`h-4 w-4 ${COLORS.gray.text500}`} />
            <span>
              {inquiry.preferred_city}
              {inquiry.preferred_city && inquiry.preferred_district && ', '}
              {inquiry.preferred_district}
            </span>
          </div>
        ) : (
          <span className={COLORS.gray.text500}>-</span>
        )}
      </TableCell>
      <TableCell>
        {(() => {
          const isRental = inquiry.inquiry_type === 'rental';
          const minBudget = isRental ? inquiry.min_rent_budget : inquiry.min_sale_budget;
          const maxBudget = isRental ? inquiry.max_rent_budget : inquiry.max_sale_budget;

          if (minBudget || maxBudget) {
            return (
              <span>
                {formatCurrencyRange(minBudget, maxBudget)}
              </span>
            );
          }
          return <span className={COLORS.gray.text500}>-</span>;
        })()}
      </TableCell>
      <TableCell>
        <Badge className={getLeadStatusBadgeClasses(inquiry.status)}>
          {t(`status.${inquiry.status}`, { defaultValue: inquiry.status })}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {(inquiry.status === 'matched' || inquiry.status === 'contacted') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewMatches(inquiry)}
              disabled={matchesLoading === inquiry.id}
              className="flex items-center gap-1"
            >
              {matchesLoading === inquiry.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {t('table.viewMatches')}
            </Button>
          )}
          <TableActionButtons
            onEdit={() => onEdit(inquiry)}
            onDelete={() => onDelete(inquiry)}
            disabledEdit={isMember}
            disabledDelete={isMember}
            disabledEditTooltip={isMember ? t('common:readOnlyMode') : undefined}
            disabledDeleteTooltip={isMember ? t('common:readOnlyMode') : undefined}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

