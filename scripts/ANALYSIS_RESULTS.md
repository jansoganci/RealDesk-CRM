# Scripts Folder Analysis Results

**Date:** 2026-01-09  
**Total SQL Files Found:** 22  
**Other Files Found:** 2 (1 shell script, 1 markdown)

---

## Analysis Table

| File Path | Purpose | Category | Recommendation | Reason |
|-----------|---------|----------|----------------|--------|
| `8-remaining-security-tests.sql` | Complete test suite with 8 security tests (C2, C2-Resurrect, C3, M1, M2, L3, Member, New User) | TEST_ARTIFACT | **KEEP** | Main comprehensive test suite - still useful for verification |
| `check-organizations-insert-policy.sql` | Diagnostic: Check organizations INSERT policy status and fix if needed | DIAGNOSTIC | **KEEP** | Reusable diagnostic for C1 test verification |
| `check-rls-context.sql` | Diagnostic: Check if RLS is enabled and user context (service role vs authenticated) | DIAGNOSTIC | **KEEP** | Reusable - helps verify test context before running tests |
| `check-storage-policies.sql` | Diagnostic: Verify storage bucket policies have org_id validation | DIAGNOSTIC | **KEEP** | Reusable - useful for storage policy health checks |
| `debug-c1-test.sql` | One-time debug script for C1 test failure | TEST_ARTIFACT | **DELETE** | One-time debug artifact - C1 is now tested in main suite |
| `diagnose-m2-issue.sql` | One-time comprehensive diagnostic for M2 test failure | TEST_ARTIFACT | **DELETE** | M2 is fixed and passing - no longer needed |
| `diagnose-property-photos-policies.sql` | One-time diagnostic: Check all policies on property_photos table | TEST_ARTIFACT | **DELETE** | M2 is fixed - diagnostic no longer needed |
| `fix-c1-org-insert-issue.sql` | One-time fix attempt for C1 issue (should be in migration) | TEST_ARTIFACT | **DELETE** | Fix should be in migration, not script - one-time artifact |
| `org-membership-diagnostic-queries.sql` | Diagnostic: Check users without org memberships (causes 406 errors) | DIAGNOSTIC | **KEEP** | Reusable - useful for troubleshooting user access issues |
| `remaining-security-tests-complete.sql` | Older version of complete test suite (791 lines) | TEST_ARTIFACT | **DELETE** | Superseded by `8-remaining-security-tests.sql` |
| `run-real-security-tests.sql` | Test runner script with test user discovery | TEST_ARTIFACT | **DELETE** | Superseded by `8-remaining-security-tests.sql` |
| `run-security-tests-now.sql` | Test runner script (older version) | TEST_ARTIFACT | **DELETE** | Superseded by `8-remaining-security-tests.sql` |
| `run-security-tests-v2.sql` | Test runner script (v2 version) | TEST_ARTIFACT | **DELETE** | Superseded by `8-remaining-security-tests.sql` |
| `test-c1-org-insert-blocked.sql` | Single test: C1 - Organization INSERT blocked | TEST_ARTIFACT | **DELETE** | Covered in `8-remaining-security-tests.sql` |
| `test-c2-resurrect-blocked.sql` | Single test: C2-Resurrect - Cannot set deleted_at = NULL | TEST_ARTIFACT | **DELETE** | Covered in `8-remaining-security-tests.sql` |
| `test-c2-soft-delete-protection.sql` | Single test: C2 - Soft-deleted records cannot be updated | TEST_ARTIFACT | **DELETE** | Covered in `8-remaining-security-tests.sql` |
| `test-m2-fix-verification.sql` | One-time verification test for M2 fix | TEST_ARTIFACT | **DELETE** | M2 is fixed and passing - verification complete |
| `test-m2-property-photos-deleted.sql` | Original M2 test (the one that was failing) | TEST_ARTIFACT | **DELETE** | M2 is fixed - original test no longer needed |
| `test-m2-with-context-check.sql` | Enhanced M2 test with context checking | TEST_ARTIFACT | **DELETE** | M2 is fixed - enhanced test no longer needed |
| `test-rpc-org-security.sql` | Test: RPC functions org security verification | TEST_ARTIFACT | **DELETE** | RPC functions are fixed - one-time verification complete |
| `test-storage-policies-security.sql` | Test: Storage policies security verification | TEST_ARTIFACT | **DELETE** | Storage policies are fixed - one-time verification complete |
| `verify-rpc-security-fix.sql` | Verification: RPC functions security fix check | TEST_ARTIFACT | **DELETE** | RPC functions are fixed - verification complete |
| `run-security-tests.sh` | Shell script: Interactive test runner using Supabase CLI | TEST_ARTIFACT | **DELETE** | Superseded - tests should run in SQL Editor, not CLI (CLI bypasses RLS) |
| `RUN_TESTS_INSTRUCTIONS.md` | Instructions: How to run security tests | DOCUMENTATION | **KEEP** | Useful reference - can be consolidated into README.md |

