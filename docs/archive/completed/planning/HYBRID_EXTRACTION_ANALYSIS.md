# Hybrid Text Extraction System - Technical Analysis

## Executive Summary

**Proposed Approach**: "Free-First Hybrid" waterfall system
- **Attempt 1**: Free digital PDF text extraction (pdf-text library)
- **Attempt 2**: Fallback to OCR.space API for scanned documents

**Cost Impact**: 
- 90% of cases: **$0** (digital PDFs)
- 10% of cases: **Free tier** (500 reqs/day) or **$1.50/1k pages** (Google Vision)

**Verdict**: ✅ **Highly Recommended** - Smart cost optimization for high-volume processing

---

## Technical Feasibility Analysis

### ✅ Strengths

1. **Cost Efficiency**
   - Eliminates "AI Tax" (per-token LLM costs)
   - 90% free for digital PDFs
   - Minimal cost for scanned documents
   - Scales to 1,000+ contracts economically

2. **Performance**
   - Digital extraction: **Instant** (milliseconds)
   - No heavy libraries (avoids Tesseract.js memory issues)
   - Serverless architecture (Supabase Edge Functions)

3. **Architecture Fit**
   - Aligns with existing Supabase Edge Function pattern
   - Minimal frontend changes required
   - Maintains existing response format compatibility

4. **Scalability**
   - Serverless = auto-scaling
   - No infrastructure management
   - Handles high volumes efficiently

### ⚠️ Considerations

1. **Library Compatibility**
   - `pdf-text` via JSR (@pdf/pdftext@1.3.2) - Need to verify Deno compatibility
   - Alternative: `pdfjs-dist` (more mature, but larger)
   - **Recommendation**: Test both libraries

2. **OCR Fallback Reliability**
   - OCR.space free tier: 500 reqs/day limit
   - May need upgrade path for high-volume days
   - Google Vision: $1.50/1k pages (backup option)

3. **Parser Limitations**
   - Regex-based parsing has inherent limitations
   - May miss variations in contract formats
   - Requires manual review step (already implemented ✅)

4. **Edge Function Limits**
   - Supabase Edge Functions: 150MB memory limit
   - 60-second timeout limit
   - Large PDFs may hit limits (mitigated by 100MB file limit)

---

## Architecture Comparison

### Current System (Flavius API)
```
Frontend → Edge Function → Flavius API → Text → Parser → Review
Cost: Per-token AI pricing
Speed: ~2-5 seconds
Reliability: High (external service)
```

### Proposed System (Hybrid)
```
Frontend → Edge Function → pdf-text (free) → Text → Parser → Review
                                    ↓ (if empty)
                              OCR.space (fallback)
Cost: $0 (90%) or minimal (10%)
Speed: ~100ms (digital) or ~2-3s (OCR)
Reliability: High (self-hosted + fallback)
```

---

## Implementation Analysis

### 1. Edge Function Code Review

**Proposed Code Structure**: ✅ **Good**
- Clean waterfall logic
- Proper error handling
- CORS headers included
- Authentication verified

**Issues to Address**:

1. **Library Import**
   ```typescript
   import { pdfText } from 'jsr:@pdf/pdftext@1.3.2';
   ```
   - ⚠️ Need to verify JSR package exists and works in Deno
   - **Alternative**: Use `pdfjs-dist` via CDN or npm specifier

2. **OCR.space API**
   ```typescript
   const ocrFormData = new FormData();
   ocrFormData.append('file', file);
   ocrFormData.append('apikey', Deno.env.get('OCR_SPACE_KEY') ?? 'helloworld');
   ```
   - ✅ Good fallback logic
   - ⚠️ 'helloworld' is demo key (should be removed in production)
   - ✅ Turkish language support (`language: 'tur'`)

3. **Text Quality Check**
   ```typescript
   if (rawText.length < 50) {
     // Fallback to OCR
   }
   ```
   - ⚠️ 50 chars threshold may be too low
   - **Recommendation**: Check for meaningful text patterns, not just length
   - Consider: Check for Turkish characters, contract keywords

