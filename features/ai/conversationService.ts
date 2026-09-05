// ==============================================================================
// KRONOS PHASE 4: AI MISSION CONTROL - CONVERSATION PERSISTENCE SERVICE
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ChatMessage } from './aiTypes';
import { generateId } from '../../lib/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AIConversationRecord {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  contextType: 'general' | 'schedule_optimization' | 'fitness_coaching' | 'daily_briefing';
  createdAt: string;
  updatedAt: string;
}

const DEMO_STORAGE_KEY = '@kronos_demo_ai_conversations';

export const conversationService = {
  /**
   * Fetches user conversations sorted by most recent.
   * Scoped strictly to the authenticated user's ID.
   */
  async fetchConversations(userId: string, isDemoMode = false): Promise<AIConversationRecord[]> {
    if (isDemoMode || !isSupabaseConfigured) {
      try {
        const json = await AsyncStorage.getItem(DEMO_STORAGE_KEY);
        if (!json) return [];
        const items: AIConversationRecord[] = JSON.parse(json);
        return items.filter((c) => c.userId === userId);
      } catch {
        return [];
      }
    }

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        messages: Array.isArray(row.messages) ? row.messages : [],
        contextType: row.context_type || 'general',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (err: any) {
      console.warn('[KRONOS AI] Error fetching conversations:', err?.message);
      return [];
    }
  },

  /**
   * Saves or updates a conversation record with full message history.
   */
  async saveConversation(
    userId: string,
    conv: Omit<AIConversationRecord, 'userId'> & { userId?: string },
    isDemoMode = false
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const record: AIConversationRecord = {
      id: conv.id || generateId(),
      userId,
      title: conv.title || 'Mission Control Briefing',
      messages: conv.messages,
      contextType: conv.contextType || 'general',
      createdAt: conv.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isDemoMode || !isSupabaseConfigured) {
      try {
        const json = await AsyncStorage.getItem(DEMO_STORAGE_KEY);
        const list: AIConversationRecord[] = json ? JSON.parse(json) : [];
        const existingIdx = list.findIndex((c) => c.id === record.id);
        if (existingIdx >= 0) {
          list[existingIdx] = record;
        } else {
          list.unshift(record);
        }
        await AsyncStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(list));
        return { success: true, id: record.id };
      } catch (e: any) {
        return { success: false, error: e?.message };
      }
    }

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('ai_conversations')
        .upsert({
          id: record.id,
          user_id: userId,
          title: record.title,
          messages: record.messages,
          context_type: record.contextType,
          updated_at: record.updatedAt,
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, id: data?.id || record.id };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to persist conversation' };
    }
  },

  /**
   * Deletes a conversation record for the user.
   */
  async deleteConversation(
    userId: string,
    conversationId: string,
    isDemoMode = false
  ): Promise<{ success: boolean; error?: string }> {
    if (isDemoMode || !isSupabaseConfigured) {
      try {
        const json = await AsyncStorage.getItem(DEMO_STORAGE_KEY);
        if (!json) return { success: true };
        const list: AIConversationRecord[] = JSON.parse(json);
        const filtered = list.filter((c) => !(c.id === conversationId && c.userId === userId));
        await AsyncStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(filtered));
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e?.message };
      }
    }

    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },
};
