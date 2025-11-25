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
 * Extract text from PDF/EPUB file using Supabase Edge Function proxy
 * 
 * Method 2: Supabase Edge Function (recommended - secure)
 * 
 * This method uses a Supabase Edge Function as a proxy to call Flavius API.
 * Firebase tokens are stored securely in Edge Function environment variables.
 * 
 * @param file - PDF or EPUB file to extract text from
 * @returns Extracted text and metadata
 */
export async function extractTextFromFileViaProxy(
  file: File
): Promise<ExtractTextResponse> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-text`;

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

  // Get Supabase session for authentication
  const { supabase } = await import('@/config/supabase');
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
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
 * Parse contract data from extracted text
 * Attempts to extract key information from contract PDF text
 * 
 * @param text - Extracted text from contract PDF
 * @returns Parsed contract data (partial)
 */
export function parseContractFromText(text: string): Partial<{
  tenantName: string;
  ownerName: string;
  propertyAddress: string;
  rentAmount: number;
  startDate: string;
  endDate: string;
  deposit: number;
}> {
  const result: any = {};

  // Extract tenant name (look for "Kiracı", "Taraflar", etc.)
  const tenantMatch = text.match(/(?:Kiracı|KİRACI|TARAF|Taraflar)[\s:]+([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)+)/i);
  if (tenantMatch) {
    result.tenantName = tenantMatch[1].trim();
  }

  // Extract owner name (look for "Mal Sahibi", "Kiralayan", etc.)
  const ownerMatch = text.match(/(?:Mal Sahibi|MAL SAHİBİ|Kiralayan|KİRALAYAN)[\s:]+([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)+)/i);
  if (ownerMatch) {
    result.ownerName = ownerMatch[1].trim();
  }

  // Extract rent amount (look for "Kira Bedeli", "Aylık Kira", etc.)
  const rentMatch = text.match(/(?:Kira Bedeli|KİRA BEDELİ|Aylık Kira|AYLIK KİRA)[\s:]+([\d.,]+)\s*(?:TL|TRY|₺)/i);
  if (rentMatch) {
    const rentStr = rentMatch[1].replace(/\./g, '').replace(',', '.');
    result.rentAmount = parseFloat(rentStr);
  }

  // Extract deposit (look for "Depozito", "Teminat", etc.)
  const depositMatch = text.match(/(?:Depozito|DEPOZİTO|Teminat|TEMİNAT)[\s:]+([\d.,]+)\s*(?:TL|TRY|₺)/i);
  if (depositMatch) {
    const depositStr = depositMatch[1].replace(/\./g, '').replace(',', '.');
    result.deposit = parseFloat(depositStr);
  }

  // Extract dates (look for "Başlangıç", "Bitiş", etc.)
  const startDateMatch = text.match(/(?:Başlangıç|BAŞLANGIÇ|Başlangıç Tarihi)[\s:]+(\d{1,2}[./]\d{1,2}[./]\d{4})/i);
  if (startDateMatch) {
    result.startDate = startDateMatch[1];
  }

  const endDateMatch = text.match(/(?:Bitiş|BİTİŞ|Bitiş Tarihi)[\s:]+(\d{1,2}[./]\d{1,2}[./]\d{4})/i);
  if (endDateMatch) {
    result.endDate = endDateMatch[1];
  }

  // Extract address (look for "Adres", "Konum", etc.)
  const addressMatch = text.match(/(?:Adres|ADRES|Konum|KONUM)[\s:]+([A-ZÇĞİÖŞÜ][^.\n]+(?:Mahallesi|Sokak|Cadde|No)[^.\n]+)/i);
  if (addressMatch) {
    result.propertyAddress = addressMatch[1].trim();
  }

  return result;
}


