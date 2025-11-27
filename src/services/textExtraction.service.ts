/**
 * Text Extraction Service
 * Extracts text from PDF/EPUB files using Flavius API
 * 
 * Two integration methods:
 * 1. Direct API call (requires Firebase tokens)
 * 2. Supabase Edge Function proxy (recommended - secure)
 */

export interface ExtractTextRequest {
  file: File;
}

export interface ExtractTextResponse {
  success: boolean;
  text: string;
  token_count?: number;
  file_type?: string;
  filename?: string;
  is_machine_readable?: boolean;
  needs_ocr?: boolean;
  ocr_applied?: boolean;
  page_count?: number;
  processing_time_ms?: number;
}

export interface ExtractTextError {
  success?: boolean;
  error: string;
}

/**
 * Extract text from PDF/EPUB file using Flavius API
 * 
 * Method 1: Direct API call (requires Firebase tokens)
 * 
 * @param file - PDF or EPUB file to extract text from
 * @param firebaseIdToken - Firebase ID token for authentication
 * @param appCheckToken - Firebase App Check token
 * @returns Extracted text and metadata
 */
export async function extractTextFromFile(
  file: File,
  firebaseIdToken: string,
  appCheckToken: string
): Promise<ExtractTextResponse> {
  const url = 'https://api.flavius.app/api/v1/process-file';

  // Validate file type
  const allowedTypes = ['application/pdf', 'application/epub+zip', 'application/octet-stream'];
  const allowedExtensions = ['.pdf', '.epub'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    throw new Error('Desteklenmeyen dosya tipi. Lütfen PDF veya EPUB dosyası yükleyin.');
  }

  // Validate file size (100 MB limit)
  const maxSize = 100 * 1024 * 1024; // 100 MB
  if (file.size > maxSize) {
    throw new Error('Dosya boyutu çok büyük. Maksimum 100 MB.');
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseIdToken}`,
        'X-Firebase-AppCheck': appCheckToken,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
      throw new Error(errorData.error || `HTTP hatası: ${response.status}`);
    }

    const data = await response.json();

    // Handle different response formats
    if (data.success === false) {
      throw new Error(data.error || 'Metin çıkarma başarısız');
    }

    // Return standardized response
    return {
      success: true,
      text: data.text || '',
      token_count: data.token_count || data.text?.length || 0,
      file_type: data.file_type,
      filename: data.filename,
      is_machine_readable: data.is_machine_readable,
      needs_ocr: data.needs_ocr,
      ocr_applied: data.ocr_applied,
      page_count: data.page_count,
      processing_time_ms: data.processing_time_ms,
    };
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Metin çıkarma sırasında bir hata oluştu');
  }
}

/**
 * Extract text from PDF/DOCX file using Supabase Edge Function
 *
 * Uses our custom edge function that supports:
 * - DOCX: officeparser (native extraction)
 * - PDF: OCR.space API (Turkish language support)
 *
 * @param file - PDF or DOCX file to extract text from
 * @returns Extracted text and metadata
 */
export async function extractTextFromFileViaProxy(
  file: File
): Promise<ExtractTextResponse> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-contract-data-v2`;

  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream'
  ];
  const allowedExtensions = ['.pdf', '.docx'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    throw new Error('Desteklenmeyen dosya tipi. Lütfen PDF veya DOCX dosyası yükleyin.');
  }

  // Validate file size (10 MB limit for OCR)
  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) {
    throw new Error('Dosya boyutu çok büyük. Maksimum 10 MB.');
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Note: Auth is optional for testing (SKIP_AUTH_FOR_TESTING = true in edge function)
    // In production, uncomment the auth header below
    const response = await fetch(url, {
      method: 'POST',
      // headers: {
      //   'Authorization': `Bearer ${session.access_token}`,
      // },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
      throw new Error(errorData.error || `HTTP hatası: ${response.status}`);
    }

    const data = await response.json();

    // Handle different response formats
    if (data.success === false) {
      throw new Error(data.error || 'Metin çıkarma başarısız');
    }

    // Return standardized response
    return {
      success: true,
      text: data.text || '',
      token_count: data.metadata?.textLength || data.text?.length || 0,
      file_type: data.metadata?.fileType,
      filename: data.metadata?.filename,
      is_machine_readable: data.method === 'DIGITAL_EXTRACTION',
      needs_ocr: data.metadata?.fileType === 'pdf',
      ocr_applied: data.metadata?.ocrApplied || false,
      page_count: undefined, // Not available from OCR.space free tier
      processing_time_ms: data.metadata?.extractionTime,
    };
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error instanceof Error
      ? error
      : new Error('Metin çıkarma sırasında bir hata oluştu');
  }
}

