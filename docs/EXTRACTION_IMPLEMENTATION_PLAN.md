# Hybrid Text Extraction - Implementation Plan

## 🎯 Strategy: Parallel Development (Non-Breaking)

**Key Principles**:
- ✅ **Keep existing system intact** - Don't delete or modify current Edge Function
- ✅ **Build new system in parallel** - Create new Edge Function and service
- ✅ **Test with new UI** - Add new button/option for testing
- ✅ **Gradual migration** - Replace old system only after validation

**Why This Approach?**
- 🛡️ Zero risk to production - old system keeps working
- 🧪 Safe testing - can test new system without affecting users
- 🔄 Easy rollback - can revert if issues found
- 📊 Compare both systems side-by-side

---

## 📋 Implementation Phases

### **Phase 1: Backend (Edge Function)** 🏗️
**Goal**: Build the extraction engine that works independently

### **Phase 2: Bridge (Service Layer)** 🌉
**Goal**: Connect Edge Function to frontend service

### **Phase 3: Frontend Integration** 🎨
**Goal**: Update UI to use new extraction system

### **Phase 4: Parser Enhancement** 🔍
**Goal**: Improve data extraction from text

### **Phase 5: Testing & Deployment** ✅
**Goal**: Validate everything works end-to-end

---

## Phase 1: Backend (Edge Function) 🏗️

### **Goal**: Create NEW `extract-contract-data` Edge Function (parallel to existing)

### **Important**: 
- ⚠️ **DO NOT** modify existing `extract-text` function
- ✅ Create completely new function
- ✅ Keep old function running for current users

### **Tasks**:

#### 1.1 Create NEW Edge Function Structure
- [ ] Create new function: `supabase/functions/extract-contract-data/`
- [ ] Create `index.ts` with basic structure
- [ ] Set up CORS headers
- [ ] Add authentication (Supabase session verification)
- [ ] Add file upload handling (FormData parsing)
- [ ] **Verify**: Old `extract-text` function still exists and works

#### 1.2 Implement Digital PDF Extraction
- [ ] Test `pdf-text` library in Deno environment
  - Try: `import { pdfText } from 'jsr:@pdf/pdftext@1.3.2'`
  - If fails, try: `pdfjs-dist` via npm specifier
- [ ] Implement text extraction from PDF bytes
- [ ] Handle multi-page PDFs (join pages)
- [ ] Add error handling for extraction failures

#### 1.3 Implement OCR Fallback
- [ ] Set up OCR.space API integration
  - Get free API key from ocr.space
  - Add to Supabase secrets: `OCR_SPACE_KEY`
- [ ] Implement OCR fallback logic
  - Check if extracted text is meaningful (< 50 chars = fallback)
  - Call OCR.space API with Turkish language support
  - Handle OCR response parsing
- [ ] Add error handling for OCR failures

#### 1.4 Text Quality Detection
- [ ] Implement smart text quality check
  - Not just length, but meaningful content
  - Check for Turkish characters
  - Check for contract keywords
- [ ] Return extraction method metadata (DIGITAL_EXTRACTION vs OCR_FALLBACK)

#### 1.5 Response Format
- [ ] Standardize response format:
  ```typescript
  {
    success: boolean;
    text: string;
    method: "DIGITAL_EXTRACTION" | "OCR_FALLBACK";
    metadata: {
      filename: string;
      fileSize: number;
      extractionTime: number;
      pageCount?: number;
    }
  }
  ```

#### 1.6 Testing (Backend Only)
- [ ] Test with digital PDF (Word-generated)
  - Expected: Fast extraction, no OCR
- [ ] Test with scanned PDF (image-based)
  - Expected: OCR fallback triggered
- [ ] Test with large PDFs (near 100MB limit)
- [ ] Test with corrupted/invalid PDFs
- [ ] Test error handling

#### 1.7 Deploy & Verify
- [ ] Deploy Edge Function: `supabase functions deploy extract-contract-data`
- [ ] Set environment secrets: `supabase secrets set OCR_SPACE_KEY=your_key`
- [ ] Test deployed function with curl/Postman
- [ ] Verify response format matches specification

**Deliverable**: Working Edge Function that extracts text from PDFs ✅

---

## Phase 2: Bridge (Service Layer) 🌉

