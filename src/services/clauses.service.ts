/**
 * Contract Clauses Service
 * Manages clause templates and per-contract overrides
 *
 * Architecture: Template System with Override Pattern
 * - Templates: Default clauses stored per user (33 total: 13 + 19 + 1)
 * - Overrides: Customized clauses stored per contract
 * - PDF Generation: Fetches merged result (override || template)
 */

import { supabase } from '@/config/supabase';
import { getAuthenticatedUserId } from '@/lib/auth';
import {
  GENEL_SARTLAR,
  OZEL_SARTLAR,
  TAHLIYE_TAAHHUTNAMESI_TEXT
} from '@/templates/contractContent';

// ============================================================================
// Types
// ============================================================================

export type ClauseType = 'GENEL_SARTLAR' | 'OZEL_SARTLAR' | 'TAHLIYE_TAAHHUTNAMESI';

export interface ClauseTemplate {
  id: string;
  user_id: string;
  clause_type: ClauseType;
  clause_index: number;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClauseOverride {
  id: string;
  contract_id: string;
  user_id: string;
  clause_type: ClauseType;
  clause_index: number;
  custom_content: string;
  created_at: string;
  updated_at: string;
}

export interface MergedClause {
  clause_type: ClauseType;
  clause_index: number;
  content: string;
  is_customized: boolean; // true if from override, false if from template
}

export interface ClauseOverrideInput {
  clause_type: ClauseType;
  clause_index: number;
  custom_content: string;
}

export interface TemplateVariables {
  paymentDay?: string;
  ownerIBAN?: string;
  ownerName?: string;
  tenantName?: string;
  contractDate?: string;
}

// ============================================================================
// Service Object (following ownersService pattern)
// ============================================================================

export const clausesService = {
  /**
   * Check if user has templates seeded
   */
  async hasTemplates(userId?: string): Promise<boolean> {
    const uid = userId || await getAuthenticatedUserId();

    const { count, error } = await supabase
      .from('contract_clause_templates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .limit(1);

    if (error) {
      console.error('[Clauses] hasTemplates error:', error);
      throw new Error(`Failed to check templates: ${error.message}`);
    }

    return (count || 0) > 0;
  },

  /**
   * Seed default templates from contractContent.ts
   * Called automatically on first contract form load
   * Seeds 33 clauses: 13 GENEL_SARTLAR + 19 OZEL_SARTLAR + 1 TAHLIYE_TAAHHUTNAMESI
   */
  async seedTemplatesForUser(userId?: string): Promise<void> {
    const uid = userId || await getAuthenticatedUserId();

    // Check if already seeded
    const alreadySeeded = await this.hasTemplates(uid);
    if (alreadySeeded) {
      console.log('[Clauses] Templates already seeded for user');
      return;
    }

    console.log('[Clauses] Seeding default templates for user...');

    const templates: Omit<ClauseTemplate, 'id' | 'created_at' | 'updated_at'>[] = [];

    // Seed GENEL_SARTLAR (13 clauses, indices 0-12)
    GENEL_SARTLAR.forEach((content, index) => {
      templates.push({
        user_id: uid,
        clause_type: 'GENEL_SARTLAR',
        clause_index: index,
        content,
        is_active: true,
      });
    });

    // Seed OZEL_SARTLAR (19 clauses, indices 0-18)
    OZEL_SARTLAR.forEach((content, index) => {
      let processedContent = content;

      // Special handling for clause 10 (index 9) - inject template variables
      // This clause needs payment details appended
      if (index === 9) {
        processedContent = content + ` Kiracı, aylık kira bedellerini her ayın {{paymentDay}}'inde peşin olarak {{ownerIBAN}} numaralı IBAN Hesabına {{ownerName}} adına yatıracaktır.`;
      }

      templates.push({
        user_id: uid,
        clause_type: 'OZEL_SARTLAR',
        clause_index: index,
        content: processedContent,
        is_active: true,
      });
    });

    // Seed TAHLIYE_TAAHHUTNAMESI (1 clause, index 0)
    templates.push({
      user_id: uid,
      clause_type: 'TAHLIYE_TAAHHUTNAMESI',
      clause_index: 0,
      content: TAHLIYE_TAAHHUTNAMESI_TEXT,
      is_active: true,
    });

    // Bulk insert (single query for performance)
    const { error } = await supabase
      .from('contract_clause_templates')
      .insert(templates);

    if (error) {
      console.error('[Clauses] Seeding error:', error);
      throw new Error(`Failed to seed clause templates: ${error.message}`);
    }

    console.log(`[Clauses] Successfully seeded ${templates.length} default templates`);
  },

  /**
   * Get all templates for a user
   * Auto-seeds if no templates exist (lazy loading)
   */
  async getTemplates(userId?: string): Promise<ClauseTemplate[]> {
    const uid = userId || await getAuthenticatedUserId();

    // Auto-seed if needed (lazy loading pattern)
    const hasTemplates = await this.hasTemplates(uid);
    if (!hasTemplates) {
      await this.seedTemplatesForUser(uid);
    }

    const { data, error } = await supabase
      .from('contract_clause_templates')
      .select('*')
      .eq('user_id', uid)
      .eq('is_active', true)
      .order('clause_type')
      .order('clause_index');

    if (error) {
      console.error('[Clauses] getTemplates error:', error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return (data || []) as ClauseTemplate[];
  },

  /**
   * Get overrides for a specific contract
   */
  async getOverrides(contractId: string): Promise<ClauseOverride[]> {
    const { data, error } = await supabase
      .from('contract_clause_overrides')
      .select('*')
      .eq('contract_id', contractId)
      .order('clause_type')
      .order('clause_index');

    if (error) {
      console.error('[Clauses] getOverrides error:', error);
      throw new Error(`Failed to fetch overrides: ${error.message}`);
    }

    return (data || []) as ClauseOverride[];
  },

  /**
   * Get merged clauses (templates + overrides)
   * Returns final clauses to use for PDF generation or UI display
   *
   * @param contractId - Optional contract ID to fetch overrides for
   * @param userId - Optional user ID (defaults to authenticated user)
   * @returns Array of merged clauses (override takes precedence over template)
   */
  async getMergedClauses(contractId?: string, userId?: string): Promise<MergedClause[]> {
    const uid = userId || await getAuthenticatedUserId();

    // Get templates (auto-seeds if needed)
    const templates = await this.getTemplates(uid);

    // Get overrides (if contractId provided)
    const overrides = contractId ? await this.getOverrides(contractId) : [];

    // Build override map for quick lookup: "GENEL_SARTLAR_0" -> ClauseOverride
    const overrideMap = new Map<string, ClauseOverride>();
    overrides.forEach(override => {
      const key = `${override.clause_type}_${override.clause_index}`;
      overrideMap.set(key, override);
    });

    // Merge: override takes precedence
    const merged: MergedClause[] = templates.map(template => {
      const key = `${template.clause_type}_${template.clause_index}`;
      const override = overrideMap.get(key);

      if (override) {
        return {
          clause_type: template.clause_type,
          clause_index: template.clause_index,
          content: override.custom_content,
          is_customized: true,
        };
      }

      return {
        clause_type: template.clause_type,
        clause_index: template.clause_index,
        content: template.content,
        is_customized: false,
      };
    });

    return merged;
  },

  /**
   * Save clause overrides for a contract
   * Called after contract creation (before PDF generation)
   * Uses upsert to handle updates
   *
   * @param contractId - Contract ID to save overrides for
   * @param overrides - Array of clause overrides
   * @param userId - Optional user ID (defaults to authenticated user)
   */
  async saveOverrides(
    contractId: string,
    overrides: ClauseOverrideInput[],
    userId?: string
  ): Promise<void> {
    if (overrides.length === 0) {
      console.log('[Clauses] No overrides to save');
      return;
    }

    const uid = userId || await getAuthenticatedUserId();

    // Prepare override records
    const records = overrides.map(override => ({
      contract_id: contractId,
      user_id: uid,
      clause_type: override.clause_type,
      clause_index: override.clause_index,
      custom_content: override.custom_content,
    }));

    // Use upsert to handle updates (onConflict on UNIQUE constraint)
    const { error } = await supabase
      .from('contract_clause_overrides')
      .upsert(records, {
        onConflict: 'contract_id,clause_type,clause_index',
      });

    if (error) {
      console.error('[Clauses] Save overrides error:', error);
      throw new Error(`Failed to save clause overrides: ${error.message}`);
    }

    console.log(`[Clauses] Saved ${records.length} clause override(s) for contract ${contractId}`);
  },

  /**
   * Delete all overrides for a contract
   * Called when reverting to defaults or contract deletion (CASCADE handles this)
   */
  async deleteOverrides(contractId: string): Promise<void> {
    const { error } = await supabase
      .from('contract_clause_overrides')
      .delete()
      .eq('contract_id', contractId);

    if (error) {
      console.error('[Clauses] Delete overrides error:', error);
      throw new Error(`Failed to delete overrides: ${error.message}`);
    }

    console.log(`[Clauses] Deleted all overrides for contract ${contractId}`);
  },

  /**
   * Replace template variables in clause content
   * Used during PDF generation to inject dynamic data
   *
   * Template variables:
   * - {{paymentDay}} - Payment day of month (e.g., "15")
   * - {{ownerIBAN}} - Owner's IBAN (e.g., "TR123456789...")
   * - {{ownerName}} - Owner's name (e.g., "Ahmet Yılmaz")
   * - {{tenantName}} - Tenant's name (e.g., "Mehmet Demir")
   * - {{contractDate}} - Contract start date (e.g., "01 Ocak 2025")
   *
   * @param content - Clause content with {{variable}} placeholders
   * @param variables - Object with variable values
   * @returns Processed content with variables replaced
   */
  replaceVariables(content: string, variables: TemplateVariables): string {
    let result = content;

    if (variables.paymentDay) {
      result = result.replace(/\{\{paymentDay\}\}/g, variables.paymentDay);
    }
    if (variables.ownerIBAN) {
      result = result.replace(/\{\{ownerIBAN\}\}/g, variables.ownerIBAN);
    }
    if (variables.ownerName) {
      result = result.replace(/\{\{ownerName\}\}/g, variables.ownerName);
    }
    if (variables.tenantName) {
      result = result.replace(/\{\{tenantName\}\}/g, variables.tenantName);
    }
    if (variables.contractDate) {
      result = result.replace(/\{\{contractDate\}\}/g, variables.contractDate);
    }

    return result;
  },
};
