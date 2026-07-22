import { supabase } from '@/config/supabase';
import { getAuthenticatedUserId } from '@/lib/auth';
import { getActiveOrgId } from '@/lib/orgHelpers';
import { handleServiceError } from '@/lib/handleServiceError';

export type ScreeningStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'flagged';

export interface ApplicantScreening {
  id: string;
  org_id: string;
  lead_id: string | null;
  created_by: string;
  applicant_name: string;
  applicant_email: string | null;
  applicant_phone: string | null;
  screening_status: ScreeningStatus;
  background_check: boolean;
  credit_check: boolean;
  employment_verification: boolean;
  landlord_reference: boolean;
  income_verification: boolean;
  notes: string | null;
  property_id: string | null;
  desired_move_in_date: string | null;
  monthly_income: number | null;
  credit_score: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateApplicantScreeningInput {
  applicant_name: string;
  applicant_email?: string | null;
  applicant_phone?: string | null;
  screening_status?: ScreeningStatus;
  background_check?: boolean;
  credit_check?: boolean;
  employment_verification?: boolean;
  landlord_reference?: boolean;
  income_verification?: boolean;
  notes?: string | null;
  property_id?: string | null;
  lead_id?: string | null;
  desired_move_in_date?: string | null;
  monthly_income?: number | null;
  credit_score?: number | null;
}

export type UpdateApplicantScreeningInput = Partial<CreateApplicantScreeningInput> & {
  screening_status?: ScreeningStatus;
  background_check?: boolean;
  credit_check?: boolean;
  employment_verification?: boolean;
  landlord_reference?: boolean;
  income_verification?: boolean;
};

class ApplicantScreeningService {
  /** Returns all non-deleted screenings for the active org, newest first. */
  async getAll(): Promise<ApplicantScreening[]> {
    try {
      const orgId = await getActiveOrgId();
      const { data, error } = await supabase
        .from('applicant_screenings')
        .select('*')
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApplicantScreening[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch screenings');
    }
  }

  /** Returns a single screening by id, or null if not found. */
  async getById(id: string): Promise<ApplicantScreening | null> {
    try {
      const orgId = await getActiveOrgId();
      const { data, error } = await supabase
        .from('applicant_screenings')
        .select('*')
        .eq('id', id)
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data as ApplicantScreening | null;
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch screening');
    }
  }

  /** Returns all non-deleted screenings matching a given status for the active org. */
  async getByStatus(status: ScreeningStatus): Promise<ApplicantScreening[]> {
    try {
      const orgId = await getActiveOrgId();
      const { data, error } = await supabase
        .from('applicant_screenings')
        .select('*')
        .eq('org_id', orgId)
        .eq('screening_status', status)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApplicantScreening[];
    } catch (error) {
      throw handleServiceError(error, 'Failed to fetch screenings by status');
    }
  }

  /** Creates a new applicant screening for the active org. */
  async create(input: CreateApplicantScreeningInput): Promise<ApplicantScreening> {
    try {
      const [orgId, userId] = await Promise.all([
        getActiveOrgId(),
        getAuthenticatedUserId(),
      ]);
      const { data, error } = await supabase
        .from('applicant_screenings')
        .insert({
          ...input,
          org_id: orgId,
          created_by: userId,
          screening_status: input.screening_status ?? 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data as ApplicantScreening;
    } catch (error) {
      throw handleServiceError(error, 'Failed to create screening');
    }
  }

  /** Updates fields on an existing screening. */
  async update(id: string, input: UpdateApplicantScreeningInput): Promise<ApplicantScreening> {
    try {
      const orgId = await getActiveOrgId();
      const { data, error } = await supabase
        .from('applicant_screenings')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();
      if (error) throw error;
      return data as ApplicantScreening;
    } catch (error) {
      throw handleServiceError(error, 'Failed to update screening');
    }
  }

  /** Convenience method to update only the screening_status. */
  async updateStatus(id: string, status: ScreeningStatus): Promise<ApplicantScreening> {
    return this.update(id, { screening_status: status });
  }

  /** Soft-deletes a screening by setting deleted_at. */
  async softDelete(id: string): Promise<void> {
    try {
      const orgId = await getActiveOrgId();
      const { error } = await supabase
        .from('applicant_screenings')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('org_id', orgId);
      if (error) throw error;
    } catch (error) {
      throw handleServiceError(error, 'Failed to delete screening');
    }
  }
}

export const applicantScreeningService = new ApplicantScreeningService();
