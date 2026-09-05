// ==============================================================================
// KRONOS TARGET ARCHITECTURE: SUPABASE EDGE FUNCTION & AI INTEGRATION TESTS
// ==============================================================================

import { KRONOS_TOOLS } from '../aiTools';
import { sendChatMessage } from '../aiService';
import { buildAIContext } from '../contextEngine';
import { ChatMessage } from '../aiTypes';

export function runSupabaseAiIntegrationTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${desc}`);
    } else {
      failed++;
      console.error(`  ✗ FAIL: ${desc}`);
    }
  }

  console.log('\n--- 1. SERVER-SIDE LLM TOOL DECLARATIONS SCHEMA AUDIT ---');

  assert(
    'Server tool declarations are populated with all 10 core KRONOS tools',
    KRONOS_TOOLS.length >= 10
  );

  const toolNames = KRONOS_TOOLS.map((t) => t.name);
  assert('Includes create_task tool declaration', toolNames.includes('create_task'));
  assert('Includes delete_task tool declaration', toolNames.includes('delete_task'));
  assert('Includes complete_task tool declaration', toolNames.includes('complete_task'));
  assert('Includes create_event tool declaration', toolNames.includes('create_event'));
  assert('Includes delete_event tool declaration', toolNames.includes('delete_event'));
  assert('Includes log_habit tool declaration', toolNames.includes('log_habit'));
  assert('Includes create_reminder tool declaration', toolNames.includes('create_reminder'));
  assert('Includes create_goal tool declaration', toolNames.includes('create_goal'));

  for (const tool of KRONOS_TOOLS) {
    assert(
      `Tool ${tool.name} conforms to JSON Schema format with valid parameters object`,
      typeof tool.parameters === 'object' &&
        tool.parameters.type === 'object' &&
        typeof tool.parameters.properties === 'object'
    );
  }

  console.log('\n--- 2. CLIENT-TO-EDGE REQUEST DISPATCH & FALLBACK AUDIT ---');

  const dummyContext = buildAIContext({
    user: {
      id: 'usr-int-001',
      email: 'test@kronos.io',
      fullName: 'Agent Alpha',
      timezone: 'UTC',
      themePreference: 'dark',
      weeklyDistanceGoalKm: 25,
      dailyTaskGoal: 6,
      currentStreak: 7,
      totalActivitiesCount: 15,
    },
    tasks: [],
    events: [],
    habits: [],
    goals: [],
    reminders: [],
    activities: [],
  });

  const dummyHistory: ChatMessage[] = [
    {
      id: 'm-1',
      role: 'user',
      content: 'Hello Mission Control',
      timestamp: new Date().toISOString(),
      status: 'sent',
    },
  ];

  // Test 2.1: Demo mode cleanly uses local deterministic cognition
  (async () => {
    const demoRes = await sendChatMessage({
      message: "What's my mission today?",
      context: dummyContext,
      conversationHistory: dummyHistory,
      userId: 'usr-int-001',
      isDemoMode: true,
    });

    assert(
      'Demo mode routes gracefully to local cognition without throwing network errors',
      Boolean(demoRes && demoRes.message && demoRes.message.length > 0)
    );
  })();

  // Test 2.2: Destructive action in demo mode triggers confirmation requirement
  (async () => {
    const deleteRes = await sendChatMessage({
      message: 'Delete my DBMS assignment task',
      context: dummyContext,
      conversationHistory: dummyHistory,
      userId: 'usr-int-001',
      isDemoMode: true,
    });

    assert(
      'Destructive delete command requires confirmation',
      Boolean(deleteRes.requiresConfirmation && deleteRes.pendingAction)
    );
  })();

  return { passed, failed };
}

if (typeof require !== 'undefined' && require.main === module) {
  const res = runSupabaseAiIntegrationTests();
  console.log(`\nTests finished: ${res.passed} passed, ${res.failed} failed.`);
}