### **Goal**: Create NEW service function (parallel to existing)

### **Important**:
- ⚠️ **DO NOT** modify existing `extractTextFromFileViaProxy()` function
- ✅ Create new function: `extractTextFromFileViaProxyV2()` or `extractTextFromFileHybrid()`
- ✅ Keep old function for current system

### **Tasks**:

#### 2.1 Create NEW Service Function
- [ ] Create new function in `src/services/textExtraction.service.ts`:
  - Name: `extractTextFromFileHybrid()` (or similar)
  - Endpoint: `/functions/v1/extract-contract-data` (new function)
  - Same function signature as old one (for easy swap later)
  - Map new response format to existing `ExtractTextResponse` interface
  - Handle new metadata fields
- [ ] **Verify**: Old `extractTextFromFileViaProxy()` still exists and works

#### 2.2 Response Format Mapping
- [ ] Map Edge Function response to service response:
  ```typescript
  // Edge Function returns:
  { success, text, method, metadata }
  
  // Service returns (existing format):
  { success, text, needs_ocr, ocr_applied, ... }
  ```
- [ ] Map `method` to `needs_ocr` and `ocr_applied` flags
- [ ] Preserve backward compatibility

#### 2.3 Error Handling
- [ ] Update error messages if needed
- [ ] Handle Edge Function errors gracefully
- [ ] Maintain existing error format for frontend

#### 2.4 Testing (Service Layer)
- [ ] Test service function with mock Edge Function
- [ ] Test response format mapping
- [ ] Test error handling
- [ ] Verify backward compatibility

**Deliverable**: Service layer connected to new Edge Function ✅

---

## Phase 3: Frontend Integration (NEW UI) 🎨

### **Goal**: Add NEW button/option to test new extraction system

### **Important**:
- ⚠️ **DO NOT** modify existing contract import flow
- ✅ Add new option/button for testing
- ✅ Keep old import flow working

### **Tasks**:

#### 3.1 Add New Import Option
- [ ] Add new button/option in contract import page:
  - Label: "Import with New System" or "Try Hybrid Extraction"
  - Or: Toggle/switch to choose extraction method
- [ ] Create new import hook: `useContractImportHybrid()`
  - Uses new service function: `extractTextFromFileHybrid()`
  - Same UI flow, different backend

#### 3.2 Parallel Import Flows
- [ ] Keep existing `useContractImport()` hook (uses old system)
- [ ] Create new `useContractImportHybrid()` hook (uses new system)
- [ ] Both flows work independently

#### 3.3 Testing UI
- [ ] Add visual indicator showing which system is active
- [ ] Add comparison metrics (extraction time, method used)
- [ ] Allow switching between old and new system

#### 3.4 Verify Both Systems Work
- [ ] Test old import flow (should still work)
- [ ] Test new import flow (new button)
- [ ] Compare results side-by-side

**Deliverable**: Both systems working in parallel ✅

---

## Phase 4: Parser Enhancement 🔍

### **Goal**: Improve data extraction from extracted text

### **Tasks**:

#### 4.1 Update Parser Function
- [ ] Update `parseContractFromText()` in `src/services/textExtraction.service.ts`
- [ ] Add TC extraction from name fields
  - Pattern: Extract name field, split last 11 digits = TC
  - Handle both tenant and owner
- [ ] Add property type extraction (`Kiralanan Şeyin Cinsi`)
- [ ] Add usage purpose extraction (`KIRALANAN MECURUN NE İÇİN KULLANILACAĞI`)

#### 4.2 Table Structure Recognition
- [ ] Add table parsing logic (pipe-separated values)
- [ ] Map table labels to field names
- [ ] Fallback to regex if table not detected

#### 4.3 Enhanced Regex Patterns
- [ ] Add all 15+ field patterns from analysis
- [ ] Multi-pattern matching per field
- [ ] Better Turkish character support

#### 4.4 Data Normalization
- [ ] Turkish number format: `15.000,00` → `15000.00`
- [ ] Date parsing: Handle `dd.mm.yyyy` and `dd/mm/yyyy`
- [ ] Phone normalization
- [ ] IBAN normalization (when available)

#### 4.5 Validation Layer
- [ ] Validate extracted dates (reasonable ranges)
- [ ] Validate amounts (positive numbers)
- [ ] Validate names (min length, character patterns)
- [ ] Validate TC numbers (11 digits, checksum)

