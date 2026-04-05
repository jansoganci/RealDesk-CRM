/**
 * Test Contract Data - US Market Version
 *
 * Sample contract data for development and testing purposes.
 * Used by fillTestData() in ContractCreateForm.tsx
 */

import { toast } from 'sonner';
import type { UseFormReturn } from 'react-hook-form';
import type { ContractFormData } from '@/types/contract.types';

// ============================================================================
// Types
// ============================================================================

export interface TestContractData {
  owner: {
    name: string;
    taxId: string; // EIN or Tax ID (Optional for V1)
    phone: string;
    email: string;
    routingNumber: string;
    accountNumber: string;
  };
  tenant: {
    name: string;
    taxId: string;
    phone: string;
    email: string;
    permanentAddress: string;
  };
  property: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
    type: 'apartment' | 'house' | 'condo' | 'townhouse';
  };
  contract: {
    rent: string;
    deposit: string;
    paymentDay: string;
    conditions: string;
  };
}

/** Maps US sample property labels to the contract form enum. */
function mapTestPropertyTypeToForm(
  type: TestContractData['property']['type']
): ContractFormData['property_type'] {
  if (type === 'house' || type === 'townhouse') return 'house';
  if (type === 'condo' || type === 'apartment') return 'apartment';
  return 'apartment';
}

/** Valid ABA routing (checksum) for test fills */
const TEST_ROUTING = '021000021';

// ============================================================================
// Test Data (US Samples)
// ============================================================================

export const TEST_CONTRACTS: TestContractData[] = [
  {
    owner: {
      name: 'John Smith',
      taxId: '12-3456789',
      phone: '(512) 555-0101',
      email: 'jsmith.properties@example.com',
      routingNumber: TEST_ROUTING,
      accountNumber: '88223344',
    },
    tenant: {
      name: 'Michael Chen',
      taxId: '98-7654321',
      phone: '(512) 555-0202',
      email: 'm.chen88@example.com',
      permanentAddress: '4502 West Ave, San Antonio, TX 78213',
    },
    property: {
      street: '1201 Spyglass Dr',
      unit: '304',
      city: 'Austin',
      state: 'TX',
      zip: '78746',
      type: 'apartment',
    },
    contract: {
      rent: '2450',
      deposit: '2450',
      paymentDay: '1',
      conditions: 'No smoking. Pet deposit of $500 required.',
    },
  },
  {
    owner: {
      name: 'Sarah Johnson',
      taxId: '45-9988776',
      phone: '(305) 555-1122',
      email: 's.johnson@realestate.com',
      routingNumber: TEST_ROUTING,
      accountNumber: '11223344',
    },
    tenant: {
      name: 'David Rodriguez',
      taxId: '11-2223334',
      phone: '(305) 555-3344',
      email: 'drod_miami@example.com',
      permanentAddress: '888 Brickell Ave, Miami, FL 33131',
    },
    property: {
      street: '420 Ocean Drive',
      unit: 'PH2',
      city: 'Miami Beach',
      state: 'FL',
      zip: '33139',
      type: 'condo',
    },
    contract: {
      rent: '5800',
      deposit: '11600',
      paymentDay: '1',
      conditions: 'Full service building. Includes 2 parking spots.',
    },
  },
  {
    owner: {
      name: 'Robert Wilson',
      taxId: '55-4433221',
      phone: '(615) 555-9876',
      email: 'bwilson@example.com',
      routingNumber: TEST_ROUTING,
      accountNumber: '99887766',
    },
    tenant: {
      name: 'Emily Davis',
      taxId: '66-7778889',
      phone: '(615) 555-4433',
      email: 'emily.davis@example.com',
      permanentAddress: '120 2nd Ave N, Nashville, TN 37201',
    },
    property: {
      street: '714 Sweetgum Lane',
      city: 'Nashville',
      state: 'TN',
      zip: '37206',
      type: 'house',
    },
    contract: {
      rent: '3200',
      deposit: '3200',
      paymentDay: '5',
      conditions: 'Tenant responsible for landscaping and utilities.',
    },
  },
  {
    owner: {
      name: 'James Miller',
      taxId: '22-3334445',
      phone: '(206) 555-6677',
      email: 'jmiller@example.com',
      routingNumber: TEST_ROUTING,
      accountNumber: '55446677',
    },
    tenant: {
      name: 'Jessica Taylor',
      taxId: '33-4445556',
      phone: '(206) 555-8899',
      email: 'jtaylor@example.com',
      permanentAddress: '1901 4th Ave, Seattle, WA 98101',
    },
    property: {
      street: '550 Terry Ave N',
      unit: '1210',
      city: 'Seattle',
      state: 'WA',
      zip: '98109',
      type: 'apartment',
    },
    contract: {
      rent: '2950',
      deposit: '1500',
      paymentDay: '1',
      conditions: 'Renters insurance required. 12-month lease.',
    },
  },
  {
    owner: {
      name: 'Linda Martinez',
      taxId: '88-7776665',
      phone: '(602) 555-4321',
      email: 'lmartinez@example.com',
      routingNumber: TEST_ROUTING,
      accountNumber: '22331100',
    },
    tenant: {
      name: 'William Brown',
      taxId: '77-6665554',
      phone: '(602) 555-1234',
      email: 'wbrown@example.com',
      permanentAddress: '1 N Central Ave, Phoenix, AZ 85004',
    },
    property: {
      street: '1422 E Camelback Rd',
      city: 'Phoenix',
      state: 'AZ',
      zip: '85014',
      type: 'townhouse',
    },
    contract: {
      rent: '2100',
      deposit: '2100',
      paymentDay: '1',
      conditions: 'Access to community pool included.',
    },
  }
];