### 2. Parser Enhancement Review

**Proposed Regex Improvements**: ✅ **Better than current**

**Current Parser Issues**:
- Basic patterns
- May miss variations
- Limited Turkish character support

**Proposed Improvements**:
```typescript
tenantName: text.match(/(?:Kiracı|KİRACI)\s*[:\-\.]?\s*([A-ZİĞÜŞÖÇ\s]{3,})/i)?.[1]?.trim()
```
- ✅ More flexible separators (`[:\-\.]?`)
- ✅ Better Turkish character support
- ⚠️ Still regex-based (inherent limitations)

**Additional Recommendations**:

1. **Multi-Pattern Matching**
   - Try multiple patterns per field
   - Return best match (highest confidence)

2. **Context-Aware Extraction**
   - Look for section headers before fields
   - Extract from structured tables if present

3. **Validation Layer**
   - Validate extracted dates (reasonable ranges)
   - Validate amounts (positive numbers)
   - Validate names (min length, character patterns)

---

## Real-World Contract Analysis

### Standard Turkish Rental Contract Structure

Based on analysis of `BOŞ KİRA SÖZLEŞMESİ.pdf` (official Turkish rental contract template):

#### **Contract Structure**:

1. **Header Table** (Structured fields):
   ```
   | NUMARASI | [contract number] |
   | MAHALLESI/ILÇE/IL | [neighborhood/district/city] |
   | SOKAĞI/NUMARASI | [street/number] |
   | KIRALANAN ŞEYIN CINSI | [property type] |
   | KIRAYA VERENIN ADI SOYADI | [landlord name] |
   | KIRACININ ADI SOYADI | [tenant name] |
   | KIRACININ IKAMETGAHI | [tenant address] |
   | KIRACININ TELEFONU | [tenant phone] |
   | BİR AYLIK KİRA KARŞILIĞI | [monthly rent] |
   | BİR SENELİK KİRA KARŞILIĞI | [annual rent] |
   | KIRANIN NE ŞEKILDE ÖDENECEĞi | IBAN: [iban] |
   | KİRA MÜDDETI | [duration] |
   | KIRANIN BAŞLANGICI | [start date] |
   | DEPOZITO | [deposit] |
   | KIRALANAN MECURUN NE IÇiN KULLANILACAĞI | [usage purpose] |
   ```

2. **GENEL ŞARTLAR** (General Terms) - 13 standard clauses
3. **ÖZEL ŞARTLAR** (Special Terms) - 19 custom clauses
4. **TAHLİY TAAHHÜTNAMESİ** (Eviction Commitment) - Additional fields:
   - Taahhüt Edenin Adı Soyadı (Commitment maker name)
   - Taahhüt Edenin TC kimlik Numarası (TC ID)
   - Mal Sahibinin Adı Soyadı (Property owner name)
   - Tahliye Edilecek Kiralananın Adresi (Eviction address)
   - Tahliye Tarihi (Eviction date)

### Enhanced Parser Patterns (Based on Real Contract)

**Critical Fields from Standard Contract**:

