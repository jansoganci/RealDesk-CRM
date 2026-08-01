import { supabase } from '@/config/supabase';
import { getAuthenticatedUserId } from '@/lib/auth';
import { handleServiceError } from '@/lib/handleServiceError';
import type { Json } from '@/types/database';
import {
  runCcpaDeletion,
  type DeletionProgressMap,
} from './ccpaDeletion';

function toJsonProgress(progress: DeletionProgressMap): Json {
  return progress as unknown as Json;
}

export type RequestType = 'know' | 'delete' | 'opt_out_sale' | 'opt_out_share' | 'correct';
export type RequestStatus =
  | 'pending'
  | 'in_review'
  | 'verification_sent'
  | 'processing'
  | 'completed'
  | 'denied';
export type RelationshipToOrg = 'tenant' | 'buyer' | 'seller' | 'lead' | 'other';

export type { DeletionProgressMap, DeletionTableProgress } from './ccpaDeletion';

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
  deletion_progress: DeletionProgressMap;
  deletion_started_at: string | null;
  data_disclosed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SubmitRequestInput {
  orgId: string;
  turnstileToken: string;
  requester_name: string;
  requester_email: string;
  requester_phone?: string | null;
  relationship_to_org: RelationshipToOrg;
  relationship_description?: string | null;
  request_type: RequestType;
  details?: string | null;
}

export interface SubmitRequestResult {
  requestId: string;
}

export interface CheckRequestStatusResult {
  status: RequestStatus;
  requestType: RequestType;
  submittedAt: string;
}

export interface UpdateRequestStatusInput {
  status: RequestStatus;
  status_notes?: string | null;
}

function normalizeDataSubjectRequest(row: unknown): DataSubjectRequest {
  const data = row as DataSubjectRequest;
  return {
    ...data,
    deletion_progress: (data.deletion_progress ?? {}) as DeletionProgressMap,
    deletion_started_at: data.deletion_started_at ?? null,
  };
}

function getEdgeFunctionConfig(): { url: string; anonKey: string } {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set');
  }
  return { url, anonKey };
}

async function callCcpaEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { url, anonKey } = getEdgeFunctionConfig();
  const response = await fetch(`${url}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    requestId?: string;
    status?: RequestStatus;
    requestType?: RequestType;
    submittedAt?: string;
    details?: { code?: string };
  };

  if (!response.ok) {
    const message = payload.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

class CcpaService {
  /**
   * Public anonymous submit via Edge Function (no session required).
   * Requires orgId from /privacy?org= and a Turnstile token.
   */
  async submitRequest(data: SubmitRequestInput): Promise<SubmitRequestResult> {
    try {
      const result = await callCcpaEdgeFunction<{ requestId: string }>('submit-ccpa-request', {
        orgId: data.orgId,
        requestType: data.request_type,
        requesterName: data.requester_name,
        requesterEmail: data.requester_email,
        requesterPhone: data.requester_phone ?? null,
        relationshipToOrg: data.relationship_to_org,
        relationshipDescription: data.relationship_description ?? null,
        details: data.details ?? null,
        turnstileToken: data.turnstileToken,
      });

      if (!result.requestId) {
        throw new Error('Failed to submit CCPA request');
      }

      return { requestId: result.requestId };
    } catch (error) {
      throw handleServiceError(error, 'Failed to submit CCPA request');
    }
  }

  /**
   * Public anonymous status check via Edge Function.
   * Requires requestId + requesterEmail as a shared-secret pair.
   */
  async checkRequestStatus(
    requestId: string,
    requesterEmail: string,
  ): Promise<CheckRequestStatusResult> {
    try {
      const result = await callCcpaEdgeFunction<CheckRequestStatusResult>(
        'check-ccpa-request-status',
        { requestId, requesterEmail },
      );

      if (!result.status || !result.requestType || !result.submittedAt) {
        throw new Error('Failed to check CCPA request status');
      }

      return result;
    } catch (error) {
      throw handleServiceError(error, 'Failed to check CCPA request status');
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
      return (data ?? []).map(normalizeDataSubjectRequest);
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
      return normalizeDataSubjectRequest(data);
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
      return normalizeDataSubjectRequest(data);
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
      return normalizeDataSubjectRequest(data);
    } catch (error) {
      throw handleServiceError(error, 'Failed to complete know request');
    }
  }

  /**
   * Right to Delete — anonymizes PII across inventoried tables, then marks completed.
   * Soft-delete + anonymization where allowed; signed/legal records retained with reason.
   * Resumable via deletion_progress (skips tables already done).
   */
  async completeDeleteRequest(id: string): Promise<DataSubjectRequest> {
    try {
      await getAuthenticatedUserId();

      const request = await this.getRequestById(id);
      if (!request) throw new Error('Request not found');
      if (request.request_type !== 'delete') {
        throw new Error('Request is not a delete request');
      }

      const startedAt = request.deletion_started_at ?? new Date().toISOString();
      const existingProgress = (request.deletion_progress ?? {}) as DeletionProgressMap;

      const { error: startError } = await supabase
        .from('data_subject_requests')
        .update({
          status: 'processing',
          deletion_started_at: startedAt,
          deletion_progress: toJsonProgress(existingProgress),
        })
        .eq('id', id);

      if (startError) throw startError;

      const persistProgress = async (progress: DeletionProgressMap) => {
        const { error } = await supabase
          .from('data_subject_requests')
          .update({
            status: 'processing',
            deletion_progress: toJsonProgress(progress),
          })
          .eq('id', id);
        if (error) throw error;
      };

      const result = await runCcpaDeletion({
        supabase,
        orgId: request.org_id,
        email: request.requester_email,
        existingProgress,
        onProgress: persistProgress,
      });

      if (result.failed) {
        const failedTable = result.failedTable ?? 'unknown';
        const failedError = result.progress[failedTable]?.error ?? 'error';
        const { error } = await supabase
          .from('data_subject_requests')
          .update({
            status: 'processing',
            deletion_progress: toJsonProgress(result.progress),
            deletion_summary: result.summary,
            status_notes: `Deletion paused at ${failedTable}: ${failedError}`,
          })
          .eq('id', id);

        if (error) throw error;
        throw new Error(
          `Deletion incomplete at ${failedTable}. Progress saved — retry to resume.`,
        );
      }

      const completedAt = new Date().toISOString();
      const { data, error } = await supabase
        .from('data_subject_requests')
        .update({
          status: 'completed',
          completed_at: completedAt,
          deletion_progress: toJsonProgress(result.progress),
          deletion_summary: result.summary,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return normalizeDataSubjectRequest(data);
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
      return normalizeDataSubjectRequest(data);
    } catch (error) {
      throw handleServiceError(error, 'Failed to complete opt-out request');
    }
  }
}

export const ccpaService = new CcpaService();
