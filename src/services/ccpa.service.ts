import { supabase } from '@/config/supabase';
import { getAuthenticatedUserId } from '@/lib/auth';
import { getActiveOrgId } from '@/lib/orgHelpers';
import { handleServiceError } from '@/lib/handleServiceError';

export type RequestType = 'know' | 'delete' | 'opt_out_sale' | 'opt_out_share' | 'correct';
export type RequestStatus = 'pending' | 'in_review' | 'verification_sent' | 'completed' | 'denied';
export type RelationshipToOrg = 'tenant' | 'buyer' | 'seller' | 'lead' | 'other';

export interface DataSubjectRequest {
  id: string;
  org_id: string;
  requested_by: string | null;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  relationship_to_org: RelationshipToOrg;
  relationship_description: string | null;
  request_type: RequestType;
  details: string | null;
  status: RequestStatus;
  status_notes: string | null;
  verified_at: string | null;
  completed_at: string | null;
  deletion_summary: string | null;
  data_disclosed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SubmitRequestInput {
  requester_name: string;
  requester_email: string;
  requester_phone?: string | null;
  relationship_to_org: RelationshipToOrg;
  relationship_description?: string | null;
  request_type: RequestType;
  details?: string | null;
}

export interface UpdateRequestStatusInput {
  status: RequestStatus;
  status_notes?: string | null;
}

class CcpaService {
  async submitRequest(data: SubmitRequestInput): Promise<DataSubjectRequest> {
    try {
      const userId = await getAuthenticatedUserId();
      const orgId = await getActiveOrgId();

      const { data: created, error } = await supabase
        .from('data_subject_requests')
        .insert({
          org_id: orgId,
          requested_by: userId,
          requester_name: data.requester_name,
          requester_email: data.requester_email,
          requester_phone: data.requester_phone ?? null,
          relationship_to_org: data.relationship_to_org,
          relationship_description: data.relationship_description ?? null,
          request_type: data.request_type,
          details: data.details ?? null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return created as unknown as DataSubjectRequest;
    } catch (error) {
      throw handleServiceError(error, 'Failed to submit CCPA request');
    }
  }

  async getRequests(orgId: string): Promise<DataSubjectRequest[]> {
    try {
      await getAuthenticatedUserId();

      const { data, error } = await supabase
        .from('data_subject_requests')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as DataSubjectRequest[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch CCPA requests');
    }
  }

  async getRequestById(id: string): Promise<DataSubjectRequest | null> {
    try {
      await getAuthenticatedUserId();

      const { data, error } = await supabase
        .from('data_subject_requests')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as unknown as DataSubjectRequest;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch CCPA request');
    }
  }

  async updateRequestStatus(
    id: string,
    status: RequestStatus,
    notes?: string | null
  ): Promise<DataSubjectRequest> {
    try {
      await getAuthenticatedUserId();

      const patch: Record<string, unknown> = { status };
      if (notes !== undefined) patch.status_notes = notes;

      const { data, error } = await supabase
        .from('data_subject_requests')
        .update(patch)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DataSubjectRequest;
    } catch (error) {
      throw handleServiceError(error, 'Failed to update request status');
    }
  }

  /** Right to Know — marks request completed and records when data was disclosed. */
  async completeKnowRequest(id: string, notes?: string | null): Promise<DataSubjectRequest> {
    try {
      await getAuthenticatedUserId();

      const { data, error } = await supabase
        .from('data_subject_requests')
        .update({
          status: 'completed',
          status_notes: notes ?? null,
          completed_at: new Date().toISOString(),
          data_disclosed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DataSubjectRequest;
    } catch (error) {
      throw handleServiceError(error, 'Failed to complete know request');
    }
  }

  /**
   * Right to Delete — anonymizes PII across related tables, then marks completed.
   * Soft-delete + anonymization: PII fields are replaced with [redacted], records
   * remain for the agent's audit trail.
   */
  async completeDeleteRequest(id: string): Promise<DataSubjectRequest> {
    try {
      await getAuthenticatedUserId();

      const request = await this.getRequestById(id);
      if (!request) throw new Error('Request not found');

      const email = request.requester_email;
      const redacted = '[redacted per CCPA request]';
      const deletedAt = new Date().toISOString();
      const summary: string[] = [];

      // Anonymize property_inquiries
      const { data: leadData, error: leadErr } = await supabase
        .from('property_inquiries')
        .update({
          contact_name: redacted,
          contact_email: redacted,
          contact_phone: null,
          notes: null,
          deleted_at: deletedAt,
        })
        .eq('contact_email', email)
        .eq('org_id', request.org_id)
        .is('deleted_at', null)
        .select('id')
        .limit(1);

      if (leadErr) throw leadErr;
      const leadCount = (leadData as any[])?.length || 0;
      if (leadCount) summary.push(`${leadCount} lead record(s) anonymized`);

      // Anonymize tenants
      const { error: tenantErr, count: tenantCount } = await supabase
        .from('tenants')
        .update({
          name: redacted,
          email: redacted,
          phone: null,
          deleted_at: deletedAt,
        })
        .eq('email', email)
        .eq('org_id', request.org_id)
        .is('deleted_at', null)
        .select('id')
        .limit(1);

      if (tenantErr) throw tenantErr;
      if (tenantCount) summary.push(`${tenantCount} tenant record(s) anonymized`);

      const deletionSummary =
        summary.length > 0
          ? summary.join('; ')
          : 'No matching records found for provided email';

      const { data, error } = await supabase
        .from('data_subject_requests')
        .update({
          status: 'completed',
          completed_at: deletedAt,
          deletion_summary: deletionSummary,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DataSubjectRequest;
    } catch (error) {
      throw handleServiceError(error, 'Failed to complete delete request');
    }
  }

  /** Right to Opt-Out — marks request completed with opted-out status. */
  async completeOptOutRequest(id: string, notes?: string | null): Promise<DataSubjectRequest> {
    try {
      await getAuthenticatedUserId();

      const { data, error } = await supabase
        .from('data_subject_requests')
        .update({
          status: 'completed',
          status_notes: notes ?? 'Data subject opted out of sale/sharing',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DataSubjectRequest;
    } catch (error) {
      throw handleServiceError(error, 'Failed to complete opt-out request');
    }
  }
}

export const ccpaService = new CcpaService();
