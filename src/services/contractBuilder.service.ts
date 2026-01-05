/**
 * Contract Builder Service V2
 * Service for managing contract templates and instances
 *
 * NOTE: Uses type assertions because the v2 tables are not yet in the
 * generated Supabase types. Run `npx supabase gen types typescript` after
 * applying the migration to get proper types.
 */

import { supabase } from '../config/supabase';
import { getActiveOrgId } from '../lib/orgHelpers';
import type {
  ContractType,
  ContractInstanceV2,
  ContractTemplateV2,
  CreateContractInstanceRequest,
  UpdateContractInstanceRequest,
} from '../types/contractBuilder.types';

// Type assertion helper for v2 tables that aren't in generated types yet
const fromV2 = (table: string) => supabase.from(table as any);

class ContractBuilderService {
  /**
   * List all instances for a given contract type
   */
  async listInstances(type: ContractType): Promise<ContractInstanceV2[]> {
    const { data, error } = await fromV2('contract_instances_v2')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as ContractInstanceV2[];
  }

  /**
   * Get a single instance by ID
   */
  async getInstance(id: string): Promise<ContractInstanceV2 | null> {
    const { data, error } = await fromV2('contract_instances_v2')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as unknown as ContractInstanceV2;
  }

  /**
   * Create a new contract instance
   */
  async createInstance(request: CreateContractInstanceRequest): Promise<ContractInstanceV2> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');
    const orgId = await getActiveOrgId();

    const { data, error } = await fromV2('contract_instances_v2')
      .insert({
        user_id: userData.user.id,
        org_id: orgId,
        type: request.type,
        template_id: request.template_id || null,
        title: request.title,
        form_data: request.form_data,
        rendered_content: request.rendered_content,
        parties: request.parties,
        status: request.status,
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as ContractInstanceV2;
  }

  /**
   * Update an existing contract instance
   */
  async updateInstance(id: string, request: UpdateContractInstanceRequest): Promise<ContractInstanceV2> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (request.title !== undefined) updateData.title = request.title;
    if (request.form_data !== undefined) updateData.form_data = request.form_data;
    if (request.rendered_content !== undefined) updateData.rendered_content = request.rendered_content;
    if (request.parties !== undefined) updateData.parties = request.parties;
    if (request.status !== undefined) updateData.status = request.status;
    if (request.signed_at !== undefined) updateData.signed_at = request.signed_at;
    if (request.signed_by !== undefined) updateData.signed_by = request.signed_by;

    const { data, error } = await fromV2('contract_instances_v2')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as ContractInstanceV2;
  }

  /**
   * Delete a contract instance
   */
  async deleteInstance(id: string): Promise<void> {
    const { error } = await fromV2('contract_instances_v2')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * List all templates for a given contract type
   */
  async listTemplates(type: ContractType): Promise<ContractTemplateV2[]> {
    const { data, error } = await fromV2('contract_templates_v2')
      .select('*')
      .eq('type', type)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as ContractTemplateV2[];
  }

  /**
   * Get the default template for a given type
   */
  async getDefaultTemplate(type: ContractType): Promise<ContractTemplateV2 | null> {
    const { data, error } = await fromV2('contract_templates_v2')
      .select('*')
      .eq('type', type)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as unknown as ContractTemplateV2;
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<ContractTemplateV2 | null> {
    const { data, error } = await fromV2('contract_templates_v2')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as unknown as ContractTemplateV2;
  }

  /**
   * Count instances by type for badge display
   */
  async countInstancesByType(type: ContractType): Promise<number> {
    const { count, error } = await fromV2('contract_instances_v2')
      .select('*', { count: 'exact', head: true })
      .eq('type', type);

    if (error) throw error;
    return count || 0;
  }
}

export const contractBuilderService = new ContractBuilderService();
