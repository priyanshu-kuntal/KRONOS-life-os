// ==============================================================================
// KRONOS PHASE 4: AI MISSION CONTROL - STATE STORE
// ==============================================================================

import { create } from 'zustand';
import {
  ChatMessage,
  DailyMissionBriefing,
  DomainInsight,
  PendingActionPayload,
} from '../features/ai/aiTypes';
import { buildAIContext } from '../features/ai/contextEngine';
import { sendChatMessage } from '../features/ai/aiService';
import {
  generateDailyMissionBriefing,
  generateDomainInsights,
} from '../features/ai/briefingEngine';
import {
  conversationService,
  AIConversationRecord,
} from '../features/ai/conversationService';
import { executeKronosTool } from '../features/ai/aiTools';
import { useLifeOsStore } from './useLifeOsStore';
import { useAuthStore } from './useAuthStore';
import { generateId } from '../lib/utils';
import { isSupabaseConfigured } from '../lib/supabase';

interface AiState {
  messages: ChatMessage[];
  isLoading: boolean;
  activeBriefing: DailyMissionBriefing | null;
  domainInsights: DomainInsight[];
  pendingAction: PendingActionPayload | null;
  activeConversationId: string | null;
  conversations: AIConversationRecord[];
  isChatOpen: boolean;

  // Actions
  setChatOpen: (isOpen: boolean) => void;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  confirmPendingAction: () => Promise<void>;
  cancelPendingAction: () => void;
  generateBriefing: () => DailyMissionBriefing | null;
  loadConversations: () => Promise<void>;
  startNewConversation: () => void;
  clearCurrentConversation: () => void;
}

const INITIAL_GREETING_MESSAGE: ChatMessage = {
  id: 'init-msg-001',
  role: 'assistant',
  content:
    "Greetings. I am **KRONOS AI Mission Control**.\n\nI have indexed your active tasks, calendar events, habits, goals, and fitness telemetry. How would you like to direct your mission today?",
  timestamp: new Date().toISOString(),
  status: 'sent',
};

