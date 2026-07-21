import { supabase } from '@/config/supabase';
import { createLogger } from '@/lib/logger';
import type { Json } from '@/types/database';

const logger = createLogger('Onboarding');

export type PrimaryUseCase = 'rentals' | 'sales' | 'both' | 'exploring';
export type TeamSize = '1' | '2-5' | '6-20';

export interface OnboardingStatus {
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  primary_use_case: string | null;
  team_size_range: string | null;
  onboarding_skipped: boolean;
  onboarding_skipped_at: string | null;
}

export interface OnboardingEventData {
  [key: string]: Json;
}

export interface AgentProfileInput {
  organizationName: string;
  teamSize: TeamSize;
  brokerageName: string;
  licenseState: string;
  primaryMarketCity: string;
  primaryMarketState: string;
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
  async savePrimaryUseCase(orgId: string, useCase: PrimaryUseCase): Promise<void> {
    if (!['rentals', 'sales', 'both', 'exploring'].includes(useCase)) {
      throw new Error('Invalid primary use case');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // DUAL-WRITE: Save to both tables
    const [orgUpdateResult, responseResult] = await Promise.allSettled([
      // Write to organizations (existing - CRITICAL)
      supabase
        .from('organizations')
        .update({ 
          primary_use_case: useCase,
          onboarding_step: 1,
        })
        .eq('id', orgId),
      
      // Write to user_onboarding_responses (new - optional)
      supabase
        .from('user_onboarding_responses')
        .upsert({
          user_id: user.id,
          org_id: orgId,
          question_key: 'primary_use_case',
          answer: useCase,
        }, {
          onConflict: 'user_id,question_key'
        })
    ]);

    // Organizations table write is CRITICAL - must succeed
    if (orgUpdateResult.status === 'rejected' || 
        (orgUpdateResult.status === 'fulfilled' && orgUpdateResult.value.error)) {
      logger.error('Error saving primary use case to organizations:', orgUpdateResult);
      throw new Error('Failed to save primary use case');
    }

    // Response table write is optional - log but don't fail
    if (responseResult.status === 'rejected' || 
        (responseResult.status === 'fulfilled' && responseResult.value.error)) {
      logger.warn('Failed to save to user_onboarding_responses (non-critical):', responseResult);
    }
  }

  /**
   * Save agent profile setup (Step 2)
   */
  async saveAgentProfile(orgId: string, profile: AgentProfileInput): Promise<void> {
    const organizationName = profile.organizationName.trim();
    const brokerageName = profile.brokerageName.trim();
    const licenseState = profile.licenseState.trim().toUpperCase();
    const primaryMarketCity = profile.primaryMarketCity.trim();
    const primaryMarketState = profile.primaryMarketState.trim().toUpperCase();

    if (organizationName.length < 2) {
      throw new Error('Organization name must be at least 2 characters');
    }
    if (organizationName.length > 255) {
      throw new Error('Organization name must not exceed 255 characters');
    }
    if (brokerageName.length > 255) {
      throw new Error('Brokerage name must not exceed 255 characters');
    }
    if (!['1', '2-5', '6-20'].includes(profile.teamSize)) {
      throw new Error('Invalid team size');
    }
    if (!/^[A-Z]{2}$/.test(licenseState)) {
      throw new Error('Invalid license state');
    }
    if (primaryMarketCity.length < 2 || primaryMarketCity.length > 120) {
      throw new Error('Primary market city must be between 2 and 120 characters');
    }
    if (!/^[A-Z]{2}$/.test(primaryMarketState)) {
      throw new Error('Invalid primary market state');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const responseUpdates: Array<{ questionKey: string; answer: string }> = [
      { questionKey: 'team_size', answer: profile.teamSize },
      { questionKey: 'brokerage_name', answer: brokerageName },
      { questionKey: 'license_state', answer: licenseState },
      { questionKey: 'primary_market_city', answer: primaryMarketCity },
      { questionKey: 'primary_market_state', answer: primaryMarketState },
    ];

    const [orgUpdateResult, ...responseResults] = await Promise.allSettled([
      supabase
        .from('organizations')
        .update({
          name: organizationName,
          team_size_range: profile.teamSize,
          brokerage_name: brokerageName.length > 0 ? brokerageName : null,
          license_state: licenseState,
          primary_market_city: primaryMarketCity,
          primary_market_state: primaryMarketState,
          onboarding_step: 2,
        })
        .eq('id', orgId),
      ...responseUpdates.map((item) =>
        supabase
          .from('user_onboarding_responses')
          .upsert(
            {
              user_id: user.id,
              org_id: orgId,
              question_key: item.questionKey,
              answer: item.answer,
            },
            {
              onConflict: 'user_id,question_key',
            }
          )
      ),
    ]);

    // Organizations table write is CRITICAL - must succeed
    if (
      orgUpdateResult.status === 'rejected' ||
      (orgUpdateResult.status === 'fulfilled' && orgUpdateResult.value.error)
    ) {
      logger.error('Error saving agent profile to organizations:', orgUpdateResult);
      throw new Error('Failed to save agent profile');
    }

    // Response table writes are optional - log but don't fail
    responseResults.forEach((result, index) => {
      if (result.status === 'rejected' || (result.status === 'fulfilled' && result.value.error)) {
        logger.warn('Failed to save onboarding response (non-critical):', {
          questionKey: responseUpdates[index]?.questionKey,
          result,
        });
      }
    });
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
        data: (data || {}) as any,
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
    if (!['1', '2-5', '6-20', '21+'].includes(teamSize)) {
      throw new Error('Invalid team size');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // DUAL-WRITE: Save to both tables
    const [orgUpdateResult, responseResult] = await Promise.allSettled([
      // Write to organizations (existing - CRITICAL)
      supabase
        .from('organizations')
        .update({ 
          team_size_range: teamSize,
          onboarding_step: 2,
        })
        .eq('id', orgId),
      
      // Write to user_onboarding_responses (new - optional)
      supabase
        .from('user_onboarding_responses')
        .upsert({
          user_id: user.id,
          org_id: orgId,
          question_key: 'team_size',
          answer: teamSize,
        }, {
          onConflict: 'user_id,question_key'
        })
    ]);

    // Organizations table write is CRITICAL - must succeed
    if (orgUpdateResult.status === 'rejected' || 
        (orgUpdateResult.status === 'fulfilled' && orgUpdateResult.value.error)) {
      logger.error('Error saving team size to organizations:', orgUpdateResult);
      throw new Error('Failed to save team size');
    }

    // Response table write is optional - log but don't fail
    if (responseResult.status === 'rejected' || 
        (responseResult.status === 'fulfilled' && responseResult.value.error)) {
      logger.warn('Failed to save to user_onboarding_responses (non-critical):', responseResult);
    }
  }

  /**
   * Save onboarding response to user_onboarding_responses table
   */
  async saveResponse(
    orgId: string,
    questionKey: string,
    answer: string | number | boolean | object
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_onboarding_responses')
      .upsert({
        user_id: user.id,
        org_id: orgId,
        question_key: questionKey,
        answer: answer as any,
      }, {
        onConflict: 'user_id,question_key'
      });

    if (error) {
      logger.error('Error saving onboarding response:', error);
      throw new Error(`Failed to save response for ${questionKey}`);
    }
  }

  /**
   * Get all onboarding responses for current user
   */
  async getResponses(orgId: string): Promise<Record<string, any>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_onboarding_responses')
      .select('question_key, answer')
      .eq('org_id', orgId)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Error fetching onboarding responses:', error);
      throw new Error('Failed to fetch onboarding responses');
    }

    const responses: Record<string, any> = {};
    data?.forEach(row => {
      responses[row.question_key] = row.answer;
    });

    return responses;
  }

  /**
   * Get specific onboarding response
   */
  async getResponse(
    orgId: string,
    questionKey: string
  ): Promise<any | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_onboarding_responses')
      .select('answer')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .eq('question_key', questionKey)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching onboarding response:', error);
      throw new Error(`Failed to fetch response for ${questionKey}`);
    }

    return data?.answer ?? null;
  }
}

export const onboardingService = new OnboardingService();
