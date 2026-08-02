import type { DealFormData } from '@/features/deals/schemas/dealFormSchema';
import type { LeadWithRelations, ShowingLog } from '@/services/leads.service';
import type { Property } from '@/types';

export type LeadDealDefaultsSource = Pick<
  LeadWithRelations,
  'id' | 'name' | 'inquiry_type' | 'pre_approved' | 'notes'
> & {
  buyer_agent_agreement?: Pick<NonNullable<LeadWithRelations['buyer_agent_agreement']>, 'id'>;
};

export interface DealPropertyMatch {
  property_id: string;
  property?: Pick<Property, 'address' | 'property_type' | 'rent_amount' | 'sale_price' | 'status'>;
}

export function buildDefaultsFromLead(lead: LeadDealDefaultsSource): DealFormData {
  const dealType = lead.inquiry_type === 'rental' ? 'rental' : 'sale';

  let preapprovalStatus: DealFormData['preapproval_status'] = null;
  if (lead.pre_approved === true) preapprovalStatus = 'approved';
  else if (lead.pre_approved === false) preapprovalStatus = 'not_started';

  return {
    deal_name: `${lead.name} — ${dealType === 'sale' ? 'Purchase' : 'Lease'}`,
    deal_type: dealType,
    client_role: 'buyer',
    user_id: null,
    property_id: null,
    property_snapshot: null,
    financing_type: null,
    preapproval_status: preapprovalStatus,
    buyer_agent_agreement_id: lead.buyer_agent_agreement?.id ?? null,
    list_price: null,
    intended_offer_price: null,
    earnest_money_planned: null,
    projected_close_date: null,
    notes: lead.notes ?? null,
    lead_id: lead.id,
    deal_stage: undefined,
  };
}

type ShowingForDefaults = Pick<ShowingLog, 'property_id' | 'showing_date'>;

function latestShowing(showings: ShowingForDefaults[]): ShowingForDefaults | undefined {
  return showings.reduce<ShowingForDefaults | undefined>((latest, showing) => {
    if (!latest) return showing;
    return new Date(showing.showing_date).getTime() > new Date(latest.showing_date).getTime()
      ? showing
      : latest;
  }, undefined);
}

export function getDefaultPropertyMatch<T extends DealPropertyMatch>(
  matches: T[],
  showings: ShowingForDefaults[]
): T | undefined {
  const latestPropertyId = latestShowing(showings)?.property_id;
  return matches.find((match) => match.property_id === latestPropertyId) ?? matches[0];
}

export function getMatchedPropertyPrice(match: DealPropertyMatch): number | null {
  const property = match.property;
  if (!property) return null;
  return property.property_type === 'rental'
    ? property.rent_amount ?? null
    : property.sale_price ?? null;
}

export function isEligiblePropertyMatch(
  match: DealPropertyMatch,
  inquiryType: LeadWithRelations['inquiry_type']
): boolean {
  const property = match.property;
  if (!property || property.property_type !== inquiryType) return false;
  return inquiryType === 'sale'
    ? property.status === 'Available'
    : property.status === 'Empty';
}

export function applyPropertyMatchDefaults(
  values: DealFormData,
  lead: LeadDealDefaultsSource,
  match: DealPropertyMatch
): DealFormData {
  const property = match.property;
  const price = getMatchedPropertyPrice(match);

  return {
    ...values,
    deal_name: property?.address ? `${lead.name} — ${property.address}` : values.deal_name,
    property_id: match.property_id,
    property_snapshot: null,
    list_price: price,
    intended_offer_price: price,
  };
}
