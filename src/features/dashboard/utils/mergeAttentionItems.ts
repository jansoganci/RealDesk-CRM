import type { DailyBriefData, DailyBriefMilestoneItem } from '@/types';

/**
 * Merges Daily Brief milestone buckets into one 0–7 day (+ overdue) list.
 * Dedupes by milestoneId (due7Days overlaps due3Days).
 */
export function mergeAttentionItems(data: DailyBriefData): DailyBriefMilestoneItem[] {
  const byId = new Map<string, DailyBriefMilestoneItem>();

  for (const item of [
    ...data.overdue,
    ...data.dueToday,
    ...data.due3Days,
    ...data.due7Days,
  ]) {
    if (!byId.has(item.milestoneId)) {
      byId.set(item.milestoneId, item);
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (a.daysUntilDue !== b.daysUntilDue) {
      return a.daysUntilDue - b.daysUntilDue;
    }
    return a.dealName.localeCompare(b.dealName);
  });
}

export type AttentionDealGroup = {
  dealId: string;
  dealName: string;
  items: DailyBriefMilestoneItem[];
};

export function groupAttentionByDeal(
  items: DailyBriefMilestoneItem[]
): AttentionDealGroup[] {
  const groups = new Map<string, AttentionDealGroup>();

  for (const item of items) {
    const existing = groups.get(item.dealId);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(item.dealId, {
        dealId: item.dealId,
        dealName: item.dealName,
        items: [item],
      });
    }
  }

  return Array.from(groups.values());
}