#### 4.6 Testing Parser
- [ ] Test with standard Turkish contract (`BOŞ KİRA SÖZLEŞMESİ.pdf`)
- [ ] Test TC extraction from name fields
- [ ] Test property type extraction
- [ ] Test usage purpose extraction
- [ ] Test with various contract formats

**Deliverable**: Enhanced parser extracting all critical fields ✅

---

## Phase 5: Import Form Updates 🎨

### **Goal**: Make IBAN optional, handle missing fields

### **Tasks**:

#### 5.1 Make IBAN Optional
- [ ] Update import review form schema
  - Make `owner_iban` optional in `ReviewFormData`
- [ ] Update validation
  - Remove required validation for IBAN in import flow
- [ ] Add warning message
  - Show: "IBAN not found, please add manually"
  - Display in review step if missing

#### 5.2 Handle Missing Fields
- [ ] Update form to handle optional fields gracefully
- [ ] Show clear indicators for missing fields
- [ ] Allow manual entry for all fields

**Deliverable**: Import form handles missing IBAN gracefully ✅

---

## Phase 6: Testing & Validation ✅

### **Goal**: Test new system thoroughly before migration

### **Tasks**:

#### 6.1 Parallel System Testing
- [ ] Test old system: Upload → Extract → Parse → Review → Create
- [ ] Test new system: Upload → Extract → Parse → Review → Create
- [ ] Compare results side-by-side
- [ ] Test with digital PDFs (both systems)
- [ ] Test with scanned PDFs (both systems)
- [ ] Test with standard Turkish contract (both systems)

#### 6.2 Edge Cases (New System)
- [ ] Large files (near 100MB)
- [ ] Corrupted PDFs
- [ ] Empty PDFs
- [ ] Contracts with missing fields
- [ ] Non-standard formats

#### 6.3 Performance Comparison
- [ ] Measure extraction time (old vs new)
- [ ] Compare accuracy (old vs new)
- [ ] Compare cost (old vs new)
- [ ] Test concurrent uploads

#### 6.4 User Acceptance Testing
- [ ] Test new system with real agents
- [ ] Collect feedback
- [ ] Compare user experience
- [ ] Iterate based on feedback

**Deliverable**: Validated new system ready for migration ✅

---

## Phase 7: Migration (After Validation) 🔄

### **Goal**: Replace old system with new one (only after validation)

### **Important**:
- ⚠️ **ONLY** do this after Phase 6 validation is successful
- ✅ Keep old code as backup (commented or in separate branch)
- ✅ Can rollback if issues found

### **Tasks**:

#### 7.1 Switch Service Function
- [ ] Update `extractTextFromFileViaProxy()` to call new Edge Function
  - Or: Rename new function to old name
  - Keep old function code as backup (commented)

#### 7.2 Update Frontend
- [ ] Remove new button/option
- [ ] Update `useContractImport()` to use new service
- [ ] Remove old import hook

