/**
 * Contract PDF Generation Service - jsPDF Version
 * Generates Turkish rental contract PDF using jsPDF + jspdf-autotable
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ContractPdfData } from '@/types/contract.types';
import { GENEL_SARTLAR, OZEL_SARTLAR, TAHLIYE_TAAHHUTNAMESI_TEXT } from '@/templates/contractContent';
import { addTurkishFonts, setFontBold, setFontNormal } from './pdfFonts';
import { clausesService } from './clauses.service';

// PDF Configuration
const PDF_CONFIG = {
  orientation: 'portrait' as const,
  unit: 'mm' as const,
  format: 'a4' as const,
  margins: {
    top: 15,
    right: 15,
    bottom: 15,
    left: 15
  },
  fontSize: {
    title: 14,
    subtitle: 12,
    body: 10,
    small: 9
  },
  lineHeight: 1.4
};

/**
 * Get currency symbol for display
 */
function getCurrencySymbol(currency: 'TRY' | 'USD' | 'EUR'): string {
  switch (currency) {
    case 'TRY':
      return '₺';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    default:
      return '₺';
  }
}

/**
 * Get currency text in Turkish for display
 */
function getCurrencyText(currency: 'TRY' | 'USD' | 'EUR'): string {
  switch (currency) {
    case 'TRY':
      return 'TÜRK LİRASI';
    case 'USD':
      return 'AMERİKAN DOLARI';
    case 'EUR':
      return 'EURO';
    default:
      return 'TÜRK LİRASI';
  }
}

/**
 * Translate property type from English enum to Turkish
 * Maps database enum values to Turkish labels for PDF display
 */
function translatePropertyType(propertyType: string): string {
  const normalizedType = propertyType?.toLowerCase().trim();
  
  switch (normalizedType) {
    case 'apartment':
      return 'Daire';
    case 'house':
    case 'detached_house':
    case 'müstakil':
      return 'Müstakil Ev';
    case 'commercial':
    case 'workplace':
    case 'işyeri':
      return 'İşyeri';
    case 'villa':
      return 'Villa';
    case 'office':
    case 'ofis':
      return 'Ofis';
    case 'shop':
    case 'dükkan':
      return 'Dükkan';
    case 'warehouse':
    case 'depo':
      return 'Depo';
    default:
      // If already in Turkish or unknown, return as-is (fallback)
      // This handles cases where the value might already be translated
      return propertyType || 'Daire';
  }
}

/**
 * Generate contract PDF and download
 */
