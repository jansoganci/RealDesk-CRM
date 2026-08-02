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
        isOver ? 'border-primary/30 bg-primary/10' : 'border-border/80 bg-muted/80'
      )}
    >
      <div className="sticky top-0 z-10 rounded-t-xl border-b border-border/80 dark:border-border px-3 py-2 bg-card/95 dark:bg-muted backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">{title}</span>
          <span className="text-xs font-medium tabular-nums text-muted-foreground dark:text-muted-foreground/70">{count}</span>
        </div>
      </div>
      <div className="flex max-h-[calc(100vh-220px)] flex-col gap-2 overflow-y-auto p-2 min-h-[100px]">
        {children}
      </div>
    </div>
  );
}
