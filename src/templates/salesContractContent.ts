/**
 * Sales Contract Template Content
 * Template with placeholder variables for sale contracts
 * Format: Based on "TAŞINMAZ ALIM-SATIM VE HİZMET SÖZLEŞMESİ"
 */

export const SALE_CONTRACT_TEMPLATE_CONTENT = `TAŞINMAZ ALIM-SATIM VE HİZMET SÖZLEŞMESİ

1. TARAFLAR:

1.1.     ARACI:

İsim-Soyad (Şahıs): {{agent_name}}

1.2.     ALICI TARAF:

İsim-Soyad (Şahıs): {{buyer_name}}
T.C Kimlik No: {{buyer_tc}}

1.3.     SATICI TARAF:

İsim-Soyad (Şahıs): {{seller_name}}
T.C Kimlik No: {{seller_tc}}

1. SÖZLEŞMENİN KONUSU

İşbu sözleşmenin konusu, Satıcı'nın maliki olduğu ya da satışı konusunda yetkili olduğu taşınmazın satış işlemini gerçekleştirmek için Aracı'nın vereceği tanıtım, pazarlama ve aracılık hizmetlerine ilişkin faaliyetleri sonucunda Satıcı ile Alıcı arasında Sözleşmeye konu işi satış şarhasına kadar getirme, gerçekleştireceği bu hizmetlere mukabil Satıcı ile Alıcı tarafından Aracı'ya ödenecek hizmet bedeli ile ilgili yükümlüleri düzenlemektedir.

2. GAYRİMENKULE İLİŞKİN BİLGİLER:

İL/İLÇE :      {{province_district}}
MAHALLE :      {{neighborhood}}
ADA NO :       {{ada_no}}
PARSEL NO:     {{parsel_no}}

1-Bu gayrimenkul ile ilgili taraflar yukarıda yazılı satış bedeli ve buna bağlı tüm konularda bir mutabakata varmıştır.

2-Alıcı ......................................... ....0.000 ₺ hizmet bedeli ödeyecektir.

3-Satıcı ......................................... ....000 ₺ hizmet bedeli ödeyecektir.

4-Resmi (devlet kanalı) yollarla ilgili herhangi bir sorunla karşılaşılması durumunda iki taraf içinde cezai işlem maddeleri geçersiz sayılacaktır, itiraz edilemeyecektir.

5-Alıcı satıştan, kendisinden kaynaklanmayan harici sebeplerden kaynaklanmadığı sürece satış işleminden vazgeçmesi durumunda ...00.000 ₺ cezai şart ödeyecektir.

6-Satıcı satıştan, kendisinden kaynaklanmayan harici sebeplerden kaynaklanmadığı sürece satış işleminden vazgeçmesi durumunda ...00.000 ₺ cezai şart ödeyecek ve alıcıdan alınan kapora geri iade edilecektir.

7-İmar affından tapulama yapılmasından dolayı süreç beklenecektir. Cayma durumunda 5. Ve 6. Maddelerde geçerli olacaktır.

8-Tapu masrafları alıcıya aittir.

9-Bu anlaşma 3 (üç) nüsha olarak düzenlenmiş olup, ilgili taraflarca imzalanarak uygulamaya konulmuştur. Her türlü uyuşmazlığın giderilmesine İstanbul Anadolu Mahkemeleri ve icra daireleri yetkilidir.


ALICI                           YETKİLİ EMLAK. DANIŞMANI                    SATICI

{{buyer_name}}                                                              {{seller_name}}



İmza Tarihi: {{contract_date}}
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