```typescript
// 1. Contract Number
contractNumber: text.match(/(?:NUMARASI|Numara|Sözleşme\s*No)[\s:]+([A-Z0-9\-]+)/i)?.[1]?.trim()

// 2. Property Address (Multi-part extraction)
// Part 1: Neighborhood/District/City
mahalle: text.match(/(?:MAHALLESI|Mahallesi)[\s/]+([^/]+)[\s/]+(?:ILÇE|İlçe)[\s/]+([^/]+)[\s/]+(?:IL|İl)[\s/]+([^|\n]+)/i)
// Part 2: Street/Number
sokak: text.match(/(?:SOKAĞI|Sokağı)[\s/]+(?:NUMARASI|Numarası)[\s:]+([^|\n]+)/i)

// 3. Property Type
propertyType: text.match(/(?:KIRALANAN\s*ŞEYIN\s*CINSI|Kiralanan\s*Şeyin\s*Cinsi)[\s:]+([^|\n]+)/i)?.[1]?.trim()

// 4. Landlord Name + TC (TC is embedded in name field!)
// Pattern 1: Extract full field (name + TC together)
const ownerField = text.match(/(?:KIRAYA\s*VERENIN\s*ADI\s*SOYADI|Kiraya\s*Verenin\s*Adı\s*Soyadı)[\s:]+([A-ZİĞÜŞÖÇ\s]+\s+\d{11})/i)?.[1]?.trim()
// Pattern 2: Split name and TC
if (ownerField) {
  const ownerMatch = ownerField.match(/^(.+?)\s+(\d{11})$/);
  ownerName = ownerMatch?.[1]?.trim();
  ownerTC = ownerMatch?.[2]?.trim();
}

// 5. Tenant Name + TC (TC is embedded in name field!)
// Pattern 1: Extract full field (name + TC together)
const tenantField = text.match(/(?:KIRACININ\s*ADI\s*SOYADI|Kiracının\s*Adı\s*Soyadı)[\s:]+([A-ZİĞÜŞÖÇ\s]+\s+\d{11})/i)?.[1]?.trim()
// Pattern 2: Split name and TC
if (tenantField) {
  const tenantMatch = tenantField.match(/^(.+?)\s+(\d{11})$/);
  tenantName = tenantMatch?.[1]?.trim();
  tenantTC = tenantMatch?.[2]?.trim();
}

// 6. Tenant Address
tenantAddress: text.match(/(?:KIRACININ\s*IKAMETGAHI|Kiracının\s*İkametgahı)[\s:]+([^|\n]+)/i)?.[1]?.trim()

// 7. Tenant Phone
tenantPhone: text.match(/(?:KIRACININ\s*TELEFONU|Kiracının\s*Telefonu)[\s:]+([0-9\s\-\(\)]+)/i)?.[1]?.trim()

// 8. Monthly Rent (Multiple formats)
monthlyRent: text.match(/(?:BİR\s*AYLIK\s*KİRA\s*KARŞILIĞI|Bir\s*Aylık\s*Kira\s*Karşılığı|Aylık\s*Kira)[\s:]+(?:RAKAM\s*İLE)?[\s:]*([\d\.,]+)\s*(?:TL|TRY|₺)?/i)?.[1]

// 9. Annual Rent
annualRent: text.match(/(?:BİR\s*SENELİK\s*KİRA\s*KARŞILIĞI|Bir\s*Senelik\s*Kira\s*Karşılığı)[\s:]+(?:RAKAM\s*İLE)?[\s:]*([\d\.,]+)\s*(?:TL|TRY|₺)?/i)?.[1]

// 10. IBAN (Location TBD - assume not in contract for now)
// TODO: Add IBAN extraction pattern when location is known
// For now: Return empty, user will add manually in review step
iban: null // Will be extracted when location is confirmed

// 11. Rental Duration
rentalDuration: text.match(/(?:KİRA\s*MÜDDETI|Kira\s*Müddeti)[\s:]+([^|\n]+)/i)?.[1]?.trim()

// 12. Start Date
startDate: text.match(/(?:KIRANIN\s*BAŞLANGICI|Kiranın\s*Başlangıcı|Başlangıç\s*Tarihi)[\s:]+(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4})/i)?.[1]

// 13. Deposit
deposit: text.match(/(?:DEPOZITO|Depozito|Teminat)[\s:]+([\d\.,]+)\s*(?:TL|TRY|₺)?/i)?.[1]

// 14. Usage Purpose
usagePurpose: text.match(/(?:KIRALANAN\s*MECURUN\s*NE\s*IÇiN\s*KULLANILACAĞI|Kullanım\s*Amacı)[\s:]+([^|\n]+)/i)?.[1]?.trim()

// 15. End Date (Calculate from start + duration, or find in text)
endDate: text.match(/(?:Bitiş\s*Tarihi|Kira\s*Bitiş)[\s:]+(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4})/i)?.[1]
```