export async function generateContractPDF(data: ContractPdfData): Promise<void> {
  const blob = await generateContractPDFBlob(data);
  
  // Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Kira_Sozlesmesi_${data.contractNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate contract PDF blob (for storage upload)
 * @param data - PDF data
 * @param contractId - Optional contract ID to fetch custom clauses
 */
export async function generateContractPDFBlob(
  data: ContractPdfData,
  contractId?: string
): Promise<Blob> {
  const doc = new jsPDF(PDF_CONFIG);

  // Add Turkish font support
  addTurkishFonts(doc);

  // ============================================================================
  // Fetch merged clauses (templates + overrides) from database
  // ============================================================================
  let genelSartlar: string[] = GENEL_SARTLAR;
  let ozelSartlar: string[] = OZEL_SARTLAR;
  let tahliyeText: string = TAHLIYE_TAAHHUTNAMESI_TEXT;

  if (contractId) {
    // Fetch merged clauses from database (templates + overrides)
    // This is called AFTER Phase 6 saves overrides, so database has latest data
    const merged = await clausesService.getMergedClauses(contractId);

    // Build template variable map
    const variables = {
      paymentDay: data.paymentDay,
      ownerIBAN: data.ownerIBAN,
      ownerName: data.ownerName,
      tenantName: data.tenantName,
      contractDate: data.contractDate,
    };

    // Extract by type, sort, replace variables
    genelSartlar = merged
      .filter((c) => c.clause_type === 'GENEL_SARTLAR')
      .sort((a, b) => a.clause_index - b.clause_index)
      .map((c) => clausesService.replaceVariables(c.content, variables));

    ozelSartlar = merged
      .filter((c) => c.clause_type === 'OZEL_SARTLAR')
      .sort((a, b) => a.clause_index - b.clause_index)
      .map((c) => clausesService.replaceVariables(c.content, variables));

    const tahliyeClauses = merged
      .filter((c) => c.clause_type === 'TAHLIYE_TAAHHUTNAMESI')
      .sort((a, b) => a.clause_index - b.clause_index);

    if (tahliyeClauses.length > 0) {
      tahliyeText = clausesService.replaceVariables(tahliyeClauses[0].content, variables);
    }

    // Note: If getMergedClauses() throws, error propagates to caller
    // UI layer (useContractPdfHandler) will catch and show toast
  }

  // Sayfa 1: Bilgi Tablosu
  renderPage1_InfoTable(doc, data);

  // Sayfa 2: Genel Şartlar
  doc.addPage();
  renderPage2_GenelSartlar(doc, genelSartlar);

  // Sayfa 3-4: Özel Şartlar
  doc.addPage();
  renderPage3_4_OzelSartlar(doc, data, ozelSartlar);
  
  // Sayfa 5: Tahliye Taahhütnamesi
  doc.addPage();
  renderPage5_TahliyeTaahhutnamesi(doc, data, tahliyeText);
  
  // Generate blob
  const pdfBlob = doc.output('blob');
  
  // Size check
  if (pdfBlob.size < 10000) {
    console.error('PDF too small! Size:', pdfBlob.size);
    throw new Error('PDF generation failed - output too small');
  }
  
  console.log('PDF generated successfully. Size:', pdfBlob.size, 'bytes');
  return pdfBlob;
}

// ============================================================================
// PAGE 1: INFO TABLE
// ============================================================================
function renderPage1_InfoTable(doc: jsPDF, data: ContractPdfData): void {
  const { margins, fontSize } = PDF_CONFIG;
  let y = margins.top;
  
  // Title
  doc.setFontSize(fontSize.title);
  setFontBold(doc);
  doc.text('KİRA SÖZLEŞMESİ', doc.internal.pageSize.width / 2, y, { align: 'center' });
  y += 15;
  
  // Build owner and tenant info with TC on same line
  const ownerInfo = data.ownerTC
    ? `${data.ownerName} - T.C.: ${data.ownerTC}`
    : data.ownerName;
  const tenantInfo = data.tenantTC
    ? `${data.tenantName} - T.C.: ${data.tenantTC}`
    : data.tenantName;

  // Main info table
  const tableData = [
    ['NUMARASI', data.contractNumber],
    ['MAHALLESİ/İLÇE/İL', `${data.mahalle} / ${data.ilce} / ${data.il}`],
    ['SOKAĞI/NUMARASI', `${data.sokak} No: ${data.binaNo} Daire: ${data.daireNo}`],
    ['KİRALANAN ŞEYİN CİNSİ', translatePropertyType(data.propertyType)],
    ['KİRAYA VERENİN ADI SOYADI', ownerInfo],
    ['KİRACININ ADI SOYADI', tenantInfo],
    ['KİRACININ İKAMETGAHI', data.tenantAddress],
    ['KİRACININ TELEFONU', data.tenantPhone],
    ['BİR AYLIK KİRA KARŞILIĞI', `${data.monthlyRentNumber.toLocaleString('tr-TR')} ${getCurrencySymbol(data.currency)} (${data.monthlyRentText} ${getCurrencyText(data.currency)})`],
    ['BİR SENELİK KİRA KARŞILIĞI', `${data.yearlyRentNumber.toLocaleString('tr-TR')} ${getCurrencySymbol(data.currency)} (${data.yearlyRentText} ${getCurrencyText(data.currency)})`],
    ['KİRANIN NE ŞEKİLDE ÖDENECEĞİ', `IBAN: ${data.ownerIBAN}`],
    ['KİRA MÜDDETİ', '1 YIL'],
    ['KİRANIN BAŞLANGICI', data.startDate],
    ['DEPOZİTO', `${data.depositAmount.toLocaleString('tr-TR')} ${getCurrencySymbol(data.currency)} (${data.depositText} ${getCurrencyText(data.currency)})`],
    ['KİRALANAN MECURUN NE İÇİN KULLANILACAĞI', data.propertyUsage]
  ];
  
  autoTable(doc, {
    startY: y,
    head: [],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'Roboto',
      fontStyle: 'normal',
      fontSize: fontSize.body,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: margins.left, right: margins.right }
  });
  
  // Fixtures section
  y = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(fontSize.body);
  setFontBold(doc);
  doc.text('KİRALANAN ŞEY İLE BERABER TESLİM ALINAN DEMİRBAŞ BEYANI', margins.left, y);
  y += 7;
  
  setFontNormal(doc);
  const fixturesLines = doc.splitTextToSize(data.fixtures, doc.internal.pageSize.width - margins.left - margins.right);
  doc.text(fixturesLines, margins.left, y);
  y += fixturesLines.length * 5 + 10;
  
  // TUFE note
  setFontBold(doc);
  doc.text('YILLIK ARTIŞ TÜFE (Tüketici Fiyat Endeksi) ORANINDA OLACAKTIR', margins.left, y);
  y += 20;
  
  // Signature area
  renderSignatureArea(doc, y);
}

