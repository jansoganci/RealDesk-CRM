import type { Contract, KeyDatesData, PurchaseDetails } from '@/types';

export function buildKeyDatesFromPurchase(contract: Contract, pd: PurchaseDetails): KeyDatesData {
  return {
    effective_date: contract.effective_date ?? null,
    earnest_money_due_date: contract.earnest_money_due_date ?? null,
    bank_preapproval_letter_date: pd.bank_preapproval_letter_date,
    inspection_contractor_deadline_date: pd.inspection_contractor_deadline_date,
    inspection_disclosures_deadline_date: pd.inspection_disclosures_deadline_date,
    closing_date: contract.closing_date ?? null,
    offer_expiration_date: pd.offer_expiration_date,
  };
}
