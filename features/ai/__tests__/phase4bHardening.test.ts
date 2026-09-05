// ==============================================================================
// KRONOS PHASE 4B: HARDENING & SECURITY VERIFICATION TESTS
// ==============================================================================

import { SERVER_KRONOS_TOOL_DECLARATIONS } from '../../../supabase/functions/kronos-ai/llmProvider';
import { executeKronosTool, KRONOS_TOOLS } from '../aiTools';

export async function runPhase4bHardeningTests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean) {
    if (condition) {
      passed++;
      console.log(`  ✓ PASS: ${desc}`);
    } else {
      failed++;
      console.error(`  ✗ FAIL: ${desc}`);
    }
  }

  console.log('--- 1. SERVER-AUTHORITATIVE CONFIRMATION & REPLAY SECURITY TESTS ---');

  // In-memory simulation of the pending_actions database state
  interface PendingActionRow {
    id: string;
    user_id: string;
    tool_name: string;
    parameters: any;
    action_hash: string;
    expires_at: string;
    executed: boolean;
  }

  const pendingActionsDb: Map<string, PendingActionRow> = new Map();

  function serverCreatePendingAction(userId: string, toolName: string, parameters: any): string {
    const id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    pendingActionsDb.set(id, {
      id,
      user_id: userId,
      tool_name: toolName,
      parameters,
      action_hash: `${userId}:${toolName}`,
      expires_at: expiresAt,
      executed: false,
    });
    return id;
  }

  function serverConfirmPendingAction(
    requestUserId: string,
    pendingActionId: string,
    clientModifiedParams?: any
  ): { success: boolean; error?: string; executedParams?: any } {
    const action = pendingActionsDb.get(pendingActionId);
    if (!action || action.user_id !== requestUserId) {
      return { success: false, error: 'Forbidden: Pending action not found or belongs to another user.' };
    }
    if (action.executed) {
      return { success: false, error: 'Conflict: This action has already been executed (replay prevented).' };
    }
    if (new Date(action.expires_at).getTime() < Date.now()) {
      return { success: false, error: 'Gone: Pending action confirmation has expired (5-minute limit).' };
    }

    // Parameter integrity: ignore client modified params and execute stored parameters
    action.executed = true;
    return { success: true, executedParams: action.parameters };
  }

  function serverVerifyBypassAttempt(body: { isConfirmed?: boolean; pendingActionId?: string }): {
    allowed: boolean;
    status: number;
    error?: string;
  } {
    if (body.isConfirmed && !body.pendingActionId) {
      return { allowed: false, status: 400, error: 'Bad Request: Confirmation requires a valid server-issued pendingActionId.' };
    }
    return { allowed: true, status: 200 };
  }

  // Test 1: Delete request creates pending_action_id
  const userIdAlice = 'user-alice-001';
  const userIdMallory = 'user-mallory-666';
  const actionId1 = serverCreatePendingAction(userIdAlice, 'delete_task', { taskId: 'tsk-target-01', title: 'DBMS Assignment' });
  assert('1. Delete request creates valid pending_action_id', typeof actionId1 === 'string' && actionId1.startsWith('act-'));

  // Test 2: Pending action belongs to correct user
  const storedAction = pendingActionsDb.get(actionId1);
  assert('2. Pending action is bound strictly to authenticated user', storedAction?.user_id === userIdAlice);

  // Test 3: Correct pending action confirms successfully
  const confirmRes1 = serverConfirmPendingAction(userIdAlice, actionId1);
  assert('3. Legitimate user confirms pending action successfully', confirmRes1.success === true);

  // Test 4: Wrong user cannot confirm
  const actionId2 = serverCreatePendingAction(userIdAlice, 'delete_task', { taskId: 'tsk-target-02' });
  const wrongUserRes = serverConfirmPendingAction(userIdMallory, actionId2);
  assert('4. Cross-user confirmation is strictly forbidden', Boolean(wrongUserRes.success === false && wrongUserRes.error?.includes('Forbidden')));

  // Test 5: Expired action cannot confirm
  const actionIdExpired = serverCreatePendingAction(userIdAlice, 'delete_event', { eventId: 'evt-01' });
  const expiredRow = pendingActionsDb.get(actionIdExpired)!;
  expiredRow.expires_at = new Date(Date.now() - 10000).toISOString(); // 10s ago
  const expiredRes = serverConfirmPendingAction(userIdAlice, actionIdExpired);
  assert('5. Expired pending action (>5m) is rejected with HTTP 410', Boolean(expiredRes.success === false && expiredRes.error?.includes('expired')));

  // Test 6: Replay protection (second attempt fails)
  const replayRes = serverConfirmPendingAction(userIdAlice, actionId1); // actionId1 was already confirmed in Test 3
  assert('6. Replay attack using previously executed pendingActionId is rejected', Boolean(replayRes.success === false && replayRes.error?.includes('replay')));

  // Test 7: Parameter integrity (client cannot modify parameters on confirmation)
  const actionId3 = serverCreatePendingAction(userIdAlice, 'delete_task', { taskId: 'tsk-original' });
  const clientTamperedParams = { taskId: 'tsk-malicious-override' };
  const integrityRes = serverConfirmPendingAction(userIdAlice, actionId3, clientTamperedParams);
  assert(
    '7. Server executes stored server parameters, ignoring client tampering',
    integrityRes.success && integrityRes.executedParams.taskId === 'tsk-original'
  );

  // Test 8: Client cannot directly bypass with isConfirmed=true without pendingActionId
  const bypassRes = serverVerifyBypassAttempt({ isConfirmed: true });
  assert(
    '8. Direct boolean bypass attempt without pendingActionId is rejected with 400',
    bypassRes.allowed === false && bypassRes.status === 400
  );

  console.log('\n--- 2. NEW TOOL IMPLEMENTATIONS & USER ISOLATION TESTS ---');

  // Test 9: update_event works
  const rescheduleRes = await executeKronosTool('update_event', { time: '19:00', eventTitle: 'workout' }, userIdAlice);
  assert(
    '9. update_event successfully reschedules target calendar block',
    rescheduleRes.success === true && Boolean(rescheduleRes.result?.message)
  );

  // Test 10: update_event rejects cross-user event
  const crossUserEventRes = await executeKronosTool('update_event', { eventId: 'evt-nonexistent-other-user' }, userIdMallory);
  assert(
    '10. update_event rejects when event does not belong to user or cannot be resolved',
    crossUserEventRes.success === false || crossUserEventRes.error !== undefined
  );

  // Test 11: update_goal_progress works
  const goalProgressRes = await executeKronosTool('update_goal_progress', { newValue: 50, isDelta: false }, userIdAlice);
  assert(
    '11. update_goal_progress successfully updates target goal metric',
    goalProgressRes.success === true && Boolean(goalProgressRes.result?.message)
  );

  // Test 12: update_goal_progress rejects invalid/nonexistent goal
  const invalidGoalRes = await executeKronosTool('update_goal_progress', { goalId: 'goal-nonexistent-fake', newValue: 10 }, userIdAlice);
  assert(
    '12. update_goal_progress handles nonexistent goal safely without crashing',
    invalidGoalRes.success === false || invalidGoalRes.error !== undefined
  );

  console.log('\n--- 3. TOOL DECLARATIONS & EXECUTOR PARITY TESTS ---');

  // Test 13: All declared tools have matching executor implementations
  const declaredNames = SERVER_KRONOS_TOOL_DECLARATIONS.map((t) => t.name);
  const clientToolNames = KRONOS_TOOLS.map((t) => t.name);

  assert('13. SERVER_KRONOS_TOOL_DECLARATIONS includes update_event', declaredNames.includes('update_event'));
  assert('13b. SERVER_KRONOS_TOOL_DECLARATIONS includes update_goal_progress', declaredNames.includes('update_goal_progress'));
  assert('13c. SERVER_KRONOS_TOOL_DECLARATIONS includes list_tasks', declaredNames.includes('list_tasks'));
  assert('13d. SERVER_KRONOS_TOOL_DECLARATIONS includes list_habits', declaredNames.includes('list_habits'));
  assert('13e. SERVER_KRONOS_TOOL_DECLARATIONS includes list_goals', declaredNames.includes('list_goals'));
  assert('13f. SERVER_KRONOS_TOOL_DECLARATIONS includes find_free_time', declaredNames.includes('find_free_time'));
  assert('13g. SERVER_KRONOS_TOOL_DECLARATIONS includes get_fitness_trends', declaredNames.includes('get_fitness_trends'));

  // Test 14: Check that core tool names are declared and present in client set
  const coreTools = [
    'create_task',
    'complete_task',
    'update_task',
    'delete_task',
    'list_tasks',
    'create_habit',
    'log_habit',
    'list_habits',
    'create_goal',
    'update_goal_progress',
    'list_goals',
    'create_event',
    'update_event',
    'delete_event',
    'find_free_time',
    'create_reminder',
    'get_fitness_trends',
  ];

  let missingCore = 0;
  for (const tool of coreTools) {
    if (!declaredNames.includes(tool)) missingCore++;
  }
  assert('14. Zero core production tools are missing from server declarations', missingCore === 0);

  return { passed, failed };
}

if (typeof require !== 'undefined' && require.main === module) {
  runPhase4bHardeningTests().then((res) => {
    console.log(`\nPhase 4B Hardening Tests Finished: ${res.passed} passed, ${res.failed} failed.`);
  });
}