export const useAiStore = create<AiState>((set, get) => ({
  messages: [INITIAL_GREETING_MESSAGE],
  isLoading: false,
  activeBriefing: null,
  domainInsights: [],
  pendingAction: null,
  activeConversationId: null,
  conversations: [],
  isChatOpen: false,

  setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),

  generateBriefing: () => {
    const auth = useAuthStore.getState();
    const lifeOs = useLifeOsStore.getState();

    if (!auth.user) return null;

    const ctx = buildAIContext({
      user: auth.user,
      tasks: lifeOs.tasks,
      events: lifeOs.events,
      habits: lifeOs.habits,
      goals: lifeOs.goals,
      reminders: lifeOs.reminders,
      activities: lifeOs.activities,
    });

    const briefing = generateDailyMissionBriefing(ctx);
    const insights = generateDomainInsights(ctx);

    set({
      activeBriefing: briefing,
      domainInsights: insights,
    });

    return briefing;
  },

  sendMessage: async (text: string) => {
    const auth = useAuthStore.getState();
    const lifeOs = useLifeOsStore.getState();
    const userId = auth.user?.id || 'demo-user-001';
    const isDemoMode = auth.isDemoMode;

    const userMsgId = generateId();
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    // Append user message immediately
    const updatedMessages = [...get().messages, userMessage];
    set({ messages: updatedMessages, isLoading: true });

    try {
      // Build latest context
      const ctx = buildAIContext({
        user: auth.user || {
          id: userId,
          email: 'demo@kronos.internal',
          fullName: 'Explorer',
          timezone: 'UTC',
          themePreference: 'dark',
          weeklyDistanceGoalKm: 25,
          dailyTaskGoal: 6,
          currentStreak: 5,
          totalActivitiesCount: 12,
        },
        tasks: lifeOs.tasks,
        events: lifeOs.events,
        habits: lifeOs.habits,
        goals: lifeOs.goals,
        reminders: lifeOs.reminders,
        activities: lifeOs.activities,
      });

      // Send to AI Service
      const response = await sendChatMessage({
        message: text,
        context: ctx,
        conversationHistory: updatedMessages,
        userId,
        isDemoMode,
      });

      const assistantMsgId = generateId();
      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        toolCalls: response.toolCalls?.map((tc) => ({
          id: tc.toolCallId,
          name: tc.toolName,
          arguments: tc.result || {},
        })),
        isConfirmationPrompt: response.requiresConfirmation,
        pendingAction: response.pendingAction,
        status: 'sent',
      };

      const finalMessages = [...updatedMessages, assistantMessage];

      set({
        messages: finalMessages,
        isLoading: false,
        pendingAction: response.pendingAction || null,
      });

      // Auto-save conversation
      const activeId = get().activeConversationId || generateId();
      set({ activeConversationId: activeId });

      await conversationService.saveConversation(
        userId,
        {
          id: activeId,
          title: text.slice(0, 32) || 'Mission Control Briefing',
          messages: finalMessages,
          contextType: 'general',
          createdAt: finalMessages[0].timestamp,
          updatedAt: new Date().toISOString(),
        },
        isDemoMode
      );
    } catch (err: any) {
      const errorMsgId = generateId();
      const errorMsg: ChatMessage = {
        id: errorMsgId,
        role: 'assistant',
        content:
          "Encountered an obstacle connecting to Mission Control. Tap below to retry or ask in offline mode.",
        timestamp: new Date().toISOString(),
        status: 'error',
        error: err?.message,
      };

      set({
        messages: [...updatedMessages, errorMsg],
        isLoading: false,
      });
    }
  },

  retryLastMessage: async () => {
    const msgs = get().messages;
    const lastUserIdx = [...msgs].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;

    const actualIdx = msgs.length - 1 - lastUserIdx;
    const lastUserMsg = msgs[actualIdx];

    // Filter out trailing error messages
    const trimmed = msgs.slice(0, actualIdx);
    set({ messages: trimmed });
    await get().sendMessage(lastUserMsg.content);
  },

  confirmPendingAction: async () => {
    const pending = get().pendingAction;
    const auth = useAuthStore.getState();
    const userId = auth.user?.id || 'demo-user-001';
    const isDemoMode = auth.isDemoMode;

    if (!pending) return;

    set({ isLoading: true });

    try {
      if (!isDemoMode && isSupabaseConfigured) {
        // Send confirmation directly to Edge Function with user JWT
        const lifeOs = useLifeOsStore.getState();
        const ctx = buildAIContext({
          user: auth.user || {
            id: userId,
            email: 'user@kronos.internal',
            fullName: 'Explorer',
            timezone: 'UTC',
            themePreference: 'dark',
            weeklyDistanceGoalKm: 25,
            dailyTaskGoal: 6,
            currentStreak: 5,
            totalActivitiesCount: 12,
          },
          tasks: lifeOs.tasks,
          events: lifeOs.events,
          habits: lifeOs.habits,
          goals: lifeOs.goals,
          reminders: lifeOs.reminders,
          activities: lifeOs.activities,
        });

        const res = await sendChatMessage({
          message: 'Confirmed',
          context: ctx,
          conversationHistory: get().messages,
          userId,
          isDemoMode: false,
          isConfirmed: true,
          pendingActionId: pending.id,
          pendingAction: pending,
        });

        const confirmMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: res.message,
          timestamp: new Date().toISOString(),
          status: 'sent',
        };

        set({
          messages: [...get().messages, confirmMsg],
          pendingAction: null,
          isLoading: false,
        });
      } else {
        // Local execution in demo mode
        const result = await executeKronosTool(
          pending.toolName,
          { ...(pending.payload || {}), isConfirmed: true },
          userId
        );

        const confirmMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: result.success
            ? `Action confirmed and executed: **${pending.description || pending.toolName}**.`
            : `Failed to execute: ${result.error || 'Unknown error'}`,
          timestamp: new Date().toISOString(),
          status: 'sent',
        };

        set({
          messages: [...get().messages, confirmMsg],
          pendingAction: null,
          isLoading: false,
        });
      }

      // Refresh briefing and store context
      get().generateBriefing();
    } catch (e: any) {
      set({ isLoading: false, pendingAction: null });
    }
  },

  cancelPendingAction: () => {
    const pending = get().pendingAction;
    if (!pending) return;

    const cancelMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: `Action cancelled: **${pending.description}**. No changes were made.`,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    set({
      messages: [...get().messages, cancelMsg],
      pendingAction: null,
    });
  },

  loadConversations: async () => {
    const auth = useAuthStore.getState();
    const userId = auth.user?.id;
    if (!userId) return;

    const convs = await conversationService.fetchConversations(userId, auth.isDemoMode);
    set({ conversations: convs });
  },

  startNewConversation: () => {
    set({
      messages: [INITIAL_GREETING_MESSAGE],
      activeConversationId: null,
      pendingAction: null,
    });
  },

  clearCurrentConversation: () => {
    set({
      messages: [INITIAL_GREETING_MESSAGE],
      pendingAction: null,
    });
  },
}));
