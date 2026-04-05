import { useTranslation } from 'react-i18next';
import { LEAD_PIPELINE_COLUMNS } from '@/services/leads.service';
import type { LeadStatus } from '@/services/leads.service';
import type { Lead } from '@/services/leads.service';
import { LeadKanbanCard } from './LeadKanbanCard';
import { cn } from '@/lib/utils';
import { COLORS } from '@/config/colors';

interface LeadPipelineBoardProps {
  pipeline: Record<LeadStatus, Lead[]> | null;
  loading: boolean;
  onOpenLead: (lead: Lead) => void;
}

export function LeadPipelineBoard({ pipeline, loading, onOpenLead }: LeadPipelineBoardProps) {
  const { t } = useTranslation('leads');

  if (loading) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-12 text-center text-sm ${COLORS.muted.text}`}>
        {t('pipeline.loading')}
      </div>
    );
  }

  if (!pipeline) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max pb-2">
        {LEAD_PIPELINE_COLUMNS.map((columnId) => {
          const leads = pipeline[columnId] || [];
          return (
            <div
              key={columnId}
              className="flex w-[260px] shrink-0 flex-col rounded-xl border border-slate-200/80 bg-slate-50/80"
            >
              <div
                className={cn(
                  'sticky top-0 z-10 rounded-t-xl border-b border-slate-200/80 px-3 py-2',
                  'bg-white/95 backdrop-blur-sm'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {t(`status.${columnId}`)}
                  </span>
                  <span className="text-xs font-medium tabular-nums text-slate-500">{leads.length}</span>
                </div>
              </div>
              <div className="flex max-h-[calc(100vh-220px)] flex-col gap-2 overflow-y-auto p-2">
                {leads.length === 0 ? (
                  <p className={`px-1 py-6 text-center text-xs ${COLORS.muted.text}`}>
                    {t('pipeline.emptyColumn')}
                  </p>
                ) : (
                  leads.map((lead) => (
                    <LeadKanbanCard key={lead.id} lead={lead} onClick={() => onOpenLead(lead)} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
