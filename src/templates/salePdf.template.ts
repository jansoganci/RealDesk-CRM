/**
 * Sale Contract PDF Template
 * Generates structured PDF content for sale contracts
 * Pattern based on working Rent PDF system
 */

import type { SaleContractFormData } from '@/features/contractsSale/schemas/saleContractForm.schema';
import type { PdfTemplate, TemplateGenerator } from '@/services/contractPdfEngine.service';
import {
  SATIS_SOZLESMESI_MADDELERI,
  SOZLESME_BASLIGI,
  TARAFLAR_BASLIGI,
  GAYRIMENKUL_BILGILERI_BASLIGI,
  SOZLESME_KONUSU_BASLIGI
} from './saleContractContent';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format value for display - returns '-' if empty/undefined
 */
function formatValue(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value);
}

// ============================================================================
// Template Generator
// ============================================================================

export const generateSalePdfTemplate: TemplateGenerator<SaleContractFormData> = (
  formData,
  instanceId
): PdfTemplate => {
  const contractNumber = instanceId.slice(0, 8).toUpperCase();

  return {
    metadata: {
      title: `Satış Sözleşmesi - ${contractNumber}`,
      author: 'Closewell',
      subject: 'Gayrimenkul Satış Sözleşmesi',
    },
    sections: [
      // ====== PAGE 1: TITLE & INFO TABLE ======
      {
        type: 'title',
        content: SOZLESME_BASLIGI,
        options: { fontSize: 14, bold: true, align: 'center' },
      },
      { type: 'spacer' },

      // SECTION 1: PARTIES
      {
        type: 'heading',
        content: TARAFLAR_BASLIGI,
        options: { fontSize: 12, bold: true },
      },
      {
        type: 'paragraph',
        content: '1.1.     ARACI:',
        options: { bold: true },
      },
      {
        type: 'table',
        data: [
          { label: 'İsim-Soyad (Şahıs)', value: formatValue(formData.agent_name) },
        ],
      },
      { type: 'spacer' },
      {
        type: 'paragraph',
        content: '1.2.     ALICI TARAF:',
        options: { bold: true },
      },
      {
        type: 'table',
        data: [
          { label: 'İsim-Soyad (Şahıs)', value: formatValue(formData.buyer_name) },
          { label: 'T.C Kimlik No', value: formatValue(formData.buyer_tc) },
        ],
      },
      { type: 'spacer' },
      {
        type: 'paragraph',
        content: '1.3.     SATICI TARAF:',
        options: { bold: true },
      },
      {
        type: 'table',
        data: [
          { label: 'İsim-Soyad (Şahıs)', value: formatValue(formData.seller_name) },
          { label: 'T.C Kimlik No', value: formatValue(formData.seller_tc) },
        ],
      },
      { type: 'spacer' },

      // SECTION: CONTRACT SUBJECT
      {
        type: 'heading',
        content: SOZLESME_KONUSU_BASLIGI,
        options: { fontSize: 12, bold: true },
      },
      {
        type: 'paragraph',
        content: SATIS_SOZLESMESI_MADDELERI[0],
      },
      { type: 'spacer' },

      // SECTION 2: PROPERTY INFO
      {
        type: 'heading',
        content: GAYRIMENKUL_BILGILERI_BASLIGI,
        options: { fontSize: 12, bold: true },
      },
      {
        type: 'table',
        data: [
          { label: 'İL/İLÇE :', value: formatValue(formData.province_district) },
          { label: 'MAHALLE :', value: formatValue(formData.neighborhood) },
          { label: 'ADA NO :', value: formatValue(formData.ada_no) },
          { label: 'PARSEL NO:', value: formatValue(formData.parsel_no) },
        ],
      },
      { type: 'spacer' },
      {
        type: 'paragraph',
        content: '1-Bu gayrimenkul ile ilgili taraflar yukarıda yazılı satış bedeli ve buna bağlı tüm konularda bir mutabakata varmıştır.',
      },
      {
        type: 'paragraph',
        content: `2-Alıcı ......................................... ....0.000 ₺ hizmet bedeli ödeyecektir.`,
      },
      {
        type: 'paragraph',
        content: `3-Satıcı ......................................... ....000 ₺ hizmet bedeli ödeyecektir.`,
      },
      {
        type: 'paragraph',
        content: '4-Resmi (devlet kanalı) yollarla ilgili herhangi bir sorunla karşılaşılması durumunda iki taraf içinde cezai işlem maddeleri geçersiz sayılacaktır, itiraz edilemeyecektir.',
      },
      {
        type: 'paragraph',
        content: '5-Alıcı satıştan, kendisinden kaynaklanmayan harici sebeplerden kaynaklanmadığı sürece satış işleminden vazgeçmesi durumunda ...00.000 ₺ cezai şart ödeyecektir.',
      },
      {
        type: 'paragraph',
        content: '6-Satıcı satıştan, kendisinden kaynaklanmayan harici sebeplerden kaynaklanmadığı sürece satış işleminden vazgeçmesi durumunda ...00.000 ₺ cezai şart ödeyecek ve alıcıdan alınan kapora geri iade edilecektir.',
      },
      {
        type: 'paragraph',
        content: '7-İmar affından tapulama yapılmasından dolayı süreç beklenecektir. Cayma durumunda 5. Ve 6. Maddelerde geçerli olacaktır.',
      },
      {
        type: 'paragraph',
        content: '8-Tapu masrafları alıcıya aittir.',
      },
      {
        type: 'paragraph',
        content: '9-Bu anlaşma 3 (üç) nüsha olarak düzenlenmiş olup, ilgili taraflarca imzalanarak uygulamaya konulmuştur. Her türlü uyuşmazlığın giderilmesine İstanbul Anadolu Mahkemeleri ve icra daireleri yetkilidir.',
      },
      { type: 'spacer' },
      { type: 'spacer' },

      // Signatures
      {
        type: 'signature',
        data: [
          { role: 'ALICI', name: formData.buyer_name },
          { role: 'YETKİLİ EMLAK. DANIŞMANI', name: '' },
          { role: 'SATICI', name: formData.seller_name },
        ],
      },
    ],
  };
};