### Table Structure Recognition

**Key Insight**: The standard contract uses a **table format** at the top. PDF text extraction may preserve this structure as:
- Pipe-separated values (`|`)
- Newline-separated rows
- Label-value pairs

**Recommendation**: Add table parsing logic:

```typescript
function parseTableStructure(text: string): Record<string, string> {
  const table: Record<string, string> = {};
  
  // Look for table pattern: | LABEL | VALUE |
  const tableRows = text.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g);
  
  if (tableRows) {
    tableRows.forEach(row => {
      const match = row.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
      if (match) {
        const label = match[1].trim();
        const value = match[2].trim();
        // Map labels to field names
        if (label.includes('KIRACININ ADI')) table.tenantName = value;
        if (label.includes('KIRAYA VERENIN')) table.ownerName = value;
        // ... etc
      }
    });
  }
  
  return table;
}
```

### Parser Priority Strategy

**Recommended Extraction Order**:

1. **Try Table Structure First** (if detected)
   - Most reliable for standard contracts
   - Preserves exact field mapping

2. **Fallback to Regex Patterns**
   - For non-standard formats
   - Multiple patterns per field

3. **Context-Aware Extraction**
   - Look for section headers
   - Extract from "ÖZEL ŞARTLAR" for special conditions

4. **Validation & Normalization**
   - Normalize phone numbers (remove spaces, format)
   - Normalize IBAN (remove spaces, add TR prefix)
   - Parse dates (handle dd.mm.yyyy, dd/mm/yyyy)
   - Parse amounts (handle Turkish number format: 15.000,00)

### Critical Improvements Needed

1. **IBAN Extraction** - Currently missing, critical for payment
2. **Property Type** - Currently missing, needed for categorization
3. **Usage Purpose** - Currently missing (Mesken/İşyeri)
4. **Table Recognition** - Handle structured table format
5. **Multi-format Date Parsing** - Handle Turkish date formats
6. **Amount Normalization** - Handle Turkish number format (15.000,00 → 15000.00)

---

## Cost Analysis

### Scenario: 1,000 Contracts/Month

**Current System (Flavius API)**:
- Assumed: $0.01 per contract (example)
- **Monthly Cost**: ~$10-50 (varies by token usage)

**Proposed System (Hybrid)**:
- 900 digital PDFs: **$0** (free extraction)
- 100 scanned PDFs: 
  - OCR.space Free: **$0** (if under 500/day limit)
  - Google Vision: **$0.15** ($1.50/1k pages × 100)
- **Monthly Cost**: **$0-0.15** (99.7% cost reduction)

**Break-Even Analysis**:
- Even with OCR.space Pro ($25/month): Still 50-80% cheaper
- At 5,000 contracts/month: Still 90%+ cheaper

---

## Migration Plan

### Phase 1: Edge Function Development
- [ ] Create new function: `extract-contract-data`
- [ ] Test `pdf-text` library in Deno environment
- [ ] Implement OCR.space fallback
- [ ] Add proper error handling
- [ ] Test with sample PDFs (digital + scanned)

### Phase 2: Parser Enhancement
- [ ] Update `parseContractFromText()` with improved regex
- [ ] Add table structure recognition (for standard contract format)
- [ ] **CRITICAL**: Add TC extraction from name fields (embedded parsing)
  - Split name field: extract last 11 digits as TC, rest as name
  - Handle both tenant and owner name+TC fields
- [ ] Add property type extraction (`Kiralanan Şeyin Cinsi`)
- [ ] Add usage purpose extraction (`KIRALANAN MECURUN NE İÇİN KULLANILACAĞI`)
- [ ] Make IBAN optional in import flow (not always in contract)
  - Update import form schema to allow empty IBAN
  - Show warning message if missing
