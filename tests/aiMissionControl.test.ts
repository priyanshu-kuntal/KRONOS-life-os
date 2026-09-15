// ==============================================================================
// KRONOS PHASE 4: AI MISSION CONTROL - COMPREHENSIVE TEST SUITE
// ==============================================================================

import { buildAIContext, formatContextForPrompt } from '../features/ai/contextEngine';
import { executeKronosTool } from '../features/ai/aiTools';
import {
  generateDailyMissionBriefing,
  generateDomainInsights,
} from '../features/ai/briefingEngine';
import { analyzeAndOptimizeSchedule } from '../features/ai/scheduleOptimizer';
import { sendChatMessage, runDeterministicMissionControl } from '../features/ai/aiService';
import { conversationService } from '../features/ai/conversationService';
import { UserProfile, Task, EventItem, Habit, Goal, Reminder, Activity } from '../types/models';

export async function runAiMissionControlTests() {
  console.log('--- Running AI Mission Control Integration Tests ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  };

  const testUserA: UserProfile = {
    id: 'user-alpha-001',
    email: 'alpha@kronos.internal',
    fullName: 'Priyanshu Kuntal',
    timezone: 'Asia/Kolkata',
    themePreference: 'dark',
    weeklyDistanceGoalKm: 30,
    dailyTaskGoal: 5,
    currentStreak: 7,
    totalActivitiesCount: 15,
  };

  const testUserB: UserProfile = {
    id: 'user-beta-002',
    email: 'beta@kronos.internal',
    fullName: 'Other User',
    timezone: 'UTC',
    themePreference: 'light',
    weeklyDistanceGoalKm: 20,
    dailyTaskGoal: 4,
    currentStreak: 2,
    totalActivitiesCount: 3,
  };

  const todayStr = new Date().toISOString().substring(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().substring(0, 10);

  // --------------------------------------------------------------------------
  // 1. CONTEXT ENGINE & USER ISOLATION TESTS
  // --------------------------------------------------------------------------
  console.log('\n[1] Testing AI Context Engine & Security Isolation:');

  const mockTasks: Task[] = [
    {
      id: 'task-a-1',
      userId: testUserA.id,
      title: 'DBMS Assignment Review',
      dueDate: todayStr,
      priority: 'urgent',
      status: 'pending',
      category: 'Work',
      estimatedMinutes: 60,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-a-2',
      userId: testUserA.id,
      title: 'Overdue Project Report',
      dueDate: yesterdayStr,
      priority: 'high',
      status: 'pending',
      category: 'Study',
      estimatedMinutes: 45,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-b-1',
      userId: testUserB.id,
      title: 'Secret Beta Task',
      dueDate: todayStr,
      priority: 'low',
      status: 'pending',
      category: 'Personal',
      estimatedMinutes: 15,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockEvents: EventItem[] = [
    {
      id: 'event-a-1',
      userId: testUserA.id,
      title: 'Systems Engineering Lecture',
      startTime: `${todayStr}T09:00:00.000Z`,
      endTime: `${todayStr}T10:30:00.000Z`,
      isAllDay: false,
      color: '#4F8CFF',
      category: 'Study',
    },
    {
      id: 'event-a-2',
      userId: testUserA.id,
      title: 'Project Synchronization',
      startTime: `${todayStr}T10:00:00.000Z`, // Overlaps with Lecture!
      endTime: `${todayStr}T11:00:00.000Z`,
      isAllDay: false,
      color: '#38BDF8',
      category: 'Work',
    },
    {
      id: 'event-b-1',
      userId: testUserB.id,
      title: 'User B Confidential Meeting',
      startTime: `${todayStr}T14:00:00.000Z`,
      endTime: `${todayStr}T15:00:00.000Z`,
      isAllDay: false,
      color: '#38BDF8',
      category: 'Work',
    },
  ];

  const mockHabits: Habit[] = [
    {
      id: 'habit-a-1',
      userId: testUserA.id,
      title: 'Hydration 3L',
      category: 'Health',
      targetDaysPerWeek: 7,
      frequency: 'daily',
      color: '#38BDF8',
      icon: 'sparkles',
      currentStreak: 14,
      bestStreak: 20,
      isArchived: false,
      completedToday: false, // At risk!
    },
    {
      id: 'habit-b-1',
      userId: testUserB.id,
      title: 'User B Habit',
      category: 'Health',
      targetDaysPerWeek: 5,
      frequency: 'daily',
      color: '#38BDF8',
      icon: 'sparkles',
      currentStreak: 3,
      bestStreak: 5,
      isArchived: false,
    },
  ];

  const mockGoals: Goal[] = [
    {
      id: 'goal-a-1',
      userId: testUserA.id,
      title: 'Run 100 km this month',
      targetValue: 100,
      currentValue: 68,
      unit: 'km',
      category: 'Fitness',
      status: 'active',
    },
  ];

  const mockActivities: Activity[] = [
    {
      id: 'act-a-1',
      userId: testUserA.id,
      title: 'Morning 5K Tempo Run',
      sportType: 'running',
      distanceMeters: 5240,
      durationSeconds: 1680,
      movingTimeSeconds: 1650,
      avgSpeedMps: 3.12,
      maxSpeedMps: 4.05,
      calories: 320,
      elevationGainMeters: 25,
      startedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  // Test Context Building for User A
  const ctxA = buildAIContext({
    user: testUserA,
    tasks: mockTasks,
    events: mockEvents,
    habits: mockHabits,
    goals: mockGoals,
    reminders: [],
    activities: mockActivities,
  });

  // Strict user isolation check
  assert(ctxA.tasksSummary.totalToday === 1, 'Context isolates User A tasks (excludes User B tasks)');
  assert(ctxA.tasksSummary.overdueCount === 1, 'Detects 1 overdue task for User A');
  assert(ctxA.eventsSummary.todayCount === 2, 'Context isolates User A events (2 events today)');
  assert(ctxA.eventsSummary.conflicts.length === 1, 'Detects collision between Lecture and Project Sync');
  assert(ctxA.habitsSummary.atRiskHabits.length === 1, 'Identifies 14-day streak habit at risk');
  assert(ctxA.fitnessSummary.totalDistanceWeekKm === 5.2, 'Calculates 5.2 km logged this week');

  // Empty data test
  const emptyCtx = buildAIContext({
    user: testUserA,
    tasks: [],
    events: [],
    habits: [],
    goals: [],
    reminders: [],
    activities: [],
  });
  assert(emptyCtx.tasksSummary.totalToday === 0, 'Handles empty data gracefully without throwing');
  assert(emptyCtx.eventsSummary.conflicts.length === 0, 'Zero conflicts on empty schedule');

  // Token-budgeted serialization test
  const promptStr = formatContextForPrompt(ctxA);
  assert(promptStr.includes('Priyanshu Kuntal'), 'Prompt includes user identity');
  assert(promptStr.includes('DBMS Assignment Review'), 'Prompt contains top priority task');
  assert(promptStr.includes('CONFLICT'), 'Prompt includes schedule conflict alert');
  assert(!promptStr.includes('Secret Beta Task'), 'Prompt strictly excludes other user tasks');

  // --------------------------------------------------------------------------
  // 2. DAILY BRIEFING & INSIGHTS ENGINE TESTS
  // --------------------------------------------------------------------------
  console.log('\n[2] Testing Daily Mission Briefing & Insights Engine:');

  const briefing = generateDailyMissionBriefing(ctxA);
  assert(briefing.greeting.includes('Priyanshu Kuntal'), 'Briefing contains personalized greeting');
  assert(briefing.priorityTasks.length > 0, 'Briefing captures priority tasks');
  assert(briefing.habitRisks.length === 1, 'Briefing warns of habit streak risk');
  assert(briefing.scheduleConflicts.length === 1, 'Briefing reports schedule conflict');
  assert(briefing.recommendedStrategy.length >= 2, 'Briefing formulates actionable strategy rules');

  // Empty state briefing
  const emptyBriefing = generateDailyMissionBriefing(emptyCtx);
  assert(emptyBriefing.summary.includes('clear'), 'Briefing cleanly handles empty schedule without hallucination');

  // Domain Insights Generation
  const insights = generateDomainInsights(ctxA);
  assert(insights.length >= 2, 'Generates multiple grounded domain insights');
  const streakInsight = insights.find((i) => i.type === 'habit');
  assert(streakInsight !== undefined, 'Generates habit risk streak insight');
  const fitnessInsight = insights.find((i) => i.type === 'fitness');
  assert(fitnessInsight !== undefined, 'Generates fitness pacing telemetry insight');

  // --------------------------------------------------------------------------
  // 3. PROACTIVE SCHEDULE OPTIMIZER TESTS
  // --------------------------------------------------------------------------
  console.log('\n[3] Testing Schedule Optimizer:');

  const audit = analyzeAndOptimizeSchedule(ctxA);
  assert(audit.conflictsCount === 1, 'Audit identifies 1 direct scheduling collision');
  assert(audit.recommendations.length >= 1, 'Generates recommendation to shift conflicting block');
  assert(
    audit.recommendations.some((r) => r.title.includes('Shift')),
    'Recommendation-first: proposes shifting colliding event to open window'
  );

  // --------------------------------------------------------------------------
  // 4. CONTROLLED FUNCTION TOOL LAYER & SAFETY TESTS
  // --------------------------------------------------------------------------
  console.log('\n[4] Testing Function Tools & Confirmation Safety:');

  // Test 1: Task creation
  const createRes = await executeKronosTool(
    'create_task',
    {
      title: 'Prepare Lecture Slides',
      priority: 'high',
      dueDate: todayStr,
      estimatedMinutes: 45,
    },
    testUserA.id
  );
  assert(createRes.success === true, 'create_task tool executes successfully');

  // Test 2: Destructive action safety guard (delete_task without isConfirmed)
  const deleteSafetyRes = await executeKronosTool(
    'delete_task',
    {
      taskId: 'task-a-1',
      taskTitle: 'DBMS Assignment Review',
      isConfirmed: false,
    },
    testUserA.id
  );
  assert(
    deleteSafetyRes.requiresConfirmation === true,
    'Safety Guard: delete_task halts and requires explicit user confirmation'
  );
  assert(deleteSafetyRes.pendingAction !== undefined, 'Stages pendingAction payload for user authorization');

  // Test 3: Free time detection
  const freeRes = await executeKronosTool('find_free_time', { minimumMinutes: 30 }, testUserA.id);
  assert(freeRes.success === true, 'find_free_time discovers open schedule gaps');

  // Test 4: Habit logging
  const habitRes = await executeKronosTool('log_habit', { habitTitle: 'Hydration' }, testUserA.id);
  assert(habitRes.toolName === 'log_habit', 'log_habit tool resolves and responds');

  // --------------------------------------------------------------------------
  // 5. DETERMINISTIC MISSION CONTROL INTENT PARSER TESTS
  // --------------------------------------------------------------------------
  console.log('\n[5] Testing AI Natural Language Command Parser:');

  // Command: Mission briefing request
  const resp1 = await runDeterministicMissionControl("What's my mission today?", ctxA, testUserA.id);
  assert(resp1.message.includes('Mission Directive'), 'Parses daily mission intent and answers with directive');

  // Command: Create task
  const resp2 = await runDeterministicMissionControl(
    'Add a task to submit physics lab tomorrow at 5 PM with high priority',
    ctxA,
    testUserA.id
  );
  assert(resp2.toolCalls !== undefined && resp2.toolCalls.length > 0, 'Extracts and executes create_task tool call');
  assert(resp2.message.includes('Task established'), 'Synthesizes task establishment confirmation message');

  // Command: Schedule workout
  const resp3 = await runDeterministicMissionControl(
    'Schedule a 90 minute deep work session tomorrow morning',
    ctxA,
    testUserA.id
  );
  assert(resp3.toolCalls !== undefined && resp3.toolCalls[0].toolName === 'create_event', 'Extracts and executes create_event tool call');

  // Command: Destructive action (Delete task)
  const resp4 = await runDeterministicMissionControl('Delete task DBMS Assignment', ctxA, testUserA.id);
  assert(resp4.requiresConfirmation === true, 'Natural language delete command flags requiresConfirmation');

  // Command: Fitness analysis
  const resp5 = await runDeterministicMissionControl('Analyze my fitness progress', ctxA, testUserA.id);
  assert(resp5.message.includes('Fitness Telemetry'), 'Answers fitness queries using active distance telemetry');

  // --------------------------------------------------------------------------
  // 6. CONVERSATION PERSISTENCE (DEMO / OFFLINE)
  // --------------------------------------------------------------------------
  console.log('\n[6] Testing Conversation Persistence:');

  const saveRes = await conversationService.saveConversation(
    testUserA.id,
    {
      id: 'test-conv-001',
      title: 'Morning Mission Briefing',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'What should I focus on?',
          timestamp: new Date().toISOString(),
        },
      ],
      contextType: 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    true // Demo mode
  );
  assert(saveRes.success === true, 'Saves conversation record successfully');

  const convList = await conversationService.fetchConversations(testUserA.id, true);
  assert(convList.length >= 1, 'Retrieves persisted conversations for user');

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Auto-run if executed directly
if (require.main === module) {
  runAiMissionControlTests().catch((e) => {
    console.error('Fatal test error:', e);
    process.exit(1);
  });
}
