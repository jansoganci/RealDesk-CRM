import type { DealWithRelations } from '@/lib/serviceProxy';

/** Latest offer round with a linked Sprint 6B purchase agreement contract. */
export function getLatestPurchaseContractIdFromDeal(deal: DealWithRelations): string | null {
  const rounds = deal.offer_rounds ?? [];
  const withContract = rounds.filter((r) => r.contract_id);
  if (withContract.length === 0) return null;
  withContract.sort((a, b) => b.round_number - a.round_number);
  return withContract[0]?.contract_id ?? null;
}
