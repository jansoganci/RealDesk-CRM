/**
 * Sales Contract Template Content
 * Template with placeholder variables for sale contracts
 */

export const SALE_CONTRACT_TEMPLATE_CONTENT = `GAYRIMENKUL SATIS SOZLESMESI

SOZLESME TARIHI: {{contract_date}}

TARAFLAR

SATICI:
Ad Soyad: {{seller_name}}
TC Kimlik No: {{seller_tc}}
Telefon: {{seller_phone}}
E-posta: {{seller_email}}
Adres: {{seller_address}}

ALICI:
Ad Soyad: {{buyer_name}}
TC Kimlik No: {{buyer_tc}}
Telefon: {{buyer_phone}}
E-posta: {{buyer_email}}
Adres: {{buyer_address}}

SATIS KONUSU TASINMAZ

Adres: {{property_address}}
Tapu Sicil No: {{title_deed_no}}
Ada/Parsel: {{parcel_info}}
Brut Alan: {{square_meters}} m2

SATIS SARTLARI

Satis Bedeli: {{sale_price}} {{currency}}
Odeme Yontemi: {{payment_method_label}}
Kapora Tutari: {{deposit_amount}} {{currency}}
Tapu Devir Tarihi: {{closing_date}}

OZEL SARTLAR

{{special_conditions}}

GENEL HUKUMLER

1. Satici, sozlesme konusu tasinmazin mulkiyetinin kendisine ait oldugunu, tasinmaz uzerinde herhangi bir ipotek, haciz, serhuye veya ucuncu sahislarin herhangi bir hakki bulunmadigini beyan ve taahhut eder.

2. Alici, belirlenen satis bedelini sozlesme sartlarina uygun olarak odemeyi kabul ve taahhut eder.

3. Tapu devir islemleri, sozlesmede belirtilen tarihte taraflarin mutabakatida ile gerceklestirilecektir.

4. Tasinmazin teslimi, tapu devir islemlerinin tamamlanmasini takiben gerceklestirilecektir.

5. Taraflardan herhangi birinin sozlesme sartlarina uymamasi halinde, diger taraf bu sozlesmeyi feshetme ve zararin tazminini talep etme hakkina sahiptir.

6. Bu sozlesmeden dogan uyusmazliklarda Istanbul Mahkemeleri ve Icra Daireleri yetkilidir.

7. Bu sozlesme 2 (iki) nushu olarak duzenlenmis ve taraflarca okunarak imza altina alinmistir.

IMZALAR

SATICI                           ALICI
{{seller_name}}                  {{buyer_name}}

Tarih: {{contract_date}}         Tarih: {{contract_date}}
`;

/**
 * Replace placeholders in template with actual values
 */
export function replacePlaceholders(
  template: string,
  data: Record<string, string | number | undefined>
): string {
  let result = template;

  // Payment method labels
  const paymentMethodLabels: Record<string, string> = {
    cash: 'Nakit',
    bank_transfer: 'Havale/EFT',
    installment: 'Taksit',
    mortgage: 'Kredi',
  };

  // Add payment method label
  if (data.payment_method) {
    data.payment_method_label = paymentMethodLabels[String(data.payment_method)] || String(data.payment_method);
  }

  // Replace all placeholders
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(placeholder, value !== undefined && value !== '' ? String(value) : '-');
  }

  // Clean up any remaining placeholders
  result = result.replace(/\{\{[^}]+\}\}/g, '-');

  return result;
}