---

## Summary Statistics

### By Category

| Category | Count | Files |
|----------|-------|-------|
| **DIAGNOSTIC (KEEP)** | 5 | `check-organizations-insert-policy.sql`, `check-rls-context.sql`, `check-storage-policies.sql`, `org-membership-diagnostic-queries.sql`, `8-remaining-security-tests.sql` |
| **DOCUMENTATION (KEEP)** | 1 | `RUN_TESTS_INSTRUCTIONS.md` |
| **TEST_ARTIFACT (DELETE)** | 18 | All others (17 SQL + 1 shell script) |

### By Recommendation

| Recommendation | Count | Percentage |
|---------------|-------|------------|
| **KEEP** | 6 | 25.0% |
| **DELETE** | 18 | 75.0% |

---

## Files to DELETE (18 files)

1. `debug-c1-test.sql`
2. `diagnose-m2-issue.sql`
3. `diagnose-property-photos-policies.sql`
4. `fix-c1-org-insert-issue.sql`
5. `remaining-security-tests-complete.sql`
6. `run-real-security-tests.sql`
7. `run-security-tests-now.sql`
8. `run-security-tests-v2.sql`
9. `test-c1-org-insert-blocked.sql`
10. `test-c2-resurrect-blocked.sql`
11. `test-c2-soft-delete-protection.sql`
12. `test-m2-fix-verification.sql`
13. `test-m2-property-photos-deleted.sql`
14. `test-m2-with-context-check.sql`
15. `test-rpc-org-security.sql`
16. `test-storage-policies-security.sql`
17. `verify-rpc-security-fix.sql`
18. `run-security-tests.sh`

---

## Files to KEEP (6 files)

### 1. `8-remaining-security-tests.sql` ⭐ **MAIN TEST SUITE**
- **Purpose:** Complete test suite with 8 security tests
- **Why Keep:** Main comprehensive test suite - still useful for verification
- **Usage:** Run to verify all security tests pass

### 2. `check-organizations-insert-policy.sql` 🔍 **DIAGNOSTIC**
- **Purpose:** Check organizations INSERT policy status
- **Why Keep:** Reusable diagnostic for C1 test verification
- **Usage:** Run to check if C1 policy is correctly configured

### 3. `check-rls-context.sql` 🔍 **DIAGNOSTIC**
- **Purpose:** Check if RLS is enabled and user context
- **Why Keep:** Reusable - helps verify test context before running tests
- **Usage:** Run before tests to ensure RLS is active (not service role)

### 4. `check-storage-policies.sql` 🔍 **DIAGNOSTIC**
- **Purpose:** Verify storage bucket policies have org_id validation
- **Why Keep:** Reusable - useful for storage policy health checks
- **Usage:** Run to verify storage policies are correctly configured

### 5. `org-membership-diagnostic-queries.sql` 🔍 **DIAGNOSTIC**
- **Purpose:** Check users without org memberships (causes 406 errors)
- **Why Keep:** Reusable - useful for troubleshooting user access issues
- **Usage:** Run to find users who need org membership fixes

### 6. `RUN_TESTS_INSTRUCTIONS.md` 📖 **DOCUMENTATION**
- **Purpose:** Instructions on how to run security tests
- **Why Keep:** Useful reference - can be consolidated into README.md
- **Usage:** Reference guide for running tests

---

## Notes

### Why Delete Most Files?

1. **One-time test artifacts:** Many files were created to debug specific issues (M2, C1, RPC, Storage) that are now fixed
2. **Superseded files:** Multiple versions of test runners - only need the main comprehensive suite
3. **Single test files:** Individual test files are covered in the main `8-remaining-security-tests.sql` suite
4. **Verification complete:** RPC and Storage tests were one-time verifications that are complete

### Why Keep These 5 Files?

1. **Main test suite:** `8-remaining-security-tests.sql` is the comprehensive test suite
2. **Reusable diagnostics:** The 4 diagnostic files are useful for ongoing troubleshooting and health checks
3. **No duplication:** These files don't duplicate functionality

---

## Next Steps

1. ✅ **Review this analysis** - Confirm recommendations
2. ⏳ **Approve deletion list** - Confirm which files to delete
3. ⏳ **Create README.md** - Document remaining files and their usage
4. ⏳ **Delete approved files** - Clean up test artifacts

---

**Analysis Date:** 2026-01-09
