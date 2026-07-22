import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Lead } from '@/services/leads.service';
import { LeadKanbanCard } from './LeadKanbanCard';
import { cn } from '@/lib/utils';

interface KanbanDragCardProps {
  id: string;
  lead: Lead;
  onClick: () => void;
  disabled?: boolean;
}

export function KanbanDragCard({ id, lead, onClick, disabled }: KanbanDragCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

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
      className={cn(isDragging && 'opacity-50')}
    >
      <LeadKanbanCard lead={lead} onClick={onClick} />
    </div>
  );
}