// ============================================================================
// PAGE 2: GENERAL CONDITIONS
// ============================================================================
function renderPage2_GenelSartlar(doc: jsPDF, clauses: string[]): void {
  const { margins, fontSize } = PDF_CONFIG;
  let y = margins.top;

  // Title
  doc.setFontSize(fontSize.subtitle);
  setFontBold(doc);
  doc.text('GENEL ŞARTLAR', doc.internal.pageSize.width / 2, y, { align: 'center' });
  y += 12;

  // Items
  doc.setFontSize(fontSize.small);
  setFontNormal(doc);

  const pageWidth = doc.internal.pageSize.width - margins.left - margins.right;

  clauses.forEach((madde, index) => {
    const maddeText = `${index + 1}. ${madde}`;
    const lines = doc.splitTextToSize(maddeText, pageWidth);
    
    // Page overflow check
    if (y + (lines.length * 4) > doc.internal.pageSize.height - margins.bottom) {
      doc.addPage();
      y = margins.top;
    }
    
    doc.text(lines, margins.left, y);
    y += lines.length * 4 + 3;
  });
}

// ============================================================================
// PAGE 3-4: SPECIAL CONDITIONS
// ============================================================================
function renderPage3_4_OzelSartlar(doc: jsPDF, data: ContractPdfData, clauses: string[]): void {
  const { margins, fontSize } = PDF_CONFIG;
  let y = margins.top;

  // Title
  doc.setFontSize(fontSize.subtitle);
  setFontBold(doc);
  doc.text('ÖZEL ŞARTLAR', doc.internal.pageSize.width / 2, y, { align: 'center' });
  y += 12;

  // Items
  doc.setFontSize(fontSize.small);
  setFontNormal(doc);

  const pageWidth = doc.internal.pageSize.width - margins.left - margins.right;

  clauses.forEach((madde, index) => {
    // Note: Variable replacement already done in generateContractPDFBlob
    // No need to inject payment details here anymore

    const maddeText = `${index + 1}- ${madde}`;
    const lines = doc.splitTextToSize(maddeText, pageWidth);
    
    // Page overflow check
    if (y + (lines.length * 4) > doc.internal.pageSize.height - margins.bottom - 30) {
      doc.addPage();
      y = margins.top;
    }
    
    doc.text(lines, margins.left, y);
    y += lines.length * 4 + 3;
  });
  
  // Date
  y += 5;
  setFontBold(doc);
  doc.text(`İmza Tarihi: ${data.contractDate}`, margins.left, y);
  y += 15;
  
  // Signature area
  renderSignatureArea(doc, y);
}

// ============================================================================
// PAGE 5: EVICTION COMMITMENT
// ============================================================================
function renderPage5_TahliyeTaahhutnamesi(doc: jsPDF, data: ContractPdfData, text: string): void {
  const { margins, fontSize } = PDF_CONFIG;
  let y = margins.top;

  // Title
  doc.setFontSize(fontSize.title);
  setFontBold(doc);
  doc.text('TAHLİYE TAAHHÜTNAMESİ', doc.internal.pageSize.width / 2, y, { align: 'center' });
  y += 20;

  // Build names with TC on same line
  const tenantWithTC = data.tenantTC
    ? `${data.tenantName} - T.C.: ${data.tenantTC}`
    : data.tenantName;
  const ownerWithTC = data.ownerTC
    ? `${data.ownerName} - T.C.: ${data.ownerTC}`
    : data.ownerName;

  // Info table
  const tableData = [
    ['Taahhüt Edenin Adı Soyadı', tenantWithTC],
    ['Mal Sahibinin Adı Soyadı', ownerWithTC],
    ['Tahliye Edilecek Kiralananın Adresi', `${data.mahalle} ${data.sokak} No:${data.binaNo} D:${data.daireNo} ${data.ilce}/${data.il}`],
    ['Tahliye Tarihi', data.evictionDate]
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'Roboto',
      fontStyle: 'normal',
      fontSize: fontSize.body,
      cellPadding: 4
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: margins.left, right: margins.right }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // Commitment text (use parameter instead of constant)
  doc.setFontSize(fontSize.body);
  setFontNormal(doc);
  const pageWidth = doc.internal.pageSize.width - margins.left - margins.right;
  const lines = doc.splitTextToSize(text, pageWidth);
  doc.text(lines, margins.left, y);
  y += lines.length * 5 + 20;
  
  // Date and signature
  setFontBold(doc);
  doc.text(`Taahhüt Tarihi: ${data.commitmentDate}`, margins.left, y);
  y += 10;
  doc.text(`Taahhüt Eden: ${data.tenantName}`, margins.left, y);
  y += 20;
  doc.text('İMZA:', margins.left, y);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function renderSignatureArea(doc: jsPDF, y: number): void {
  const { margins } = PDF_CONFIG;
  const pageWidth = doc.internal.pageSize.width;
  
  setFontBold(doc);
  doc.setFontSize(11);
  
  // Tenant (left)
  doc.text('KİRACI', margins.left + 30, y, { align: 'center' });
  doc.line(margins.left, y + 20, margins.left + 60, y + 20);
  
  // Owner (right)
  doc.text('KİRAYA VEREN', pageWidth - margins.right - 30, y, { align: 'center' });
  doc.line(pageWidth - margins.right - 60, y + 20, pageWidth - margins.right, y + 20);
}
