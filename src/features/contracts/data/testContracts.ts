/**
 * Test Contract Data
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
    tc: string;
    phone: string;
    email: string;
    iban: string;
  };
  tenant: {
    name: string;
    tc: string;
    phone: string;
    email: string;
    address: string;
  };
  property: {
    mahalle: string;
    cadde: string;
    bina: string;
    daire: string;
    ilce: string;
    il: string;
    type: string;
  };
  contract: {
    rent: string;
    deposit: string;
    paymentDay: string;
    conditions: string;
  };
}

// ============================================================================
// Test Data
// ============================================================================

export const TEST_CONTRACTS: TestContractData[] = [
  {
    owner: { name: 'Ahmet Yılmaz', tc: '12345678901', phone: '0555 123 45 67', email: 'ahmet@example.com', iban: 'TR330006100519786457841326' },
    tenant: { name: 'Mehmet Demir', tc: '98765432109', phone: '0532 987 65 43', email: 'mehmet@example.com', address: 'Koşuyolu Mah, Kadıköy, İstanbul' },
    property: { mahalle: 'Moda', cadde: 'Bahariye Caddesi', bina: '123', daire: '5', ilce: 'Kadıköy', il: 'İstanbul', type: 'Daire' },
    contract: { rent: '15000', deposit: '30000', paymentDay: '1', conditions: 'Aidat ve faturalar kiracıya aittir.' }
  },
  {
    owner: { name: 'Ayşe Kaya', tc: '23456789012', phone: '0532 234 56 78', email: 'ayse@example.com', iban: 'TR440006200519786457841327' },
    tenant: { name: 'Zeynep Arslan', tc: '87654321098', phone: '0533 876 54 32', email: 'zeynep@example.com', address: 'Cihangir Mah, Beyoğlu, İstanbul' },
    property: { mahalle: 'Cihangir', cadde: 'Sıraselviler Caddesi', bina: '45', daire: '12', ilce: 'Beyoğlu', il: 'İstanbul', type: 'Daire' },
    contract: { rent: '22000', deposit: '44000', paymentDay: '5', conditions: 'Evcil hayvan beslenemez.' }
  },
  {
    owner: { name: 'Mustafa Öztürk', tc: '34567890123', phone: '0544 345 67 89', email: 'mustafa@example.com', iban: 'TR550006300519786457841328' },
    tenant: { name: 'Can Yıldız', tc: '76543210987', phone: '0535 765 43 21', email: 'can@example.com', address: 'Etiler Mah, Beşiktaş, İstanbul' },
    property: { mahalle: 'Etiler', cadde: 'Nispetiye Caddesi', bina: '78', daire: '3', ilce: 'Beşiktaş', il: 'İstanbul', type: 'Daire' },
    contract: { rent: '35000', deposit: '70000', paymentDay: '10', conditions: 'Mobilyalı kiralama.' }
  },
  {
    owner: { name: 'Fatma Çelik', tc: '45678901234', phone: '0536 456 78 90', email: 'fatma@example.com', iban: 'TR660006400519786457841329' },
    tenant: { name: 'Deniz Aydın', tc: '65432109876', phone: '0537 654 32 10', email: 'deniz@example.com', address: 'Acıbadem Mah, Üsküdar, İstanbul' },
    property: { mahalle: 'Acıbadem', cadde: 'Acıbadem Caddesi', bina: '90', daire: '8', ilce: 'Üsküdar', il: 'İstanbul', type: 'Daire' },
    contract: { rent: '18000', deposit: '36000', paymentDay: '15', conditions: 'Sigara içilmez.' }
  },
  {
    owner: { name: 'Hasan Şahin', tc: '56789012345', phone: '0538 567 89 01', email: 'hasan@example.com', iban: 'TR770006500519786457841330' },
    tenant: { name: 'Ece Polat', tc: '54321098765', phone: '0539 543 21 09', email: 'ece@example.com', address: 'Fenerbahçe Mah, Kadıköy, İstanbul' },
    property: { mahalle: 'Fenerbahçe', cadde: 'Bağdat Caddesi', bina: '234', daire: '15', ilce: 'Kadıköy', il: 'İstanbul', type: 'Daire' },
    contract: { rent: '28000', deposit: '56000', paymentDay: '3', conditions: 'Deniz manzaralı.' }
  },
  {
    owner: { name: 'Emine Akar', tc: '67890123456', phone: '0541 678 90 12', email: 'emine@example.com', iban: 'TR880006600519786457841331' },
    tenant: { name: 'Burak Koç', tc: '43210987654', phone: '0542 432 10 98', email: 'burak@example.com', address: 'Nişantaşı Mah, Şişli, İstanbul' },
    property: { mahalle: 'Nişantaşı', cadde: 'Teşvikiye Caddesi', bina: '56', daire: '7', ilce: 'Şişli', il: 'İstanbul', type: 'Daire' },
    contract: { rent: '45000', deposit: '90000', paymentDay: '1', conditions: 'Lüks rezidans.' }
  },
  {
    owner: { name: 'Ali Bulut', tc: '78901234567', phone: '0543 789 01 23', email: 'ali@example.com', iban: 'TR990006700519786457841332' },
    tenant: { name: 'Selin Yurt', tc: '32109876543', phone: '0545 321 09 87', email: 'selin@example.com', address: 'Suadiye Mah, Kadıköy, İstanbul' },
    property: { mahalle: 'Suadiye', cadde: 'Plaj Yolu', bina: '12', daire: '2', ilce: 'Kadıköy', il: 'İstanbul', type: 'Daire' },
    contract: { rent: '32000', deposit: '64000', paymentDay: '7', conditions: 'Kapalı otopark mevcut.' }
  },
  {
    owner: { name: 'Mehmet Aydın', tc: '89012345678', phone: '0546 890 12 34', email: 'mehmet2@example.com', iban: 'TR110006800519786457841333' },
    tenant: { name: 'Aylin Kara', tc: '21098765432', phone: '0547 210 98 76', email: 'aylin@example.com', address: 'Bebek Mah, Beşiktaş, İstanbul' },
    property: { mahalle: 'Bebek', cadde: 'Cevdetpaşa Caddesi', bina: '89', daire: '4', ilce: 'Beşiktaş', il: 'İstanbul', type: 'Daire' },
    contract: { rent: '55000', deposit: '110000', paymentDay: '1', conditions: 'Boğaz manzaralı, yüzme havuzu.' }
  },
  {
    owner: { name: 'Zehra Tunç', tc: '90123456789', phone: '0548 901 23 45', email: 'zehra@example.com', iban: 'TR220006900519786457841334' },
    tenant: { name: 'Kerem Şen', tc: '10987654321', phone: '0549 109 87 65', email: 'kerem@example.com', address: 'Yeşilköy Mah, Bakırköy, İstanbul' },
    property: { mahalle: 'Yeşilköy', cadde: 'Sahil Yolu', bina: '67', daire: '9', ilce: 'Bakırköy', il: 'İstanbul', type: 'Daire' },
    contract: { rent: '20000', deposit: '40000', paymentDay: '12', conditions: 'Havaalanına yakın.' }
  },
  {
    owner: { name: 'İsmail Eren', tc: '01234567890', phone: '0551 012 34 56', email: 'ismail@example.com', iban: 'TR330007000519786457841335' },
    tenant: { name: 'Merve Taş', tc: '09876543210', phone: '0552 098 76 54', email: 'merve@example.com', address: 'Levent Mah, Beşiktaş, İstanbul' },
    property: { mahalle: 'Levent', cadde: 'Büyükdere Caddesi', bina: '101', daire: '20', ilce: 'Beşiktaş', il: 'İstanbul', type: 'Daire' },
    contract: { rent: '38000', deposit: '76000', paymentDay: '5', conditions: 'İş merkezine yakın, güvenlik.' }
  }
];

// ============================================================================
// Utility Function
// ============================================================================

/**
 * Fill form with random test contract data
 * Only available in development mode
 */
