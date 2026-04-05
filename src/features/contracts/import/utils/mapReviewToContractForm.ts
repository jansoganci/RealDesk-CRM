import { contractFormDefaultValues } from '@/features/contracts/schemas/contractForm.schema';
import type { ContractFormData } from '@/types/contract.types';
import type { ReviewFormData } from '../types/reviewFormTypes';

/**
 * Maps import review step data into the full contract form shape for RPC creation.
 */
export function mapReviewToContractForm(formData: ReviewFormData): ContractFormData {
  const rentRaw = formData.rent_amount;
  const depRaw = formData.deposit;
  const rent = typeof rentRaw === 'string' ? parseFloat(rentRaw) : Number(rentRaw);
  const deposit = typeof depRaw === 'string' ? parseFloat(depRaw) : Number(depRaw);

  const pt = formData.property_type?.toLowerCase() ?? '';
  const property_type: ContractFormData['property_type'] =
    pt === 'house' || pt === 'villa' ? 'house' :
    pt === 'commercial' || pt === 'işyeri' ? 'commercial' :
    'apartment';

  const defaults = contractFormDefaultValues as ContractFormData;

  return {
    ...defaults,
    owner_name: formData.owner_name,
    owner_tax_id: formData.owner_tax_id || '',
    owner_routing_number: formData.owner_routing_number || '',
    owner_account_number: formData.owner_account_number || '',
    owner_phone: formData.owner_phone,
    owner_email: formData.owner_email || '',
    tenant_name: formData.tenant_name,
    tenant_tax_id: formData.tenant_tax_id || '',
    tenant_phone: formData.tenant_phone,
    tenant_email: formData.tenant_email || '',
    tenant_address: formData.tenant_address,
    street_address: formData.street_address || '',
    unit: formData.unit || '',
    city: formData.city || '',
    state: formData.state || '',
    zip_code: formData.zip_code || '',
    property_type,
    use_purpose: formData.use_purpose || '',
    start_date: formData.start_date ? new Date(formData.start_date) : new Date(),
    end_date: formData.end_date ? new Date(formData.end_date) : new Date(),
    rent_amount: Number.isFinite(rent) ? rent : 0,
    deposit: Number.isFinite(deposit) ? deposit : 0,
    currency: 'USD',
    payment_day_of_month: formData.payment_day_of_month,
    payment_method: formData.payment_method || '',
    special_conditions: formData.special_conditions || '',
    is_painted: formData.is_painted ?? false,
    handover_photos_url: '',
    clauseOverrides: [],
  };
}