- [ ] Add owner phone extraction (when location is confirmed)
- [ ] Add multi-pattern matching per field
- [ ] Add Turkish number format normalization (15.000,00 → 15000.00)
- [ ] Add multi-format date parsing (dd.mm.yyyy, dd/mm/yyyy)
- [ ] Add validation layer
- [ ] Test with standard Turkish contract format (`BOŞ KİRA SÖZLEŞMESİ.pdf`)
- [ ] Test with various contract formats

### Phase 3: Service Integration
- [ ] Update `extractTextFromFileViaProxy()` to call new function
- [ ] Maintain backward compatibility (response format)
- [ ] Update error messages if needed

### Phase 4: Testing & Deployment
- [ ] Test with real contract PDFs
- [ ] Monitor OCR fallback usage
- [ ] Set up OCR.space API key (free tier)
- [ ] Deploy Edge Function
- [ ] Update documentation

### Phase 5: Monitoring
- [ ] Track extraction method (digital vs OCR)
- [ ] Monitor OCR.space usage (stay under 500/day)
- [ ] Set up alerts for high OCR usage
- [ ] Plan upgrade path if needed

---

## Risk Assessment

### Low Risk ✅
- Digital PDF extraction (proven technology)
- Edge Function deployment (standard Supabase)
- Parser enhancement (regex improvements)

### Medium Risk ⚠️
- OCR.space free tier limits (500/day)
- Library compatibility (pdf-text in Deno)
- Large PDF handling (memory limits)

### Mitigation Strategies
1. **OCR Limits**: Monitor usage, upgrade to Pro if needed ($25/month)
2. **Library Issues**: Have `pdfjs-dist` as backup
3. **Memory Limits**: Add file size checks, optimize processing

---

## Recommendations

### 1. **Library Choice** (Priority: High)
**Option A**: `pdf-text` (JSR) - Lightweight, Deno-native
- ✅ Smaller bundle
- ⚠️ Less mature, need to verify

**Option B**: `pdfjs-dist` (Mozilla) - Battle-tested
- ✅ Proven reliability
- ✅ Better PDF support
- ⚠️ Larger bundle size

**Recommendation**: Start with `pdf-text`, have `pdfjs-dist` as fallback

### 2. **OCR Provider** (Priority: Medium)
**Primary**: OCR.space (Free tier)
- 500 requests/day
- Turkish language support
- Table extraction support

**Backup**: Google Cloud Vision
- $1.50 per 1,000 pages
- Better accuracy
- Higher cost but reliable

**Recommendation**: Use OCR.space, monitor usage, upgrade if needed

### 3. **Parser Strategy** (Priority: High)
**Current**: Basic regex
**Proposed**: Enhanced regex
**Future**: Consider AI-assisted parsing for edge cases

**Recommendation**: 
- Implement enhanced regex now
- Keep manual review step (already exists)
- Consider AI parsing for failed extractions later

### 4. **Error Handling** (Priority: Medium)
- Add specific error messages for:
  - Empty text extraction
  - OCR failures
  - Invalid file formats
  - Timeout errors

### 5. **Monitoring** (Priority: Low)
- Track extraction method (digital vs OCR)
- Monitor OCR usage
- Track parser success rate
- Log failed extractions for improvement

---

## Code Quality Improvements

### Proposed Edge Function Enhancements

1. **Better Text Quality Detection**
   ```typescript
   // Instead of just length check
   const hasMeaningfulText = rawText.length > 50 && 
     /[A-ZİĞÜŞÖÇa-zığüşöç]{3,}/.test(rawText);
   ```

2. **Retry Logic for OCR**
   ```typescript
   // Retry OCR once if first attempt fails
   let ocrAttempts = 0;
   while (ocrAttempts < 2 && rawText.length < 50) {
     // OCR call
     ocrAttempts++;
   }
   ```

