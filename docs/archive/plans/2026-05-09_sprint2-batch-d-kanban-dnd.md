# Sprint 2 — Batch D: Kanban Drag-and-Drop

> **Audit Source:** `docs/sprint-audits.md` → Sprint 2 (Gap #1)
> **Gap #1:** Kanban drag-and-drop not implemented — static columns, no DnD library installed
> **Project:** `/Users/jans/Projelerim/RealDesk-CRM/`

---

## Task D1: Install @dnd-kit

### Terminal Command
```bash
cd /Users/jans/Projelerim/RealDesk-CRM
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

These work with React 18.3.1 (already installed).

---

## Task D2: Update LeadPipelineBoard.tsx

### Full Rewrite

**Replace the entire file** with a DnD-enabled version:

```typescript
import { useState, useCallback } from 'react';
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
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { LEAD_PIPELINE_COLUMNS } from '@/services/leads.service';
import { leadsService } from '@/lib/serviceProxy';
import { useAuth } from '@/contexts/AuthContext';
import type { LeadStatus, Lead } from '@/services/leads.service';
import { LeadKanbanCard } from './LeadKanbanCard';
import { KanbanColumn } from './KanbanColumn';
import { KanbanDragCard } from './KanbanDragCard';
import { toast } from 'sonner';
import { COLORS } from '@/config/colors';

interface LeadPipelineBoardProps {
  pipeline: Record<LeadStatus, Lead[]> | null;
  loading: boolean;
  onOpenLead: (lead: Lead) => void;
  onRefresh?: () => void;
}

export function LeadPipelineBoard({ pipeline, loading, onOpenLead, onRefresh }: LeadPipelineBoardProps) {
  const { t } = useTranslation('leads');
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag threshold — prevents accidental drags on click
      },
    }),
    useSensor(KeyboardSensor),
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
    [pipeline],
  );

  const findColumnByLeadId = useCallback(
    (id: string): LeadStatus | null => {
      if (!pipeline) return null;
      for (const [status, leads] of Object.entries(pipeline)) {
        if (leads.some((l) => l.id === id)) return status as LeadStatus;
      }
      return null;
    },
    [pipeline],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const id = String(active.id);
      setActiveId(id);
      setActiveLead(findLeadById(id));
    },
    [findLeadById],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveLead(null);

      if (!over || !user?.id) return;

      const activeIdStr = String(active.id);
      const overIdStr = String(over.id);

      // Determine target column
      let targetStatus: LeadStatus | null = null;

      // If dropped on a column (column IDs are status strings)
      if (LEAD_PIPELINE_COLUMNS.includes(overIdStr as LeadStatus)) {
        targetStatus = overIdStr as LeadStatus;
      } else {
        // If dropped on another card, find its column
        targetStatus = findColumnByLeadId(overIdStr);
      }

      const currentStatus = findColumnByLeadId(activeIdStr);
      if (!targetStatus || !currentStatus || targetStatus === currentStatus) return;

      // Call service to update status
      try {
        await leadsService.updateLeadStatus(activeIdStr, targetStatus, user.id);
        toast.success(
          t('pipeline.statusUpdated', 'Lead moved to {{status}}', {
            status: t(`status.${targetStatus}`),
          }),
        );
        onRefresh?.();
      } catch (error) {
        toast.error(t('pipeline.updateError', 'Failed to update lead status'));
        console.error(error);
      }
    },
    [findColumnByLeadId, user?.id, onRefresh, t],
  );

  if (loading) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-12 text-center text-sm ${COLORS.muted.text}`}>
        {t('pipeline.loading')}
      </div>
    );
  }

  if (!pipeline) return null;

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
                <SortableContext
                  items={leads.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {leads.length === 0 ? (
                    <p className={`px-1 py-6 text-center text-xs ${COLORS.muted.text}`}>
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

      <DragOverlay>
        {activeLead ? <LeadKanbanCard lead={activeLead} onClick={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

---

## Task D3: Create KanbanColumn.tsx

New file: `src/features/leads/components/KanbanColumn.tsx`

```typescript
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
}

export function KanbanColumn({ id, title, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-[260px] shrink-0 flex-col rounded-xl border transition-colors',
        isOver
          ? 'border-blue-400 bg-blue-50/80'
          : 'border-slate-200/80 bg-slate-50/80',
      )}
    >
      <div className="sticky top-0 z-10 rounded-t-xl border-b border-slate-200/80 px-3 py-2 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {title}
          </span>
          <span className="text-xs font-medium tabular-nums text-slate-500">{count}</span>
        </div>
      </div>
      <div className="flex max-h-[calc(100vh-220px)] flex-col gap-2 overflow-y-auto p-2 min-h-[100px]">
        {children}
      </div>
    </div>
  );
}
```

---

## Task D4: Create KanbanDragCard.tsx

New file: `src/features/leads/components/KanbanDragCard.tsx`

```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Lead } from '@/services/leads.service';
import { LeadKanbanCard } from './LeadKanbanCard';
import { cn } from '@/lib/utils';

interface KanbanDragCardProps {
  id: string;
  lead: Lead;
  onClick: () => void;
}

export function KanbanDragCard({ id, lead, onClick }: KanbanDragCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        isDragging && 'opacity-50',
      )}
    >
      <LeadKanbanCard lead={lead} onClick={onClick} />
    </div>
  );
}
```

---

## Task D5: Update Leads.tsx (add refresh prop)

### `src/features/leads/Leads.tsx`

Find the `LeadPipelineBoard` usage (around line 308) and add the `onRefresh` prop:

```typescript
<LeadPipelineBoard
  pipeline={pipeline}
  loading={pipelineLoading}
  onOpenLead={(lead) => openLeadDetail(lead)}
  onRefresh={refreshPipeline}   // ADD THIS
/>
```

Also ensure `refreshPipeline` is available from the pipeline hook (line 41). It probably already is (the `useLeadsPipeline` hook likely returns `refresh`).

---

## Total Files Changed (Batch D)

| File | Action | Lines |
|------|--------|-------|
| `package.json` (via npm install) | Modified | +2 deps |
| `src/features/leads/components/LeadPipelineBoard.tsx` | **REWRITE** | ~165 |
| `src/features/leads/components/KanbanColumn.tsx` | **NEW** | ~35 |
| `src/features/leads/components/KanbanDragCard.tsx` | **NEW** | ~35 |
| `src/features/leads/Leads.tsx` | Modified | +1 line |

**Estimated time in Cursor:** ~25-30 minutes

---

## Verification

- Pipeline columns render same as before (no visual regression)
- Drag a lead card from one column → visual feedback (opacity + drag overlay)
- Drop on another column → lead status updates in DB → column refreshes
- Drop on same column → no update happens
- Click to open lead detail still works (drag threshold prevents accidental drags)
- Empty columns still show "empty" text
- TypeScript: `npm run typecheck` → 0 errors
