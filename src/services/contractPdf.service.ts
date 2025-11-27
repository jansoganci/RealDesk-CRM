/**
 * Contract PDF Generation Service - jsPDF Version
 * Generates Turkish rental contract PDF using jsPDF + jspdf-autotable
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ContractPdfData } from '@/types/contract.types';
import { GENEL_SARTLAR, OZEL_SARTLAR, TAHLIYE_TAAHHUTNAMESI_TEXT } from '@/templates/contractContent';
import { addTurkishFonts, setFontBold, setFontNormal } from './pdfFonts';

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
 */
export async function generateContractPDFBlob(data: ContractPdfData): Promise<Blob> {
  const doc = new jsPDF(PDF_CONFIG);
  
  // Add Turkish font support
  addTurkishFonts(doc);
  
  // Sayfa 1: Bilgi Tablosu
  renderPage1_InfoTable(doc, data);
  
  // Sayfa 2: Genel Şartlar
  doc.addPage();
  renderPage2_GenelSartlar(doc);
  
  // Sayfa 3-4: Özel Şartlar
  doc.addPage();
  renderPage3_4_OzelSartlar(doc, data);
  
  // Sayfa 5: Tahliye Taahhütnamesi
  doc.addPage();
  renderPage5_TahliyeTaahhutnamesi(doc, data);
  
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
    ['KİRALANAN ŞEYİN CİNSİ', data.propertyType],
    ['KİRAYA VERENİN ADI SOYADI', ownerInfo],
    ['KİRACININ ADI SOYADI', tenantInfo],
    ['KİRACININ İKAMETGAHI', data.tenantAddress],
    ['KİRACININ TELEFONU', data.tenantPhone],
    ['BİR AYLIK KİRA KARŞILIĞI', `${data.monthlyRentNumber.toLocaleString('tr-TR')} TL (${data.monthlyRentText} TÜRK LİRASI)`],
    ['BİR SENELİK KİRA KARŞILIĞI', `${data.yearlyRentNumber.toLocaleString('tr-TR')} TL (${data.yearlyRentText} TÜRK LİRASI)`],
    ['KİRANIN NE ŞEKİLDE ÖDENECEĞİ', `IBAN: ${data.ownerIBAN}`],
    ['KİRA MÜDDETİ', '1 YIL'],
    ['KİRANIN BAŞLANGICI', data.startDate],
    ['DEPOZİTO', `${data.depositAmount.toLocaleString('tr-TR')} TL (${data.depositText} TÜRK LİRASI)`],
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
function renderPage2_GenelSartlar(doc: jsPDF): void {
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
  
  GENEL_SARTLAR.forEach((madde, index) => {
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
function renderPage3_4_OzelSartlar(doc: jsPDF, data: ContractPdfData): void {
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
  
  OZEL_SARTLAR.forEach((madde, index) => {
    // Inject payment details into clause 10
    let processedMadde = madde;
    if (index === 9) {
      processedMadde = madde + ` Kiracı, aylık kira bedellerini her ayın ${data.paymentDay}'inde peşin olarak ${data.ownerIBAN} numaralı IBAN Hesabına ${data.ownerName} adına yatıracaktır.`;
    }
    
    const maddeText = `${index + 1}- ${processedMadde}`;
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
function renderPage5_TahliyeTaahhutnamesi(doc: jsPDF, data: ContractPdfData): void {
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
  
  // Commitment text
  doc.setFontSize(fontSize.body);
  setFontNormal(doc);
  const pageWidth = doc.internal.pageSize.width - margins.left - margins.right;
  const lines = doc.splitTextToSize(TAHLIYE_TAAHHUTNAMESI_TEXT, pageWidth);
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
