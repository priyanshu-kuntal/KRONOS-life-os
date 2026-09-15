// ==============================================================================
// KRONOS MASTER TEST RUNNER - PHASE 3 TRACK + PHASE 4 ANALYZE
// ==============================================================================

import { runLocationUtilsTests } from './locationUtils.test';
import { runAiMissionControlTests } from './aiMissionControl.test';
import { runSupabaseAiIntegrationTests } from '../features/ai/__tests__/supabaseAiIntegration.test';
import { runPhase4bHardeningTests } from '../features/ai/__tests__/phase4bHardening.test';

async function runAll() {
  console.log('================================================================');
  console.log('           KRONOS LIFE OS - TEST SUITE RUNNER                  ');
  console.log('================================================================\n');

  try {
    // 1. Phase 3 Fitness & Telemetry Engine Tests
    runLocationUtilsTests();

    console.log('\n');

    // 2. Phase 4 AI Mission Control Engine Tests
    await runAiMissionControlTests();

    console.log('\n');

    // 3. Target Architecture: Supabase Edge Function & AI Provider Tests
    runSupabaseAiIntegrationTests();

    console.log('\n');

    // 4. Phase 4B Hardening & Confirmation Security Tests
    await runPhase4bHardeningTests();

    console.log('\n================================================================');
    console.log('           ALL KRONOS TESTS COMPLETED SUCCESSFULLY!             ');
    console.log('================================================================\n');
  } catch (err) {
    console.error('Test runner encountered an unhandled exception:', err);
    process.exit(1);
  }
}

runAll();
