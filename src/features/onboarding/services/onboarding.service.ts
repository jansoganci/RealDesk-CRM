import { supabase } from '@/config/supabase';
import { createLogger } from '@/lib/logger';
import { getAuthenticatedUserId } from '@/lib/auth';

const logger = createLogger('Onboarding');

export interface OnboardingStatus {
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  primary_use_case: string | null;
  team_size_range: string | null;
  onboarding_skipped: boolean;
  onboarding_skipped_at: string | null;
}

export interface OnboardingEventData {
  [key: string]: unknown;
}

class OnboardingService {
  /**
   * Update onboarding step
   */
  async updateOnboardingStep(orgId: string, step: number): Promise<void> {
    if (step < 0 || step > 3) {
      throw new Error('Step must be between 0 and 3');
    }

    const { error } = await supabase
      .from('organizations')
      .update({ onboarding_step: step })
      .eq('id', orgId);

    if (error) {
      logger.error('Error updating onboarding step:', error);
      throw new Error('Failed to update onboarding step');
    }
  }

  /**
   * Save primary use case (Step 1 selection)
   */
  async savePrimaryUseCase(orgId: string, useCase: string): Promise<void> {
    if (!useCase || !useCase.trim()) {
      throw new Error('Primary use case is required');
    }

    const validUseCases = ['properties', 'clients', 'contracts', 'team', 'all'];
    if (!validUseCases.includes(useCase)) {
      throw new Error(`Invalid use case. Must be one of: ${validUseCases.join(', ')}`);
    }

    const { error } = await supabase
      .from('organizations')
      .update({ 
        primary_use_case: useCase,
        onboarding_step: 1,
      })
      .eq('id', orgId);

    if (error) {
      logger.error('Error saving primary use case:', error);
      throw new Error('Failed to save primary use case');
    }
  }

  /**
   * Get onboarding status for an organization
   */
  async getOnboardingStatus(orgId: string): Promise<OnboardingStatus | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('onboarding_completed, onboarding_completed_at, primary_use_case, team_size_range, onboarding_skipped, onboarding_skipped_at')
      .eq('id', orgId)
      .single();

    if (error) {
      logger.error('Error fetching onboarding status:', error);
      throw new Error('Failed to fetch onboarding status');
    }

    if (!data) {
      return null;
    }

    return {
      onboarding_completed: data.onboarding_completed ?? false,
      onboarding_completed_at: data.onboarding_completed_at ?? null,
      primary_use_case: data.primary_use_case ?? null,
      team_size_range: data.team_size_range ?? null,
      onboarding_skipped: data.onboarding_skipped ?? false,
      onboarding_skipped_at: data.onboarding_skipped_at ?? null,
    };
  }

  /**
   * Track onboarding event for analytics
   */
  async trackEvent(
    orgId: string,
    userId: string,
    stepNumber: number,
    stepName: string,
    action: 'completed' | 'skipped' | 'abandoned',
    data?: OnboardingEventData
  ): Promise<void> {
    if (stepNumber < 1 || stepNumber > 3) {
      throw new Error('Step number must be between 1 and 3');
    }

    const validActions = ['completed', 'skipped', 'abandoned'];
    if (!validActions.includes(action)) {
      throw new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`);
    }

    const { error } = await supabase
      .from('onboarding_events')
      .insert({
        org_id: orgId,
        user_id: userId,
        step_number: stepNumber,
        step_name: stepName,
        action_taken: action,
        data: data || {},
      });

    if (error) {
      logger.error('Error tracking onboarding event:', error);
      // Don't throw - analytics failures shouldn't break the flow
      logger.warn('Continuing despite analytics tracking failure');
    }
  }

  /**
   * Mark onboarding as complete
   */
  async completeOnboarding(orgId: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step: 3,
      })
      .eq('id', orgId);

    if (error) {
      logger.error('Error completing onboarding:', error);
      throw new Error('Failed to complete onboarding');
    }
  }

  /**
   * Mark onboarding as skipped
   */
  async skipOnboarding(orgId: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .update({
        onboarding_skipped: true,
        onboarding_skipped_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (error) {
      logger.error('Error skipping onboarding:', error);
      throw new Error('Failed to skip onboarding');
    }
  }

  /**
   * Save team size (Step 2)
   */
  async saveTeamSize(orgId: string, teamSize: string): Promise<void> {
    if (!teamSize || !teamSize.trim()) {
      throw new Error('Team size is required');
    }

    const validTeamSizes = ['1', '2-5', '6-20', '21+'];
    if (!validTeamSizes.includes(teamSize)) {
      throw new Error(`Invalid team size. Must be one of: ${validTeamSizes.join(', ')}`);
    }

    const { error } = await supabase
      .from('organizations')
      .update({ 
        team_size_range: teamSize,
        onboarding_step: 2,
      })
      .eq('id', orgId);

    if (error) {
      logger.error('Error saving team size:', error);
      throw new Error('Failed to save team size');
    }
  }
}

export const onboardingService = new OnboardingService();