export function fillFormWithTestData(form: UseFormReturn<ContractFormData>): void {
  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  // Random pick one
  const randomIndex = Math.floor(Math.random() * TEST_CONTRACTS.length);
  const data = TEST_CONTRACTS[randomIndex];

  // Owner fields
  form.setValue('owner_name', data.owner.name);
  form.setValue('owner_tc', data.owner.tc);
  form.setValue('owner_phone', data.owner.phone);
  form.setValue('owner_email', data.owner.email);
  form.setValue('owner_iban', data.owner.iban);

  // Tenant fields
  form.setValue('tenant_name', data.tenant.name);
  form.setValue('tenant_tc', data.tenant.tc);
  form.setValue('tenant_phone', data.tenant.phone);
  form.setValue('tenant_email', data.tenant.email);
  form.setValue('tenant_address', data.tenant.address);

  // Property fields
  form.setValue('mahalle', data.property.mahalle);
  form.setValue('cadde_sokak', data.property.cadde);
  form.setValue('bina_no', data.property.bina);
  form.setValue('daire_no', data.property.daire);
  form.setValue('ilce', data.property.ilce);
  form.setValue('il', data.property.il);
  form.setValue('property_type', data.property.type as 'apartment' | 'house' | 'commercial');
  form.setValue('use_purpose', 'Mesken');

  // Contract fields
  form.setValue('start_date', today);
  form.setValue('end_date', oneYearLater);
  form.setValue('rent_amount', parseFloat(data.contract.rent));
  form.setValue('deposit', parseFloat(data.contract.deposit));
  form.setValue('payment_day_of_month', parseInt(data.contract.paymentDay));
  form.setValue('payment_method', 'Banka Transferi');
  form.setValue('special_conditions', data.contract.conditions);

  toast.success(`Test verileri dolduruldu! (${data.owner.name} - ${data.property.mahalle})`);
}