#### 7.3 Cleanup (Optional)
- [ ] Archive old Edge Function (don't delete, just stop using)
- [ ] Update documentation
- [ ] Remove old code comments

#### 7.4 Monitor
- [ ] Monitor production for errors
- [ ] Track extraction success rate
- [ ] Monitor costs
- [ ] Set up alerts

**Deliverable**: Old system replaced, new system in production ✅

---

## 📊 Implementation Order Summary

```
1. Backend (NEW Edge Function)     → Week 1
   ├── Create NEW function (keep old)
   ├── Digital PDF extraction
   ├── OCR fallback
   └── Testing

2. Bridge (NEW Service Function)    → Week 1-2
   ├── Create NEW service function (keep old)
   ├── Response mapping
   └── Testing

3. Frontend (NEW UI Option)          → Week 2
   ├── Add new button/option
   ├── Create new import hook
   └── Test both systems

4. Parser Enhancement               → Week 2-3
   ├── TC extraction from names
   ├── Property type & usage purpose
   ├── Table recognition
   └── Testing

5. Import Form Updates              → Week 3
   ├── Make IBAN optional
   └── Handle missing fields

6. Testing & Validation             → Week 3-4
   ├── Compare both systems
   ├── Edge cases
   └── User acceptance

7. Migration (After Validation)     → Week 4+
   ├── Replace old system
   ├── Monitor production
   └── Cleanup
```

---

## 🔧 Technical Dependencies

### **Phase 1 Dependencies**:
- Supabase Edge Functions access
- OCR.space API key (free tier)
- Test PDF files (digital + scanned)
- **Existing `extract-text` function must remain untouched**

### **Phase 2 Dependencies**:
- Phase 1 complete (working NEW Edge Function)
- Existing service structure
- **Existing `extractTextFromFileViaProxy()` must remain untouched**

### **Phase 3 Dependencies**:
- Phase 2 complete (NEW service connected)
- Existing frontend components
- **Existing import flow must remain untouched**

### **Phase 4 Dependencies**:
- Phase 3 complete (extraction working)
- Real contract PDFs for testing

### **Phase 5 Dependencies**:
- Phase 4 complete (parser working)
- Form component access

---

## 🎯 Success Criteria

### **Phase 1 Success**:
- ✅ Edge Function extracts text from digital PDFs
- ✅ OCR fallback works for scanned PDFs
- ✅ Response format is standardized
- ✅ Function deployed and testable

### **Phase 2 Success**:
- ✅ NEW service function calls new Edge Function
- ✅ Response format mapped correctly
- ✅ Old service function still works
- ✅ Both functions available

### **Phase 3 Success**:
- ✅ NEW import option works end-to-end
- ✅ Old import flow still works
- ✅ Both systems work in parallel
- ✅ No breaking changes

### **Phase 4 Success**:
- ✅ TC extracted from name fields
- ✅ Property type extracted
- ✅ Usage purpose extracted
- ✅ All critical fields extracted

### **Phase 5 Success**:
- ✅ IBAN optional in import flow
- ✅ Missing fields handled gracefully
- ✅ User can manually add missing data

### **Phase 6 Success**:
- ✅ All tests pass (new system)
- ✅ Comparison shows new system is better
- ✅ No critical errors in new system
- ✅ Performance acceptable
- ✅ Ready for migration

### **Phase 7 Success**:
- ✅ Old system replaced
- ✅ New system in production
- ✅ No production errors
- ✅ Performance maintained or improved

---

## 🚨 Risk Mitigation

### **Risk 1: pdf-text library doesn't work in Deno**
- **Mitigation**: Have `pdfjs-dist` as backup
- **Action**: Test both libraries in Phase 1.2

### **Risk 2: OCR.space free tier limits**
- **Mitigation**: Monitor usage, upgrade to Pro if needed
- **Action**: Track OCR usage in Phase 1.3

### **Risk 3: Edge Function timeout (60s limit)**
- **Mitigation**: Optimize processing, add file size checks
- **Action**: Test with large files in Phase 1.6

### **Risk 4: Parser misses fields**
- **Mitigation**: Multi-pattern matching, manual review step
- **Action**: Comprehensive testing in Phase 4.6

---

## 📝 Notes

- **IBAN Location**: Will be added to parser when location is confirmed
- **Owner Phone Location**: Will be added to parser when location is confirmed
- **Library Choice**: Start with `pdf-text`, fallback to `pdfjs-dist` if needed
- **OCR Provider**: Start with OCR.space free tier, upgrade if needed

---

---

## 🛡️ Safety Guarantees

### **What We WON'T Touch**:
- ❌ Existing `extract-text` Edge Function (keep as-is)
- ❌ Existing `extractTextFromFileViaProxy()` service function
- ❌ Existing `useContractImport()` hook
- ❌ Existing contract import UI flow

### **What We WILL Create**:
- ✅ NEW `extract-contract-data` Edge Function
- ✅ NEW `extractTextFromFileHybrid()` service function
- ✅ NEW `useContractImportHybrid()` hook
- ✅ NEW UI button/option for testing

### **Migration Strategy**:
- 🔄 Test new system thoroughly
- 🔄 Compare with old system
- 🔄 Get user feedback
- 🔄 Only migrate after validation
- 🔄 Keep old code as backup

---

**Last Updated**: 2025-01-25
**Status**: Ready to Start - Phase 1 (Parallel Development)
**Estimated Timeline**: 3-4 weeks for implementation + 1 week for validation
**Approach**: Non-breaking, parallel development with gradual migration

