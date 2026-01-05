-- =====================================================
-- ORG MIGRATION - PHASE 2.1: Drop Old RLS Policies
-- =====================================================
--
-- This migration drops all existing RLS policies on the 14
-- business tables that will be replaced with org-based policies.
--
-- Tables: properties, tenants, contracts, contract_details,
-- property_owners, property_inquiries, inquiry_matches, meetings,
-- financial_transactions, commissions, recurring_expenses,
-- expense_categories, contract_clause_templates, contract_clause_overrides
--
-- Also updates: property_photos (joins via properties.org_id)
--
-- IMPORTANT: Run this AFTER Phase 1.4 (NOT NULL constraints)
--
-- ROLLBACK: Re-run the original migration files to recreate old policies
--
-- =====================================================

-- ============================================
-- 1. Drop policies on properties table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can update properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can delete properties" ON properties;
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;

-- ============================================
-- 2. Drop policies on tenants table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view tenants" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can update tenants" ON tenants;
DROP POLICY IF EXISTS "Authenticated users can delete tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can insert their own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can update their own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can delete their own tenants" ON tenants;

-- ============================================
-- 3. Drop policies on contracts table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can create contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can update contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can delete contracts" ON contracts;
DROP POLICY IF EXISTS "Users can view their own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can insert their own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update their own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can delete their own contracts" ON contracts;

-- ============================================
-- 4. Drop policies on contract_details table
-- ============================================
DROP POLICY IF EXISTS "Users can view their own contract details" ON contract_details;
DROP POLICY IF EXISTS "Users can insert their own contract details" ON contract_details;
DROP POLICY IF EXISTS "Users can update their own contract details" ON contract_details;
DROP POLICY IF EXISTS "Users can delete their own contract details" ON contract_details;

-- ============================================
-- 5. Drop policies on property_owners table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view property owners" ON property_owners;
DROP POLICY IF EXISTS "Authenticated users can create property owners" ON property_owners;
DROP POLICY IF EXISTS "Authenticated users can update property owners" ON property_owners;
DROP POLICY IF EXISTS "Authenticated users can delete property owners" ON property_owners;
DROP POLICY IF EXISTS "Users can view their own property owners" ON property_owners;
DROP POLICY IF EXISTS "Users can insert their own property owners" ON property_owners;
DROP POLICY IF EXISTS "Users can update their own property owners" ON property_owners;
DROP POLICY IF EXISTS "Users can delete their own property owners" ON property_owners;

-- ============================================
-- 6. Drop policies on property_inquiries table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "Authenticated users can update inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "Authenticated users can delete inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "Users can view their own inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "Users can insert their own inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "Users can update their own inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "Users can delete their own inquiries" ON property_inquiries;

-- ============================================
-- 7. Drop policies on inquiry_matches table
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view matches" ON inquiry_matches;
DROP POLICY IF EXISTS "Authenticated users can create matches" ON inquiry_matches;
DROP POLICY IF EXISTS "Authenticated users can update matches" ON inquiry_matches;
DROP POLICY IF EXISTS "Authenticated users can delete matches" ON inquiry_matches;
DROP POLICY IF EXISTS "Users can view their own matches" ON inquiry_matches;
DROP POLICY IF EXISTS "Users can insert their own matches" ON inquiry_matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON inquiry_matches;
DROP POLICY IF EXISTS "Users can delete their own matches" ON inquiry_matches;

-- ============================================
-- 8. Drop policies on meetings table
-- ============================================
DROP POLICY IF EXISTS "Users can view their own meetings." ON meetings;
DROP POLICY IF EXISTS "Users can insert their own meetings." ON meetings;
DROP POLICY IF EXISTS "Users can update their own meetings." ON meetings;
DROP POLICY IF EXISTS "Users can delete their own meetings." ON meetings;

-- ============================================
-- 9. Drop policies on financial_transactions table
-- ============================================
DROP POLICY IF EXISTS "Users can view own financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can insert own financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can update own financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Users can delete own financial transactions" ON financial_transactions;

-- ============================================
-- 10. Drop policies on commissions table
-- ============================================
DROP POLICY IF EXISTS "Users can view their own commissions" ON commissions;
DROP POLICY IF EXISTS "Users can insert their own commissions" ON commissions;
DROP POLICY IF EXISTS "Users can update their own commissions" ON commissions;
DROP POLICY IF EXISTS "Users can delete their own commissions" ON commissions;

-- ============================================
-- 11. Drop policies on recurring_expenses table
-- ============================================
DROP POLICY IF EXISTS "Users can view own recurring expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "Users can insert own recurring expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "Users can update own recurring expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "Users can delete own recurring expenses" ON recurring_expenses;

-- ============================================
-- 12. Drop policies on expense_categories table
-- ============================================
DROP POLICY IF EXISTS "Users can view own and default categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON expense_categories;

-- ============================================
-- 13. Drop policies on contract_clause_templates table
-- ============================================
DROP POLICY IF EXISTS "Users can view their own clause templates" ON contract_clause_templates;
DROP POLICY IF EXISTS "Users can insert their own clause templates" ON contract_clause_templates;
DROP POLICY IF EXISTS "Users can update their own clause templates" ON contract_clause_templates;
DROP POLICY IF EXISTS "Users can delete their own clause templates" ON contract_clause_templates;

-- ============================================
-- 14. Drop policies on contract_clause_overrides table
-- ============================================
DROP POLICY IF EXISTS "Users can view their own clause overrides" ON contract_clause_overrides;
DROP POLICY IF EXISTS "Users can insert their own clause overrides" ON contract_clause_overrides;
DROP POLICY IF EXISTS "Users can update their own clause overrides" ON contract_clause_overrides;
DROP POLICY IF EXISTS "Users can delete their own clause overrides" ON contract_clause_overrides;

-- ============================================
-- 15. Drop policies on property_photos table
-- ============================================
-- These will be replaced with policies that join via properties.org_id
DROP POLICY IF EXISTS "Authenticated users can view property photos" ON property_photos;
DROP POLICY IF EXISTS "Authenticated users can upload property photos" ON property_photos;
DROP POLICY IF EXISTS "Authenticated users can update property photos" ON property_photos;
DROP POLICY IF EXISTS "Authenticated users can delete property photos" ON property_photos;
DROP POLICY IF EXISTS "Users can view photos of their properties" ON property_photos;
DROP POLICY IF EXISTS "Users can upload photos to their properties" ON property_photos;
DROP POLICY IF EXISTS "Users can update photos of their properties" ON property_photos;
DROP POLICY IF EXISTS "Users can delete photos of their properties" ON property_photos;

-- ============================================
-- Validation
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 2.1 Complete: Old RLS policies dropped';
  RAISE NOTICE '   Next: Run Phase 2.2 to create new org-based policies';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
