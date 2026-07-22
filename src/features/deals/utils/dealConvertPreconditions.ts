import type { DealFormData } from '@/features/deals/schemas/dealFormSchema';
import type { CreateDealInput } from '@/lib/serviceProxy';

export type ConvertPreconditionError = 'property_required';

/** Converting a lead requires a matched property; standalone deals may omit it. */
export function validateConvertPreconditions(
  data: Pick<DealFormData, 'property_id'>
): ConvertPreconditionError | null {
  return data.property_id ? null : 'property_required';
}

export function buildDealPayload(data: DealFormData): CreateDealInput {
  return {
    deal_name: data.deal_name,
    deal_type: data.deal_type,
    client_role: data.client_role,
    property_id: data.property_id ?? null,
    property_snapshot: data.property_snapshot ?? null,
    financing_type: data.financing_type ?? null,
    preapproval_status: data.preapproval_status ?? null,
    buyer_agent_agreement_id: data.buyer_agent_agreement_id ?? null,
    list_price: data.list_price ?? null,
    intended_offer_price: data.intended_offer_price ?? null,
    earnest_money_planned: data.earnest_money_planned ?? null,
    projected_close_date: data.projected_close_date || null,
    notes: data.notes ?? null,
  };
}