3. **Metadata Tracking**
   ```typescript
   return {
     success: true,
     text: rawText,
     method: isOCR ? "OCR_FALLBACK" : "DIGITAL_EXTRACTION",
     metadata: {
       filename: file.name,
       fileSize: file.size,
       extractionTime: Date.now() - startTime,
       pageCount: pageCount, // if available
     }
   };
   ```

---

## Testing Strategy

### Unit Tests Needed
- [ ] Digital PDF extraction
- [ ] Scanned PDF OCR fallback
- [ ] Parser regex patterns
- [ ] Error handling

### Integration Tests Needed
- [ ] End-to-end contract import flow
- [ ] Edge Function deployment
- [ ] OCR.space API integration
- [ ] Response format compatibility

### Test Cases
1. **Standard Turkish Contract** (`BOŞ KİRA SÖZLEŞMESİ.pdf`)
   - Expected: Extract all 15+ fields from header table
   - Verify: Table structure recognition, field mapping accuracy
   - Critical: IBAN, property type, usage purpose extraction

2. **Digital PDF** (Word-generated)
   - Expected: Instant extraction, no OCR
   - Verify: Text quality, parser accuracy

3. **Scanned PDF** (Image-based)
   - Expected: OCR fallback triggered
   - Verify: OCR accuracy, Turkish support

4. **Mixed PDF** (Some text, some images)
   - Expected: Digital extraction + OCR for images
   - Verify: Combined text quality

5. **Edge Cases**
   - Large files (near 100MB limit)
   - Corrupted PDFs
   - Non-PDF files
   - Empty PDFs
   - Contracts with missing fields
   - Contracts with non-standard formats

---

## Conclusion

### ✅ **Approve Implementation**

**Reasons**:
1. **Cost Efficiency**: 99%+ cost reduction
2. **Performance**: Faster for digital PDFs
3. **Scalability**: Handles high volumes
4. **Maintainability**: Self-hosted, no external dependencies
5. **Flexibility**: Easy to upgrade OCR provider

### Next Steps
1. **Verify Library**: Test `pdf-text` in Deno environment
2. **Get OCR Key**: Sign up for OCR.space free tier
3. **Implement**: Create Edge Function with proposed logic
4. **Enhance Parser**: Update regex patterns
5. **Test**: Comprehensive testing with real contracts
6. **Deploy**: Gradual rollout with monitoring

---

## Questions to Resolve

1. **Library Verification**: Does `pdf-text` work in Deno Edge Functions?
   - **Action**: Test in Supabase Edge Function environment

2. **OCR Provider**: OCR.space vs Google Vision?
   - **Recommendation**: Start with OCR.space, upgrade if needed

3. **Parser Enhancement**: Regex-only or add AI later?
   - **Recommendation**: Enhanced regex now, AI for edge cases later

4. **Monitoring**: What metrics to track?
   - **Recommendation**: Extraction method, success rate, OCR usage

---

---

## Real Contract Field Mapping

### Standard Contract Fields → Database Fields