/**
 * Parsed contract data structure for Turkish rental contracts
 */
export interface ParsedContractData {
  // Tenant (Kiracı) information
  tenant: {
    name: string | null;
    tc: string | null;
    phone: string | null;
    address: string | null;
  };
  // Owner (Kiraya Veren / Mal Sahibi) information
  owner: {
    name: string | null;
    tc: string | null;
    phone: string | null;
    iban: string | null;
  };
  // Property (Kiralanan) information
  property: {
    type: string | null;        // Daire, Villa, İşyeri, etc.
    usePurpose: string | null;  // Mesken, İşyeri
    mahalle: string | null;
    ilce: string | null;
    il: string | null;
    sokak: string | null;
    binaNo: string | null;
    daireNo: string | null;
    fullAddress: string | null;
  };
  // Contract (Sözleşme) details
  contract: {
    contractNumber: string | null;
    rentAmount: number | null;
    annualRent: number | null;
    deposit: number | null;
    currency: string;
    startDate: string | null;
    endDate: string | null;
    duration: string | null;
    paymentMethod: string | null;
  };
  // Metadata
  meta: {
    extractionConfidence: number;  // 0-100
    fieldsFound: number;
    totalFields: number;
    warnings: string[];
  };
}

/**
 * Helper to parse Turkish number format (15.000,00 → 15000)
 */