// ============================================================================
// Utility Function
// ============================================================================

/**
 * Fill form with random US test contract data
 * Only available in development mode
 */
export function fillFormWithTestData(form: UseFormReturn<ContractFormData>): void {
  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  // Random pick one from US samples
  const randomIndex = Math.floor(Math.random() * TEST_CONTRACTS.length);
  const data = TEST_CONTRACTS[randomIndex];

  // Owner fields (US localized)
  form.setValue('owner_name', data.owner.name);
  form.setValue('owner_tax_id', data.owner.taxId);
  form.setValue('owner_phone', data.owner.phone);
  form.setValue('owner_email', data.owner.email);
  form.setValue('owner_routing_number', data.owner.routingNumber);
  form.setValue('owner_account_number', data.owner.accountNumber);

  // Tenant fields (US localized)
  form.setValue('tenant_name', data.tenant.name);
  form.setValue('tenant_tax_id', data.tenant.taxId);
  form.setValue('tenant_phone', data.tenant.phone);
  form.setValue('tenant_email', data.tenant.email);
  form.setValue('tenant_address', data.tenant.permanentAddress);

  // Property fields (US standard: street, unit, city, state, zip)
  form.setValue('street_address', data.property.street);
  form.setValue('unit', data.property.unit || '');
  form.setValue('city', data.property.city);
  form.setValue('state', data.property.state);
  form.setValue('zip_code', data.property.zip);
  form.setValue('property_type', mapTestPropertyTypeToForm(data.property.type));

  // Contract fields
  form.setValue('start_date', today);
  form.setValue('end_date', oneYearLater);
  form.setValue('rent_amount', parseFloat(data.contract.rent));
  form.setValue('deposit', parseFloat(data.contract.deposit));
  form.setValue('currency', 'USD'); // V1 is USD only
  form.setValue('payment_day_of_month', parseInt(data.contract.paymentDay, 10));
  form.setValue('special_conditions', data.contract.conditions);
  
  // US specific disclosures / defaults
  form.setValue('is_painted', true);
  
  toast.success(`Loaded test data: ${data.property.city} - ${data.owner.name}`);
}