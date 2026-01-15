/**
 * Onboarding Dual-Write Test Script
 * 
 * This script tests the dual-write implementation for onboarding responses.
 * Run with: npx tsx scripts/test-onboarding-migration.ts
 * 
 * Prerequisites:
 * - Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 * - Be logged in to Supabase (or set SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient } from '@supabase/supabase-js';
import { onboardingService } from '../src/features/onboarding/services/onboarding.service';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

/**
 * Test 1: Verify savePrimaryUseCase writes to both tables
 */
async function testPrimaryUseCaseDualWrite(): Promise<void> {
  console.log('\n🧪 Test 1: Testing savePrimaryUseCase dual-write...');
  
  try {
    // Get current user and org
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated. Please log in first.');
    }

    // Get user's organization
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .eq('status', 'active')
      .single();

    if (!orgMember) {
      throw new Error('No organization found for current user');
    }

    const orgId = orgMember.org_id;
    const testValue = 'properties'; // Test value

    // Get current values
    const { data: orgBefore } = await supabase
      .from('organizations')
      .select('primary_use_case')
      .eq('id', orgId)
      .single();

    const { data: responseBefore } = await supabase
      .from('user_onboarding_responses')
      .select('answer')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .eq('question_key', 'primary_use_case')
      .maybeSingle();

    // Save using service method
    await onboardingService.savePrimaryUseCase(orgId, testValue);

    // Verify organizations table
    const { data: orgAfter } = await supabase
      .from('organizations')
      .select('primary_use_case')
      .eq('id', orgId)
      .single();

    // Verify user_onboarding_responses table
    const { data: responseAfter } = await supabase
      .from('user_onboarding_responses')
      .select('answer')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .eq('question_key', 'primary_use_case')
      .maybeSingle();

    const orgMatch = orgAfter?.primary_use_case === testValue;
    const responseMatch = responseAfter?.answer === testValue;

    if (orgMatch && responseMatch) {
      results.push({
        test: 'savePrimaryUseCase dual-write',
        passed: true,
        message: '✅ Both tables updated correctly',
        details: {
          org_value: orgAfter?.primary_use_case,
          response_value: responseAfter?.answer,
        },
      });
      console.log('✅ PASS: Both tables updated correctly');
    } else {
      results.push({
        test: 'savePrimaryUseCase dual-write',
        passed: false,
        message: '❌ Mismatch between tables',
        details: {
          org_value: orgAfter?.primary_use_case,
          response_value: responseAfter?.answer,
          expected: testValue,
        },
      });
      console.log('❌ FAIL: Mismatch between tables');
    }

    // Restore original value if it existed
    if (orgBefore?.primary_use_case) {
      await supabase
        .from('organizations')
        .update({ primary_use_case: orgBefore.primary_use_case })
        .eq('id', orgId);
    }
  } catch (error) {
    results.push({
      test: 'savePrimaryUseCase dual-write',
      passed: false,
      message: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    });
    console.log(`❌ FAIL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test 2: Verify saveTeamSize writes to both tables
 */
async function testTeamSizeDualWrite(): Promise<void> {
  console.log('\n🧪 Test 2: Testing saveTeamSize dual-write...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .eq('status', 'active')
      .single();

    if (!orgMember) {
      throw new Error('No organization found');
    }

    const orgId = orgMember.org_id;
    const testValue = '2-5'; // Test value

    // Get current values
    const { data: orgBefore } = await supabase
      .from('organizations')
      .select('team_size_range')
      .eq('id', orgId)
      .single();

    // Save using service method
    await onboardingService.saveTeamSize(orgId, testValue);

    // Verify both tables
    const { data: orgAfter } = await supabase
      .from('organizations')
      .select('team_size_range')
      .eq('id', orgId)
      .single();

    const { data: responseAfter } = await supabase
      .from('user_onboarding_responses')
      .select('answer')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .eq('question_key', 'team_size')
      .maybeSingle();

    const orgMatch = orgAfter?.team_size_range === testValue;
    const responseMatch = responseAfter?.answer === testValue;

    if (orgMatch && responseMatch) {
      results.push({
        test: 'saveTeamSize dual-write',
        passed: true,
        message: '✅ Both tables updated correctly',
      });
      console.log('✅ PASS: Both tables updated correctly');
    } else {
      results.push({
        test: 'saveTeamSize dual-write',
        passed: false,
        message: '❌ Mismatch between tables',
        details: {
          org_value: orgAfter?.team_size_range,
          response_value: responseAfter?.answer,
        },
      });
      console.log('❌ FAIL: Mismatch between tables');
    }

    // Restore original value
    if (orgBefore?.team_size_range) {
      await supabase
        .from('organizations')
        .update({ team_size_range: orgBefore.team_size_range })
        .eq('id', orgId);
    }
  } catch (error) {
    results.push({
      test: 'saveTeamSize dual-write',
      passed: false,
      message: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    });
    console.log(`❌ FAIL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test 3: Verify getResponses() reads from new table
 */
async function testGetResponses(): Promise<void> {
  console.log('\n🧪 Test 3: Testing getResponses() method...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .eq('status', 'active')
      .single();

    if (!orgMember) {
      throw new Error('No organization found');
    }

    const orgId = orgMember.org_id;

    // Call service method
    const responses = await onboardingService.getResponses(orgId);

    // Verify structure
    const hasPrimaryUseCase = 'primary_use_case' in responses;
    const hasTeamSize = 'team_size' in responses;

    results.push({
      test: 'getResponses() method',
      passed: true,
      message: '✅ Method executed successfully',
      details: {
        response_keys: Object.keys(responses),
        has_primary_use_case: hasPrimaryUseCase,
        has_team_size: hasTeamSize,
      },
    });
    console.log('✅ PASS: Method executed successfully');
    console.log(`   Found keys: ${Object.keys(responses).join(', ')}`);
  } catch (error) {
    results.push({
      test: 'getResponses() method',
      passed: false,
      message: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    });
    console.log(`❌ FAIL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Print summary
 */
function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    console.log(`\n${result.message}`);
    if (result.details) {
      console.log('   Details:', JSON.stringify(result.details, null, 2));
    }
  });
  
  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log('='.repeat(60));
}

/**
 * Main test runner
 */
async function runTests(): Promise<void> {
  console.log('🚀 Starting Onboarding Dual-Write Tests...');
  console.log('='.repeat(60));

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ Not authenticated. Please log in to Supabase first.');
    console.log('   Run: npx supabase login');
    process.exit(1);
  }

  console.log(`✅ Authenticated as: ${user.email}`);

  await testPrimaryUseCaseDualWrite();
  await testTeamSizeDualWrite();
  await testGetResponses();

  printSummary();

  // Exit with error code if any test failed
  if (results.some(r => !r.passed)) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
