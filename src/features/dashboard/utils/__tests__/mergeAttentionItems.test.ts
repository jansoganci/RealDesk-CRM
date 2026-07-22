import { describe, expect, it } from 'vitest';
import {
  groupAttentionByDeal,
  mergeAttentionItems,
} from '../mergeAttentionItems';
import type { DailyBriefData, DailyBriefMilestoneItem } from '@/types';

function item(
  partial: Partial<DailyBriefMilestoneItem> &
    Pick<DailyBriefMilestoneItem, 'milestoneId' | 'dealId' | 'daysUntilDue'>
): DailyBriefMilestoneItem {
  return {
    dealName: partial.dealName ?? 'Deal',
    propertyAddress: partial.propertyAddress ?? '—',
    milestoneTitle: partial.milestoneTitle ?? 'Milestone',
    dueDate: partial.dueDate ?? '2026-07-22',
    responsibleParty: partial.responsibleParty ?? 'buyer_agent',
    ...partial,
  };
}

describe('mergeAttentionItems', () => {
  it('dedupes overlapping 3-day and 7-day buckets and sorts by due', () => {
    const shared = item({
      milestoneId: 'm1',
      dealId: 'd1',
      dealName: 'Emma',
      daysUntilDue: 2,
      milestoneTitle: 'Open escrow',
    });
    const week = item({
      milestoneId: 'm2',
      dealId: 'd1',
      dealName: 'Emma',
      daysUntilDue: 7,
      milestoneTitle: 'Home inspection',
    });
    const overdue = item({
      milestoneId: 'm0',
      dealId: 'd1',
      dealName: 'Emma',
      daysUntilDue: -1,
      milestoneTitle: 'Earnest',
    });

    const data: DailyBriefData = {
      overdue: [overdue],
      dueToday: [],
      due3Days: [shared],
      due7Days: [shared, week],
      waitingOnOthers: [],
      dealHealthCards: [],
    };

    const merged = mergeAttentionItems(data);
    expect(merged.map((m) => m.milestoneId)).toEqual(['m0', 'm1', 'm2']);
  });

  it('groups by deal while preserving due order within each deal', () => {
    const items = [
      item({ milestoneId: 'a', dealId: 'd2', dealName: 'B Deal', daysUntilDue: 1 }),
      item({ milestoneId: 'b', dealId: 'd1', dealName: 'A Deal', daysUntilDue: 0 }),
      item({ milestoneId: 'c', dealId: 'd1', dealName: 'A Deal', daysUntilDue: 3 }),
    ];
    const sorted = [...items].sort((x, y) => x.daysUntilDue - y.daysUntilDue);
    const groups = groupAttentionByDeal(sorted);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.dealId).toBe('d1');
    expect(groups[0]?.items.map((i) => i.milestoneId)).toEqual(['b', 'c']);
    expect(groups[1]?.dealId).toBe('d2');
  });

  it('always ranks an overdue milestone ahead of future milestones on the same deal', () => {
    const overdue = item({
      milestoneId: 'm-overdue',
      dealId: 'd1',
      dealName: 'Same Deal',
      daysUntilDue: -3,
    });
    const dueToday = item({
      milestoneId: 'm-today',
      dealId: 'd1',
      dealName: 'Same Deal',
      daysUntilDue: 0,
    });
    const dueLater = item({
      milestoneId: 'm-later',
      dealId: 'd1',
      dealName: 'Same Deal',
      daysUntilDue: 5,
    });

    const data: DailyBriefData = {
      overdue: [overdue],
      dueToday: [dueToday],
      due3Days: [],
      due7Days: [dueLater],
      waitingOnOthers: [],
      dealHealthCards: [],
    };

    const merged = mergeAttentionItems(data);
    expect(merged.map((m) => m.milestoneId)).toEqual(['m-overdue', 'm-today', 'm-later']);
  });

  // The 0-7 day window itself is enforced by DailyBriefService.getDueSoon
  // (src/services/dailyBrief.service.ts:147-180): it queries due_date <= today+N
  // (inclusive of day 7) and excludes same-day rows for N > 0. mergeAttentionItems
  // does no date filtering of its own — it trusts whatever buckets it's handed.
  it('includes an item at the day-7 boundary and does not re-filter by daysUntilDue', () => {
    const boundary = item({
      milestoneId: 'm-day7',
      dealId: 'd1',
      dealName: 'Boundary Deal',
      daysUntilDue: 7,
    });
    // Hypothetical day-8 item: mergeAttentionItems has no logic that would drop
    // this even though the real service never produces it in due7Days.
    const beyondBoundary = item({
      milestoneId: 'm-day8',
      dealId: 'd1',
      dealName: 'Boundary Deal',
      daysUntilDue: 8,
    });

    const data: DailyBriefData = {
      overdue: [],
      dueToday: [],
      due3Days: [],
      due7Days: [boundary, beyondBoundary],
      waitingOnOthers: [],
      dealHealthCards: [],
    };

    const merged = mergeAttentionItems(data);
    expect(merged.map((m) => m.milestoneId)).toEqual(['m-day7', 'm-day8']);
  });

  it('collapses a milestone duplicated across overdue, 3-day, and 7-day buckets into one row', () => {
    const duplicate = item({
      milestoneId: 'm-dup',
      dealId: 'd1',
      dealName: 'Dup Deal',
      daysUntilDue: -1,
      milestoneTitle: 'From overdue bucket',
    });
    // Same milestoneId reappearing in later buckets with stale field values —
    // the overdue copy (iterated first) must win.
    const duplicateStale = item({
      milestoneId: 'm-dup',
      dealId: 'd1',
      dealName: 'Dup Deal',
      daysUntilDue: 3,
      milestoneTitle: 'Stale copy from 7-day bucket',
    });

    const data: DailyBriefData = {
      overdue: [duplicate],
      dueToday: [],
      due3Days: [duplicateStale],
      due7Days: [duplicateStale],
      waitingOnOthers: [],
      dealHealthCards: [],
    };

    const merged = mergeAttentionItems(data);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.milestoneTitle).toBe('From overdue bucket');
    expect(merged[0]?.daysUntilDue).toBe(-1);
  });

  it('returns an empty array when every bucket is empty (caught-up state)', () => {
    const data: DailyBriefData = {
      overdue: [],
      dueToday: [],
      due3Days: [],
      due7Days: [],
      waitingOnOthers: [],
      dealHealthCards: [],
    };

    expect(mergeAttentionItems(data)).toEqual([]);
    expect(groupAttentionByDeal(mergeAttentionItems(data))).toEqual([]);
  });

  it('does not crash when propertyAddress is an empty string', () => {
    // DailyBriefMilestoneItem.propertyAddress is typed as a required string
    // (src/types/index.ts:366); the service always resolves it to at least '—'.
    // An empty string is the closest "missing" value the type allows, and
    // merge/group never read propertyAddress, so this should pass through untouched.
    const noAddress = item({
      milestoneId: 'm-no-address',
      dealId: 'd1',
      dealName: 'No Address Deal',
      daysUntilDue: 1,
      propertyAddress: '',
    });

    const data: DailyBriefData = {
      overdue: [],
      dueToday: [],
      due3Days: [noAddress],
      due7Days: [],
      waitingOnOthers: [],
      dealHealthCards: [],
    };

    const merged = mergeAttentionItems(data);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.propertyAddress).toBe('');
  });

  it('falls back to alphabetical dealName ordering when daysUntilDue ties', () => {
    const zebra = item({ milestoneId: 'z', dealId: 'd1', dealName: 'Zebra Deal', daysUntilDue: 2 });
    const apple = item({ milestoneId: 'a', dealId: 'd2', dealName: 'Apple Deal', daysUntilDue: 2 });
    const mango = item({ milestoneId: 'm', dealId: 'd3', dealName: 'Mango Deal', daysUntilDue: 2 });

    const data: DailyBriefData = {
      overdue: [],
      dueToday: [],
      due3Days: [zebra, apple, mango],
      due7Days: [],
      waitingOnOthers: [],
      dealHealthCards: [],
    };

    const merged = mergeAttentionItems(data);
    expect(merged.map((m) => m.dealName)).toEqual(['Apple Deal', 'Mango Deal', 'Zebra Deal']);
  });

  it('preserves bucket iteration order when daysUntilDue and dealName both tie', () => {
    // Array.prototype.sort is required to be stable (ES2019+), and the
    // comparator returns 0 for equal daysUntilDue + dealName, so insertion
    // order (overdue, dueToday, due3Days, due7Days) decides the final order.
    const first = item({
      milestoneId: 'first',
      dealId: 'd1',
      dealName: 'Same Deal',
      daysUntilDue: 4,
      milestoneTitle: 'Listed first',
    });
    const second = item({
      milestoneId: 'second',
      dealId: 'd1',
      dealName: 'Same Deal',
      daysUntilDue: 4,
      milestoneTitle: 'Listed second',
    });

    const data: DailyBriefData = {
      overdue: [],
      dueToday: [],
      due3Days: [first, second],
      due7Days: [],
      waitingOnOthers: [],
      dealHealthCards: [],
    };

    const merged = mergeAttentionItems(data);
    expect(merged.map((m) => m.milestoneId)).toEqual(['first', 'second']);
  });

  it('keeps three deal groups separate with independent due-date ordering per group', () => {
    const items = [
      item({ milestoneId: 'a1', dealId: 'd1', dealName: 'Deal A', daysUntilDue: 4 }),
      item({ milestoneId: 'a2', dealId: 'd1', dealName: 'Deal A', daysUntilDue: 1 }),
      item({ milestoneId: 'b1', dealId: 'd2', dealName: 'Deal B', daysUntilDue: 2 }),
      item({ milestoneId: 'c1', dealId: 'd3', dealName: 'Deal C', daysUntilDue: -1 }),
      item({ milestoneId: 'c2', dealId: 'd3', dealName: 'Deal C', daysUntilDue: 0 }),
    ];
    const sorted = [...items].sort((x, y) => x.daysUntilDue - y.daysUntilDue);

    const groups = groupAttentionByDeal(sorted);
    expect(groups.map((g) => g.dealId)).toEqual(['d3', 'd1', 'd2']);
    expect(groups.find((g) => g.dealId === 'd1')?.items.map((i) => i.milestoneId)).toEqual([
      'a2',
      'a1',
    ]);
    expect(groups.find((g) => g.dealId === 'd3')?.items.map((i) => i.milestoneId)).toEqual([
      'c1',
      'c2',
    ]);
  });

  it('groupAttentionByDeal returns an empty array for an empty input', () => {
    expect(groupAttentionByDeal([])).toEqual([]);
  });
});
