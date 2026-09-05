// ==============================================================================
// KRONOS PHASE 4: AI MISSION CONTROL - CORE TYPES
// ==============================================================================

import { Priority, TaskStatus, SportType, GoalStatus } from '../../types/models';

export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string; // ISO string
  toolCalls?: ToolCall[];
  toolCallId?: string;
  status?: 'sending' | 'sent' | 'error';
  error?: string;
  isConfirmationPrompt?: boolean;
  pendingAction?: PendingActionPayload;
}

export interface PendingActionPayload {
  id: string;
  toolName: string;
  description: string;
  destructive: boolean;
  payload: Record<string, any>;
  title?: string;
  parameters?: Record<string, any>;
  expiresAt?: string;
}

export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  success: boolean;
  result?: any;
  error?: string;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
  pendingActionId?: string;
  pendingAction?: PendingActionPayload;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
        items?: { type: string };
      }
    >;
    required?: string[];
  };
  isDestructive?: boolean;
}

export interface DailyMissionBriefing {
  greeting: string;
  date: string; // YYYY-MM-DD
  summary: string;
  priorityTasks: {
    id: string;
    title: string;
    priority: Priority;
    dueTime?: string;
    status: TaskStatus;
  }[];
  scheduledEvents: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    category: string;
  }[];
  habitRisks: {
    id: string;
    title: string;
    currentStreak: number;
    reason: string;
  }[];
  fitnessPlan: {
    title: string;
    target: string;
    sportType: SportType;
    status: 'planned' | 'completed' | 'suggested';
  } | null;
  goalProgress: {
    id: string;
    title: string;
    percentage: number;
    currentValue: number;
    targetValue: number;
    unit: string;
  }[];
  recommendedStrategy: string[];
  scheduleConflicts: string[];
  generatedAt: string;
}

export type InsightCategory =
  | 'productivity'
  | 'habit'
  | 'goal'
  | 'fitness'
  | 'cross_domain';

export type InsightSeverity = 'info' | 'warning' | 'positive';

export interface DomainInsight {
  id: string;
  type: InsightCategory;
  title: string;
  message: string;
  severity: InsightSeverity;
  actionableRecommendation?: string;
  actionPayload?: any;
  confidenceScore: number;
  createdAt: string;
}

export interface ScheduleRecommendation {
  id: string;
  title: string;
  description: string;
  originalEventId?: string;
  proposedTime?: {
    start: string;
    end: string;
  };
  reason: string;
  actionPayload?: any;
}

export interface FreeTimeSlot {
  start: string; // HH:mm
  end: string; // HH:mm
  startIso: string;
  endIso: string;
  durationMinutes: number;
}

export interface AIContextSnapshot {
  user: {
    id: string;
    fullName: string;
    timezone: string;
    weeklyDistanceGoalKm: number;
    dailyTaskGoal: number;
  };
  date: string; // YYYY-MM-DD
  currentTimeStr: string; // HH:mm
  tasksSummary: {
    totalToday: number;
    completedToday: number;
    pendingToday: number;
    overdueCount: number;
    priorityTasks: {
      id: string;
      title: string;
      priority: Priority;
      dueTime?: string;
      status: TaskStatus;
      category: string;
    }[];
    overdueTasks: {
      id: string;
      title: string;
      dueDate: string;
      priority: Priority;
    }[];
  };
  eventsSummary: {
    todayCount: number;
    todayEvents: {
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      category: string;
    }[];
    upcomingNext48h: {
      id: string;
      title: string;
      startTime: string;
      endTime: string;
    }[];
    conflicts: {
      eventA: string;
      eventB: string;
      overlapStart: string;
      overlapEnd: string;
    }[];
  };
  habitsSummary: {
    totalActive: number;
    completedToday: number;
    pendingToday: number;
    atRiskHabits: {
      id: string;
      title: string;
      currentStreak: number;
      targetDaysPerWeek: number;
    }[];
  };
  goalsSummary: {
    totalActive: number;
    goals: {
      id: string;
      title: string;
      percentage: number;
      status: GoalStatus;
      category: string;
      deadline?: string;
    }[];
  };
  remindersSummary: {
    upcomingNext24h: {
      id: string;
      title: string;
      remindAt: string;
      priority?: Priority;
    }[];
  };
  fitnessSummary: {
    activitiesCountWeek: number;
    totalDistanceWeekKm: number;
    weeklyGoalKm: number;
    goalPercentage: number;
    latestActivity?: {
      title: string;
      sportType: SportType;
      distanceKm: number;
      durationMinutes: number;
      calories: number;
      startedAt: string;
    };
  };
  freeTimeSlots: FreeTimeSlot[];
}

export interface AIResponseContract {
  message: string;
  briefing?: DailyMissionBriefing;
  insights?: DomainInsight[];
  recommendations?: ScheduleRecommendation[];
  toolCalls?: ToolExecutionResult[];
  requiresConfirmation?: boolean;
  pendingActionId?: string;
  pendingAction?: PendingActionPayload;
}