| Contract Field (Turkish) | Database Field | Priority | Current Status |
|-------------------------|----------------|----------|----------------|
| KIRACININ ADI SOYADI | `tenant_name` | ✅ Critical | ✅ Extracted |
| KIRACININ TELEFONU | `tenant_phone` | ✅ Critical | ✅ Extracted |
| KIRACININ IKAMETGAHI | `tenant_address` | ✅ Critical | ✅ Extracted |
| KIRACININ TC | `tenant_tc` | ✅ Critical | ⚠️ **EMBEDDED IN NAME FIELD** |
| KIRAYA VERENIN ADI SOYADI | `owner_name` | ✅ Critical | ✅ Extracted |
| KIRAYA VERENIN TELEFONU | `owner_phone` | ✅ Critical | ⚠️ **LOCATION TBD** |
| KIRAYA VERENIN IBAN | `owner_iban` | ⚠️ Important | ⚠️ **LOCATION TBD** (Optional for now) |
| MAHALLESI/ILÇE/IL | `property_address` (components) | ✅ Critical | ⚠️ Partial |
| SOKAĞI/NUMARASI | `property_address` (components) | ✅ Critical | ⚠️ Partial |
| BİR AYLIK KİRA KARŞILIĞI | `rent_amount` | ✅ Critical | ✅ Extracted |
| DEPOZITO | `deposit` | ✅ Critical | ✅ Extracted |
| KIRANIN BAŞLANGICI | `start_date` | ✅ Critical | ✅ Extracted |
| KİRA MÜDDETI | `end_date` (calculated) | ✅ Critical | ⚠️ Partial |
| KIRALANAN ŞEYIN CINSI | `property_type` | ⚠️ Important | ❌ **MISSING** |
| KIRALANAN MECURUN NE IÇiN KULLANILACAĞI | `use_purpose` | ⚠️ Important | ❌ **MISSING** |
| NUMARASI | `contract_number` | ⚠️ Nice to have | ❌ Missing |
| BİR SENELİK KİRA KARŞILIĞI | `annual_rent` | ⚠️ Nice to have | ❌ Missing |

### Missing Critical Fields - Action Required

1. **TC Numbers (Embedded in Name Fields)** - **CRITICAL** ⚠️
   - **Location**: Written IN the name column, not separate
   - **Pattern**: `KIRACININ ADI SOYADI` contains: `"Ali Veli 12345678901"`
   - **Extraction**: Split field - last 11 digits = TC, rest = name
   - **Pattern**: `([A-ZİĞÜŞÖÇ\s]+)\s+(\d{11})` (name + TC)
   - **Impact**: Critical for duplicate detection, legal requirement
   - **Same for Owner**: `KIRAYA VERENIN ADI SOYADI` contains name + TC

2. **Property Type** - **CONFIRMED** ✅
   - **Field**: `Kiralanan Şeyin Cinsi` = Property Type
   - **Pattern**: `KIRALANAN\s*ŞEYIN\s*CINSI[^|]*\|[^|]*\|[^|]*\|([^|\n]+)`
   - **Values**: "Daire", "Villa", "İşyeri", etc.
   - **Impact**: Property categorization

3. **Usage Purpose** - **CONFIRMED** ✅
   - **Field**: `KIRALANAN MECURUN NE İÇİN KULLANILACAĞI` = Usage Purpose
   - **Pattern**: `KIRALANAN\s*MECURUN\s*NE\s*IÇiN\s*KULLANILACAĞI[^|]*\|[^|]*\|[^|]*\|([^|\n]+)`
   - **Values**: "Mesken", "İşyeri"
   - **Impact**: Legal compliance, tax implications

4. **IBAN** - **LOCATION UNKNOWN** ⚠️
   - **Status**: User will learn location later
   - **Current Plan**: Assume NOT in contract for now
   - **Impact Assessment**: 
     - ⚠️ **ISSUE**: IBAN is currently REQUIRED in contract form schema
     - **Solution**: Make IBAN optional in import flow (user can add manually)
     - **Future**: Add IBAN extraction when location is known
   - **Recommendation**: 
     - Make `owner_iban` optional in import review form
     - Show warning if missing: "IBAN not found, please add manually"
     - Allow contract creation without IBAN (user fills in review step)

5. **Owner Phone** - **LOCATION TBD** ⚠️
   - **Status**: Will be added to contract, location TBD
   - **Impact**: Medium priority
   - **Action**: Add extraction pattern once location is known
   - **Pattern**: `KIRAYA\s*VERENIN\s*TELEFONU[^|]*\|[^|]*\|[^|]*\|([0-9\s\-\(\)]+)`

---

**Last Updated**: 2025-01-25
**Status**: ✅ Approved for Implementation
**Priority**: High (Cost optimization for high-volume processing)
**Real Contract Analysis**: ✅ Complete (Based on `BOŞ KİRA SÖZLEŞMESİ.pdf`)

