import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/config/colors';
import { cn } from '@/lib/utils';
import { leadsService } from '@/lib/serviceProxy';
import { LEAD_PIPELINE_COLUMNS } from '@/services/leads.service';
import type { Lead, LeadStatus } from '@/services/leads.service';
import { KanbanColumn } from './KanbanColumn';
import { KanbanDragCard } from './KanbanDragCard';
import { LeadKanbanCard } from './LeadKanbanCard';

interface LeadPipelineBoardProps {
  pipeline: Record<LeadStatus, Lead[]> | null;
  loading: boolean;
  onOpenLead: (lead: Lead) => void;
  onRefresh?: () => void;
  readOnly?: boolean;
}

export function LeadPipelineBoard({
  pipeline,
  loading,
  onOpenLead,
  onRefresh,
  readOnly,
}: LeadPipelineBoardProps) {
  const { t } = useTranslation('leads');
  const { user } = useAuth();
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findLeadById = useCallback(
    (id: string): Lead | null => {
      if (!pipeline) return null;
      for (const column of Object.values(pipeline)) {
        const found = column.find((l) => l.id === id);
        if (found) return found;
      }
      return null;
    },
    [pipeline]
  );

  const findColumnByLeadId = useCallback(
    (id: string): LeadStatus | null => {
      if (!pipeline) return null;
      for (const [status, leads] of Object.entries(pipeline)) {
        if (leads.some((l) => l.id === id)) return status as LeadStatus;
      }
      return null;
    },
    [pipeline]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setActiveLead(findLeadById(id));
    },
    [findLeadById]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveLead(null);

      if (readOnly || !over || !user?.id) return;

      const activeIdStr = String(active.id);
      const overIdStr = String(over.id);

      let targetStatus: LeadStatus | null = null;

      if (LEAD_PIPELINE_COLUMNS.includes(overIdStr as LeadStatus)) {
        targetStatus = overIdStr as LeadStatus;
      } else {
        targetStatus = findColumnByLeadId(overIdStr);
      }

      const currentStatus = findColumnByLeadId(activeIdStr);
      if (!targetStatus || !currentStatus || targetStatus === currentStatus) return;

      try {
        await leadsService.updateLeadStatus(activeIdStr, targetStatus, user.id);
        toast.success(
          t('pipeline.dragMoved', {
            status: t(`status.${targetStatus}`),
          })
        );
        onRefresh?.();
      } catch (error) {
        toast.error(t('pipeline.dragUpdateError'));
        console.error(error);
      }
    },
    [findColumnByLeadId, user?.id, onRefresh, t, readOnly]
  );

  if (loading) {
    return (
      <div className={`rounded-xl border border-border dark:border-border bg-card dark:bg-muted p-12 text-center text-sm ${COLORS.muted.text} dark:text-muted-foreground/70`}>
        {t('pipeline.loading')}
      </div>
    );
  }

  if (!pipeline) {
    return null;
  }

  const boardBody = (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max pb-2">
        {LEAD_PIPELINE_COLUMNS.map((columnId) => {
          const leads = pipeline[columnId] || [];
          return (
            <div
              key={columnId}
              className="flex w-[260px] shrink-0 flex-col rounded-xl border border-border/80 dark:border-border bg-muted/80 dark:bg-muted"
            >
              <div
                className={cn(
                  'sticky top-0 z-10 rounded-t-xl border-b border-border/80 dark:border-border px-3 py-2',
                  'bg-card/95 dark:bg-muted backdrop-blur-sm'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
                    {t(`status.${columnId}`)}
                  </span>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground dark:text-muted-foreground/70">{leads.length}</span>
                </div>
              </div>
              <div className="flex max-h-[calc(100vh-220px)] flex-col gap-2 overflow-y-auto p-2">
                {leads.length === 0 ? (
                  <p className={`px-1 py-6 text-center text-xs ${COLORS.muted.text} dark:text-muted-foreground/70`}>
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

  if (readOnly) {
    return boardBody;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max pb-2">
          {LEAD_PIPELINE_COLUMNS.map((columnId) => {
            const leads = pipeline[columnId] || [];
            return (
              <KanbanColumn
                key={columnId}
                id={columnId}
                title={t(`status.${columnId}`)}
                count={leads.length}
              >
                <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                  {leads.length === 0 ? (
                    <p className={`px-1 py-6 text-center text-xs ${COLORS.muted.text} dark:text-muted-foreground/70`}>
                      {t('pipeline.emptyColumn')}
                    </p>
                  ) : (
                    leads.map((lead) => (
                      <KanbanDragCard
                        key={lead.id}
                        id={lead.id}
                        lead={lead}
                        onClick={() => onOpenLead(lead)}
                      />
                    ))
                  )}
                </SortableContext>
              </KanbanColumn>
            );
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeLead ? <LeadKanbanCard lead={activeLead} onClick={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
