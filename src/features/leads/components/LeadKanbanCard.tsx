import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { COLORS } from '@/config/colors';
import type { PropertyInquiry } from '@/types';
import { useTranslation } from 'react-i18next';
import { Phone } from 'lucide-react';
import { getLeadStatusBadgeClasses } from '@/features/inquiries/utils/statusUtils';
import { cn } from '@/lib/utils';

interface LeadKanbanCardProps {
  lead: PropertyInquiry;
  onClick: () => void;
}

export function LeadKanbanCard({ lead, onClick }: LeadKanbanCardProps) {
  const { t } = useTranslation('leads');

  const typeLabel = lead.inquiry_type === 'rental' ? t('typeFilter.rental') : t('typeFilter.sale');

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'p-3 cursor-pointer transition-shadow hover:shadow-md border border-slate-200/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
      )}
    >
      <div className="space-y-2">
        <div className={`font-semibold text-sm ${COLORS.gray.text900} line-clamp-2`}>{lead.name}</div>
        <div className={`flex items-center gap-1 text-xs ${COLORS.gray.text500}`}>
          <Phone className="h-3 w-3 shrink-0" />
          <span className="truncate">{lead.phone}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {typeLabel}
          </Badge>
          <Badge className={cn('text-[10px] px-1.5 py-0', getLeadStatusBadgeClasses(lead.status))}>
            {t(`status.${lead.status}`, { defaultValue: lead.status })}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
