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
        isOver ? 'border-blue-400 bg-blue-50/80 dark:border-blue-500 dark:bg-blue-950/50' : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/70'
      )}
    >
      <div className="sticky top-0 z-10 rounded-t-xl border-b border-slate-200/80 dark:border-slate-700/80 px-3 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">{title}</span>
          <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">{count}</span>
        </div>
      </div>
      <div className="flex max-h-[calc(100vh-220px)] flex-col gap-2 overflow-y-auto p-2 min-h-[100px]">
        {children}
      </div>
    </div>
  );
}