function parseTurkishNumber(text: string): number | null {
  if (!text) return null;
  // Remove dots (thousand separator), replace comma with dot (decimal)
  const cleaned = text.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Helper to normalize phone number
 */
function normalizePhone(phone: string): string | null {
  if (!phone) return null;
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // Turkish mobile: should be 10-11 digits
  if (digits.length >= 10 && digits.length <= 11) {
    // Format as 05XX XXX XX XX
    const normalized = digits.slice(-10);
    return `0${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8, 10)}`;
  }
  return phone.trim();
}

/**
 * Parse contract data from extracted text
 * Specialized for Turkish rental contract format (Türk Kira Sözleşmesi)
 *
 * @param text - Extracted text from contract PDF/DOCX
 * @returns Parsed contract data with confidence score
 */
export function parseContractFromText(text: string): ParsedContractData {
  const warnings: string[] = [];
  let fieldsFound = 0;
  const totalFields = 20; // Total expected fields

  // Initialize result
  const result: ParsedContractData = {
    tenant: { name: null, tc: null, phone: null, address: null },
    owner: { name: null, tc: null, phone: null, iban: null },
    property: {
      type: null, usePurpose: null, mahalle: null, ilce: null,
      il: null, sokak: null, binaNo: null, daireNo: null, fullAddress: null
    },
    contract: {
      contractNumber: null, rentAmount: null, annualRent: null,
      deposit: null, currency: 'TRY', startDate: null, endDate: null,
      duration: null, paymentMethod: null
    },
    meta: { extractionConfidence: 0, fieldsFound: 0, totalFields, warnings }
  };

  // Normalize text for matching (used in some patterns)
  const _normalizedText = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  void _normalizedText; // May be used for future pattern matching

  // ============================================
  // TENANT (KİRACI) EXTRACTION
  // ============================================

  // Tenant Name + TC (combined in Turkish contracts)
  // Format 1: "KİRACININ ADI SOYADI\nMENEME MANILMA TC: 2222222222" (DOCX - newline separated)
  // Format 2: "KİRACININ ADI SOYADI: MENEME MANILMA TC:2222222222" (same line)
  const tenantNamePatterns = [
    // DOCX format: label on one line, value with TC on next line
    /KİRACININ\s*ADI\s*SOYADI\s*\n\s*([A-ZÇĞİÖŞÜa-zçğıöşü\s]+?)\s*TC\s*:?\s*(\d{10,11})/i,
    // Same line format
    /KİRACININ\s*ADI\s*SOYADI[\s:]+([A-ZÇĞİÖŞÜa-zçğıöşü\s]+?)\s*TC\s*:?\s*(\d{10,11})/i,
    // Without TC
    /KİRACININ\s*ADI\s*SOYADI\s*\n\s*([A-ZÇĞİÖŞÜa-zçğıöşü\s]{3,})/i,
  ];

  for (const pattern of tenantNamePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 2) {
        result.tenant.name = name;
        fieldsFound++;
        if (match[2]) {
          result.tenant.tc = match[2];
          fieldsFound++;
        }
        break;
      }
    }
  }

  // Tenant TC (if not found in name field)
  if (!result.tenant.tc) {
    const tenantTCPatterns = [
      /KİRACININ\s*ADI\s*SOYADI[\s\S]*?TC\s*:?\s*(\d{10,11})/i,
      /KİRACININ\s*(?:TC|T\.C\.?|KİMLİK)[\s\w]*?[\s:]*(\d{10,11})/i,
    ];
    for (const pattern of tenantTCPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.tenant.tc = match[1];
        fieldsFound++;
        break;
      }
    }
  }

  // Tenant Phone - supports "LABEL\nVALUE" format
  const tenantPhonePatterns = [
    /KİRACININ\s*TELEFONU\s*\n\s*([0-9\s\-\(\)]{10,})/i,
    /KİRACININ\s*TELEFONU[\s:]+([0-9\s\-\(\)]{10,})/i,
    /KİRACI\s*TEL(?:EFON)?[\s:]+([0-9\s\-\(\)]{10,})/i,
  ];
  for (const pattern of tenantPhonePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.tenant.phone = normalizePhone(match[1]);
      fieldsFound++;
      break;
    }
  }

  // Tenant Address - supports "LABEL\nVALUE" format
  const tenantAddressPatterns = [
    /KİRACININ\s*İKAMETGAHI\s*\n\s*([^\n]+)/i,
    /KİRACININ\s*İKAMETGAHI[\s:]+([^\n]+)/i,
    /KİRACI\s*ADRES[İI]?[\s:]+([^\n]+)/i,
  ];
  for (const pattern of tenantAddressPatterns) {
    const match = text.match(pattern);
    if (match && match[1].trim().length > 5) {
      result.tenant.address = match[1].trim();
      fieldsFound++;
      break;
    }
  }

  // ============================================
  // OWNER (KİRAYA VEREN / MAL SAHİBİ) EXTRACTION
  // ============================================

  // Owner Name + TC (combined in Turkish contracts)
  // Format 1: "KİRAYA VERENİN ADI SOYADI\nDENEME YANILMA TC:1111111111" (DOCX - newline separated)
  // Format 2: "KİRAYA VERENİN ADI SOYADI: DENEME YANILMA TC:1111111111" (same line)
  const ownerNamePatterns = [
    // DOCX format: label on one line, value with TC on next line
    /KİRAYA\s*VERENİN\s*ADI\s*SOYADI\s*\n\s*([A-ZÇĞİÖŞÜa-zçğıöşü\s]+?)\s*TC\s*:?\s*(\d{10,11})/i,
    // Same line format
    /KİRAYA\s*VERENİN\s*ADI\s*SOYADI[\s:]+([A-ZÇĞİÖŞÜa-zçğıöşü\s]+?)\s*TC\s*:?\s*(\d{10,11})/i,
    // MAL SAHİBİ format
    /MAL\s*SAHİBİ(?:NİN)?\s*\n\s*([A-ZÇĞİÖŞÜa-zçğıöşü\s]+?)\s*TC\s*:?\s*(\d{10,11})/i,
    /MAL\s*SAHİBİ(?:NİN)?[\s:]+([A-ZÇĞİÖŞÜa-zçğıöşü\s]+?)\s*TC\s*:?\s*(\d{10,11})/i,
    // Without TC
    /KİRAYA\s*VERENİN\s*ADI\s*SOYADI\s*\n\s*([A-ZÇĞİÖŞÜa-zçğıöşü\s]{3,})/i,
  ];

  for (const pattern of ownerNamePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 2) {
        result.owner.name = name;
        fieldsFound++;
        if (match[2]) {
          result.owner.tc = match[2];
          fieldsFound++;
        }
        break;
      }
    }
  }

  // Owner TC (if not found in name field)
  if (!result.owner.tc) {
    const ownerTCPatterns = [
      /KİRAYA\s*VERENİN\s*ADI\s*SOYADI[\s\S]*?TC\s*:?\s*(\d{10,11})/i,
      /(?:KİRAYA\s*VEREN|MAL\s*SAHİBİ)[\s\w]*?(?:TC|T\.C\.?|KİMLİK)[\s:]*(\d{10,11})/i,
    ];
    for (const pattern of ownerTCPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.owner.tc = match[1];
        fieldsFound++;
        break;
      }
    }
  }

  // Owner Phone
  const ownerPhonePatterns = [
    /KİRAYA\s*VERENİN\s*TELEFONU\s*\n\s*([0-9\s\-\(\)]{10,})/i,
    /(?:KİRAYA\s*VEREN|MAL\s*SAHİBİ)[\s\w]*?TEL(?:EFON)?[\s:]+([0-9\s\-\(\)]{10,})/i,
  ];
  for (const pattern of ownerPhonePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.owner.phone = normalizePhone(match[1]);
      fieldsFound++;
      break;
    }
  }

  // Owner IBAN
  const ibanPatterns = [
    /İBAN[\s:]*([A-Z]{2}\d{2}[\s\d]{20,30})/i,
    /IBAN[\s:]*([A-Z]{2}\d{2}[\s\d]{20,30})/i,
    /TR\s*\d{2}[\s\d]{20,24}/i,
  ];
  for (const pattern of ibanPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Clean IBAN - remove spaces
      const iban = (match[1] || match[0]).replace(/\s/g, '').toUpperCase();
      if (iban.length >= 24 && iban.length <= 34) {
        result.owner.iban = iban;
        fieldsFound++;
        break;
      }
    }
  }

  // ============================================
  // PROPERTY (KİRALANAN) EXTRACTION
  // ============================================

  // Property Type (Kiralanan Şeyin Cinsi)
  const propertyTypeMatch = text.match(/KİRALANAN\s*ŞEYİN\s*CİNSİ[\s:]*([^\n]+)/i);
  if (propertyTypeMatch && propertyTypeMatch[1].trim()) {
    result.property.type = propertyTypeMatch[1].trim();
    fieldsFound++;
  }

  // Usage Purpose (Kiralanan Mecurun Ne İçin Kullanılacağı)
  const usePurposeMatch = text.match(/(?:KİRALANAN\s*MECURUN\s*NE\s*İÇİN\s*KULLANILACAĞI|KULLANIM\s*AMACI)[\s:]*([^\n]+)/i);
  if (usePurposeMatch && usePurposeMatch[1].trim()) {
    result.property.usePurpose = usePurposeMatch[1].trim();
    fieldsFound++;
  }

  // Address Components
  // Pattern: MAHALLESİ/İLÇE/İL
  const addressComponentMatch = text.match(/MAHALLESİ\s*\/\s*İLÇE\s*\/\s*İL[\s:]*([^\n]+)/i);
  if (addressComponentMatch) {
    const parts = addressComponentMatch[1].split('/').map(p => p.trim());
    if (parts[0]) { result.property.mahalle = parts[0]; fieldsFound++; }
    if (parts[1]) { result.property.ilce = parts[1]; fieldsFound++; }
    if (parts[2]) { result.property.il = parts[2]; fieldsFound++; }
  }

  // Street/Number
  const streetMatch = text.match(/SOKAĞI\s*\/?\s*NUMARASI[\s:]*([^\n]+)/i);
  if (streetMatch && streetMatch[1].trim()) {
    result.property.sokak = streetMatch[1].trim();
    fieldsFound++;
  }

  // Build full address
  const addressParts = [
    result.property.mahalle,
    result.property.sokak,
    result.property.ilce,
    result.property.il
  ].filter(Boolean);
  if (addressParts.length > 0) {
    result.property.fullAddress = addressParts.join(', ');
  }

  // ============================================
  // CONTRACT (SÖZLEŞME) EXTRACTION
  // ============================================

  // Contract Number
  const contractNumMatch = text.match(/(?:NUMARASI|SÖZLEŞME\s*NO)[\s:]*([A-Z0-9\-\/]+)/i);
  if (contractNumMatch && contractNumMatch[1].trim()) {
    result.contract.contractNumber = contractNumMatch[1].trim();
    fieldsFound++;
  }

  // Monthly Rent (Bir Aylık Kira Karşılığı)
  // Supports both "LABEL: VALUE" and "LABEL\nVALUE" formats
  const monthlyRentPatterns = [
    // Format: "BİR AYLIK KİRA KARŞILIĞI\n20000" (DOCX extraction - label on separate line)
    /BİR\s*AYLIK\s*KİRA\s*KARŞILIĞI\s*\n\s*([0-9\.\,\s]+)/i,
    // Format: "AYLIK KİRA KARŞILIĞI: 20000" or with RAKAM İLE
    /BİR?\s*AYLIK\s*KİRA\s*KARŞILIĞI[\s\S]*?RAKAM\s*[İI]LE[\s:]*([0-9\.\,\s]+)\s*(?:TL|TRY|₺)?/i,
    // Format: "AYLIK KİRA: 20000"
    /AYLIK\s*KİRA[\s:]+([0-9\.\,\s]+)\s*(?:TL|TRY|₺)?/i,
    // Format: "KİRA BEDELİ: 20000"
    /KİRA\s*BEDELİ[\s:]+([0-9\.\,\s]+)\s*(?:TL|TRY|₺)?/i,
  ];
  for (const pattern of monthlyRentPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseTurkishNumber(match[1]);
      if (amount && amount > 0) {
        result.contract.rentAmount = amount;
        fieldsFound++;
        break;
      }
    }
  }

  // Annual Rent (Bir Senelik Kira Karşılığı)
  const annualRentMatch = text.match(/BİR\s*SENELİK\s*KİRA\s*KARŞILIĞI[\s\S]*?RAKAM\s*[İI]LE[\s:]*([0-9\.\,\s]+)\s*(?:TL|TRY|₺)?/i);
  if (annualRentMatch) {
    const amount = parseTurkishNumber(annualRentMatch[1]);
    if (amount && amount > 0) {
      result.contract.annualRent = amount;
      fieldsFound++;
    }
  }

  // Deposit (Depozito) - supports "LABEL\nVALUE" format
  const depositPatterns = [
    // DOCX format: "DEPOZİTO\n20000"
    /DEPOZİTO\s*\n\s*([0-9\.\,\s]+)/i,
    // Same line format
    /DEPOZİTO[\s:]+([0-9\.\,\s]+)\s*(?:TL|TRY|₺)?/i,
    /TEMİNAT[\s:]+([0-9\.\,\s]+)\s*(?:TL|TRY|₺)?/i,
  ];
  for (const pattern of depositPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseTurkishNumber(match[1]);
      if (amount && amount > 0) {
        result.contract.deposit = amount;
        fieldsFound++;
        break;
      }
    }
  }

  // Start Date (Kiranın Başlangıcı) - supports "LABEL\nVALUE" format
  const startDatePatterns = [
    // DOCX format: "KİRANIN BAŞLANGICI\n27.12.2025"
    /KİRANIN\s*BAŞLANGICI\s*\n\s*(\d{1,2}[\./]\d{1,2}[\./]\d{2,4})/i,
    // Same line format
    /KİRANIN\s*BAŞLANGICI[\s:]+(\d{1,2}[\./]\d{1,2}[\./]\d{2,4})/i,
    /BAŞLANGIÇ\s*TARİHİ[\s:]+(\d{1,2}[\./]\d{1,2}[\./]\d{2,4})/i,
    /SÖZLEŞME\s*BAŞLANGIÇ[\s:]+(\d{1,2}[\./]\d{1,2}[\./]\d{2,4})/i,
  ];
  for (const pattern of startDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.contract.startDate = match[1].replace(/\//g, '.');
      fieldsFound++;
      break;
    }
  }

  // Duration (Kira Müddeti) - supports "LABEL\nVALUE" format
  const durationPatterns = [
    // DOCX format: "KİRA MÜDDETİ\n1 YIL"
    /KİRA\s*MÜDDETİ\s*\n\s*([^\n]+)/i,
    // Same line format
    /KİRA\s*MÜDDETİ[\s:]+([^\n]+)/i,
  ];

  for (const pattern of durationPatterns) {
    const durationMatch = text.match(pattern);
    if (durationMatch && durationMatch[1].trim()) {
      result.contract.duration = durationMatch[1].trim();
      fieldsFound++;

      // Try to calculate end date from start date + duration
      if (result.contract.startDate && !result.contract.endDate) {
        const yearMatch = durationMatch[1].match(/(\d+)\s*YIL/i);
        if (yearMatch && result.contract.startDate) {
          try {
            const parts = result.contract.startDate.split('.');
            const startYear = parseInt(parts[2]);
            const endYear = startYear + parseInt(yearMatch[1]);
            result.contract.endDate = `${parts[0]}.${parts[1]}.${endYear}`;
          } catch {
            // Ignore date calculation errors
          }
        }
      }
      break;
    }
  }

  // End Date (if not calculated)
  if (!result.contract.endDate) {
    const endDatePatterns = [
      /BİTİŞ\s*TARİHİ[\s:]*(\d{1,2}[\./]\d{1,2}[\./]\d{2,4})/i,
      /SÖZLEŞME\s*BİTİŞ[\s:]*(\d{1,2}[\./]\d{1,2}[\./]\d{2,4})/i,
    ];
    for (const pattern of endDatePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.contract.endDate = match[1].replace(/\//g, '.');
        fieldsFound++;
        break;
      }
    }
  }

  // Payment Method
  if (result.owner.iban) {
    result.contract.paymentMethod = 'bank_transfer';
  }

  // ============================================
  // CONFIDENCE CALCULATION
  // ============================================

  // Check for critical missing fields
  if (!result.tenant.name) warnings.push('Kiracı adı bulunamadı');
  if (!result.owner.name) warnings.push('Mal sahibi adı bulunamadı');
  if (!result.contract.rentAmount) warnings.push('Kira bedeli bulunamadı');
  if (!result.contract.startDate) warnings.push('Başlangıç tarihi bulunamadı');

  // Calculate confidence (0-100)
  result.meta.fieldsFound = fieldsFound;
  result.meta.extractionConfidence = Math.round((fieldsFound / totalFields) * 100);
  result.meta.warnings = warnings;

  return result;
}

/**
 * Legacy function - returns simple format for backward compatibility
 * @deprecated Use parseContractFromText for full data
 */
export function parseContractFromTextSimple(text: string): Partial<{
  tenantName: string;
  ownerName: string;
  propertyAddress: string;
  rentAmount: number;
  startDate: string;
  endDate: string;
  deposit: number;
}> {
  const parsed = parseContractFromText(text);
  return {
    tenantName: parsed.tenant.name || undefined,
    ownerName: parsed.owner.name || undefined,
    propertyAddress: parsed.property.fullAddress || undefined,
    rentAmount: parsed.contract.rentAmount || undefined,
    startDate: parsed.contract.startDate || undefined,
    endDate: parsed.contract.endDate || undefined,
    deposit: parsed.contract.deposit || undefined,
  };
}


