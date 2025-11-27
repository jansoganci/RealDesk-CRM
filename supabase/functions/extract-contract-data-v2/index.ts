/**
 * Supabase Edge Function: Hybrid Contract Data Extraction (v2)
 *
 * This function extracts text from DOCX and PDF files independently,
 * without relying on external services like Flavius.
 *
 * Flow:
 * 1. DOCX files → officeparser (native extraction)
 * 2. PDF files → officeparser first, then Google Vision OCR fallback
 *
 * Setup:
 * 1. Deploy: supabase functions deploy extract-contract-data-v2
 * 2. Set secrets (optional, for OCR fallback):
 *    supabase secrets set GOOGLE_CLOUD_API_KEY=your_key
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (your files are ~500KB max)
const MIN_MEANINGFUL_TEXT_LENGTH = 100; // Minimum chars to consider extraction successful

// SET TO TRUE FOR TESTING WITHOUT AUTH
const SKIP_AUTH_FOR_TESTING = true;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

// Response helper
function jsonResponse(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Error response helper
function errorResponse(message: string, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

// Detect file type from extension and MIME type
function getFileType(file: File): 'docx' | 'pdf' | 'unknown' {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (extension === 'docx' || mimeType.includes('wordprocessingml')) {
    return 'docx';
  }
  if (extension === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }
  return 'unknown';
}

// Check if extracted text is meaningful
function isTextMeaningful(text: string): boolean {
  if (!text || text.length < MIN_MEANINGFUL_TEXT_LENGTH) {
    return false;
  }

  // Check for Turkish/Latin characters (not just gibberish)
  const hasLetters = /[a-zA-ZçğıöşüÇĞİÖŞÜ]{3,}/i.test(text);

  // Check for contract-related keywords (Turkish)
  const contractKeywords = [
    'kira', 'sözleşme', 'kiracı', 'kiraya', 'taraf',
    'madde', 'tarih', 'adres', 'iban', 'depozito'
  ];
  const hasContractKeyword = contractKeywords.some(keyword =>
    text.toLowerCase().includes(keyword)
  );

  return hasLetters && (text.length > 500 || hasContractKeyword);
}

// Extract text using officeparser (DOCX only - PDF crashes due to DOMMatrix)
async function extractWithOfficeParser(buffer: ArrayBuffer, fileType: string): Promise<string> {
  // Skip PDF - officeparser uses pdfjs-dist which requires browser APIs (DOMMatrix, Path2D)
  // that are not available in Supabase Edge Functions
  if (fileType === 'pdf') {
    console.log('Skipping officeparser for PDF (not supported in Edge Functions)');
    return '';
  }

  try {
    // Dynamic import for officeparser
    const officeparser = await import('npm:officeparser@5.2.2');
    const text = await officeparser.parseOfficeAsync(buffer);
    return text || '';
  } catch (error) {
    console.error(`officeparser error (${fileType}):`, error);
    return '';
  }
}

// Convert ArrayBuffer to base64 without stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192; // Process in chunks to avoid stack overflow

  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }

  return btoa(binary);
}

// Extract text using OCR.space API (supports PDF directly)
async function extractWithOCRSpace(buffer: ArrayBuffer, filename: string): Promise<string> {
  // OCR.space free API key (500 requests/day) or use custom key
  const apiKey = Deno.env.get('OCR_SPACE_API_KEY') || 'REMOVED_SECRET'; // Free tier key

  try {
    console.log('Calling OCR.space API...');

    // Create form data with the PDF file
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'application/pdf' });
    formData.append('file', blob, filename);
    formData.append('apikey', apiKey);
    formData.append('language', 'tur'); // Turkish
    formData.append('isOverlayRequired', 'false');
    formData.append('filetype', 'PDF');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Engine 2 is better for documents

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    console.log('OCR.space response status:', response.status);
    console.log('OCR.space IsErroredOnProcessing:', data.IsErroredOnProcessing);

    // Combine text from all pages (even if some pages failed)
    const pages = data.ParsedResults || [];
    const fullText = pages.map((page: any) => page.ParsedText || '').join('\n\n');

    console.log('OCR.space extracted text length:', fullText.length);
    console.log('OCR.space pages processed:', pages.length);

    // If we got text, use it (even if there was a warning about page limit)
    if (fullText && fullText.trim().length > 0) {
      // Log warning if there was a page limit issue
      if (data.ErrorMessage) {
        console.warn('OCR.space warning (but got text):', data.ErrorMessage);
      }
      return fullText;
    }

    // Only fail if we got no text at all
    if (data.IsErroredOnProcessing && (!pages.length || !fullText)) {
      console.error('OCR.space error:', data.ErrorMessage || data.ErrorDetails);
      return '';
    }

    return fullText;
  } catch (error) {
    console.error('OCR.space error:', error);
    return '';
  }
}

// Extract text using Google Cloud Vision OCR (for images only, not PDF)
async function extractWithGoogleVisionOCR(buffer: ArrayBuffer, filename: string): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');

  if (!apiKey) {
    console.warn('GOOGLE_CLOUD_API_KEY not set, skipping Vision OCR');
    return '';
  }

  try {
    // Convert buffer to base64 (using chunked method to avoid stack overflow)
    const base64 = arrayBufferToBase64(buffer);
    console.log(`Base64 conversion complete, size: ${base64.length} chars`);

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
            imageContext: {
              languageHints: ['tr', 'en'] // Turkish and English
            }
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok || data.responses?.[0]?.error) {
      console.error('Google Vision API error:', data.responses?.[0]?.error || data);
      return '';
    }

    const textAnnotations = data.responses?.[0]?.fullTextAnnotation?.text;
    console.log('Vision API extracted text length:', textAnnotations?.length || 0);
    return textAnnotations || '';
  } catch (error) {
    console.error('Google Vision OCR error:', error);
    return '';
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const startTime = Date.now();

  try {
    // Auth check (can be skipped for testing)
    if (!SKIP_AUTH_FOR_TESTING) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return errorResponse('Missing authorization header', 401);
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return errorResponse('Unauthorized', 401);
      }
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file uploaded');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(`File too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024} MB.`);
    }

    // Detect file type
    const fileType = getFileType(file);
    if (fileType === 'unknown') {
      return errorResponse('Unsupported file type. Please upload a PDF or DOCX file.');
    }

    // Get file buffer
    const buffer = await file.arrayBuffer();

    let extractedText = '';
    let extractionMethod: 'DIGITAL_EXTRACTION' | 'OCR_FALLBACK' = 'DIGITAL_EXTRACTION';
    let ocrApplied = false;

    // Step 1: Try officeparser (works for both DOCX and digital PDFs)
    console.log(`Extracting ${fileType} with officeparser...`);
    extractedText = await extractWithOfficeParser(buffer, fileType);

    // Step 2: If PDF, use OCR.space (supports PDF directly)
    if (fileType === 'pdf') {
      console.log('PDF detected, using OCR.space...');
      const ocrText = await extractWithOCRSpace(buffer, file.name);

      if (ocrText && isTextMeaningful(ocrText)) {
        extractedText = ocrText;
        extractionMethod = 'OCR_FALLBACK';
        ocrApplied = true;
      } else {
        // OCR.space failed, return error
        return jsonResponse({
          success: false,
          error: 'PDF metin çıkarma başarısız. Lütfen farklı bir PDF deneyin veya DOCX formatında yükleyin.',
          hint: 'OCR.space API error or empty result'
        }, 400);
      }
    }

    const processingTime = Date.now() - startTime;

    // Return response
    return jsonResponse({
      success: true,
      text: extractedText,
      method: extractionMethod,
      metadata: {
        filename: file.name,
        fileSize: file.size,
        fileType: fileType,
        extractionTime: processingTime,
        textLength: extractedText.length,
        ocrApplied: ocrApplied,
        authSkipped: SKIP_AUTH_FOR_TESTING, // For debugging
      }
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});
