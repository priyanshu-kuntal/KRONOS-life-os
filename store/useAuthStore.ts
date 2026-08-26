import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockProfile } from '../constants/mockData';
import { UserProfile } from '../types/models';
import { Database } from '../types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  isDemoMode: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ success: boolean; needsVerification?: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  clearError: () => void;
}

let authSubscriptionInitialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,
  isDemoMode: false,
  error: null,

  initializeAuth: async () => {
    // If Supabase is not configured with real credentials, default cleanly to Demo Mode
    if (!isSupabaseConfigured) {
      set({
        user: mockProfile,
        session: null,
        isDemoMode: true,
        isLoading: false,
        isInitialized: true,
      });
      return;
    }

    try {
      set({ isLoading: true });

      // 1. Fetch current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        // 2. Fetch or create user profile from Supabase
        const profile = await fetchOrCreateProfile(session.user.id, session.user.email || '', session.user.user_metadata?.full_name);
        set({
          session,
          user: profile,
          isDemoMode: false,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({
          session: null,
          user: null,
          isDemoMode: false,
          isLoading: false,
          isInitialized: true,
        });
      }

      // 3. Setup real-time auth state listener once
      if (!authSubscriptionInitialized) {
        authSubscriptionInitialized = true;
        supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (event === 'SIGNED_IN' && newSession?.user) {
            const profile = await fetchOrCreateProfile(
              newSession.user.id,
              newSession.user.email || '',
              newSession.user.user_metadata?.full_name
            );
            set({
              session: newSession,
              user: profile,
              isDemoMode: false,
              isLoading: false,
              isInitialized: true,
            });
          } else if (event === 'SIGNED_OUT') {
            set({
              session: null,
              user: null,
              isDemoMode: false,
              isLoading: false,
              isInitialized: true,
            });
          } else if (event === 'TOKEN_REFRESHED' && newSession) {
            set({ session: newSession });
          } else if (event === 'USER_UPDATED' && newSession?.user) {
            const profile = await fetchOrCreateProfile(
              newSession.user.id,
              newSession.user.email || '',
              newSession.user.user_metadata?.full_name
            );
            set({ session: newSession, user: profile });
          }
        });
      }
    } catch (err: any) {
      console.warn('Auth initialization error:', err?.message);
      set({
        session: null,
        user: null,
        isDemoMode: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // In sandbox/demo mode without env vars
      const demoUser: UserProfile = {
        ...mockProfile,
        id: 'demo-user-001',
        email,
        fullName: email.split('@')[0].replace('.', ' '),
      };
      set({ user: demoUser, isDemoMode: true, isLoading: false });
      return { success: true };
    }

    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        const profile = await fetchOrCreateProfile(
          data.user.id,
          data.user.email || email,
          data.user.user_metadata?.full_name
        );
        set({
          session: data.session,
          user: profile,
          isDemoMode: false,
          isLoading: false,
        });
      }

      return { success: true };
    } catch (err: any) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err?.message || '');
      set({ error: friendlyMessage, isLoading: false });
      return { success: false, error: friendlyMessage };
    }
  },

  signUpWithEmail: async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      const demoUser: UserProfile = {
        ...mockProfile,
        id: `demo-${Date.now()}`,
        email,
        fullName: fullName.trim(),
      };
      set({ user: demoUser, isDemoMode: true, isLoading: false });
      return { success: true };
    }

    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) throw error;

      // Check if email confirmation is required
      const isConfirmed = Boolean(data.session && data.user);
      if (isConfirmed && data.user) {
        const profile = await fetchOrCreateProfile(
          data.user.id,
          data.user.email || email,
          fullName.trim()
        );
        set({
          session: data.session,
          user: profile,
          isDemoMode: false,
          isLoading: false,
        });
        return { success: true, needsVerification: false };
      } else {
        set({ isLoading: false });
        return { success: true, needsVerification: true };
      }
    } catch (err: any) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err?.message || '');
      set({ error: friendlyMessage, isLoading: false });
      return { success: false, error: friendlyMessage };
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      set({
        user: null,
        session: null,
        isDemoMode: false,
        isLoading: false,
      });
    }
  },

  resetPassword: async (email: string) => {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      set({ isLoading: false });
      return { success: true };
    } catch (err: any) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err?.message || '');
      set({ error: friendlyMessage, isLoading: false });
      return { success: false, error: friendlyMessage };
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const currentUser = get().user;
    if (!currentUser) return { success: false, error: 'No user signed in' };

    const updatedUser: UserProfile = {
      ...currentUser,
      ...updates,
    };

    // Update in local state immediately
    set({ user: updatedUser });

    if (!isSupabaseConfigured || get().isDemoMode) {
      return { success: true };
    }

    try {
      const dbUpdates: Partial<ProfileRow> = {};
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.themePreference !== undefined) dbUpdates.theme_preference = updates.themePreference;
      if (updates.weeklyDistanceGoalKm !== undefined) dbUpdates.weekly_distance_goal_km = updates.weeklyDistanceGoalKm;
      if (updates.dailyTaskGoal !== undefined) dbUpdates.daily_task_goal = updates.dailyTaskGoal;
      dbUpdates.updated_at = new Date().toISOString();

      const client = supabase as any;
      const { error } = await client
        .from('profiles')
        .update(dbUpdates)
        .eq('id', currentUser.id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.warn('Profile update error:', err?.message);
      return { success: false, error: err?.message || 'Failed to update profile' };
    }
  },

  enterDemoMode: () => {
    set({
      user: mockProfile,
      session: null,
      isDemoMode: true,
      error: null,
      isLoading: false,
    });
  },

  exitDemoMode: () => {
    set({
      user: null,
      session: null,
      isDemoMode: false,
      error: null,
      isLoading: false,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Helper to fetch or create a user profile in Supabase
 */
async function fetchOrCreateProfile(
  userId: string,
  email: string,
  fullName?: string
): Promise<UserProfile> {
  const client = supabase as any;
  try {
    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      return {
        id: profile.id,
        email: profile.email || email,
        fullName: profile.full_name || fullName || email.split('@')[0],
        avatarUrl: profile.avatar_url || undefined,
        bio: profile.bio || '',
        timezone: profile.timezone || 'UTC',
        themePreference: profile.theme_preference || 'dark',
        weeklyDistanceGoalKm: Number(profile.weekly_distance_goal_km) || 25,
        dailyTaskGoal: Number(profile.daily_task_goal) || 6,
        currentStreak: 7,
        totalActivitiesCount: 12,
      };
    }

    // If profile row doesn't exist yet, insert one
    const newName = fullName || email.split('@')[0];
    const { data: inserted } = await client
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: newName,
        theme_preference: 'dark',
        weekly_distance_goal_km: 25.0,
        daily_task_goal: 6,
      })
      .select()
      .single();

    if (inserted) {
      return {
        id: inserted.id,
        email: inserted.email || email,
        fullName: inserted.full_name || newName,
        avatarUrl: inserted.avatar_url || undefined,
        bio: inserted.bio || '',
        timezone: inserted.timezone || 'UTC',
        themePreference: inserted.theme_preference || 'dark',
        weeklyDistanceGoalKm: Number(inserted.weekly_distance_goal_km) || 25,
        dailyTaskGoal: Number(inserted.daily_task_goal) || 6,
        currentStreak: 1,
        totalActivitiesCount: 0,
      };
    }
  } catch (err) {
    console.warn('Error in fetchOrCreateProfile:', err);
  }

  // Fallback
  return {
    id: userId,
    email,
    fullName: fullName || email.split('@')[0],
    avatarUrl: undefined,
    timezone: 'UTC',
    themePreference: 'dark',
    weeklyDistanceGoalKm: 25,
    dailyTaskGoal: 6,
    currentStreak: 1,
    totalActivitiesCount: 0,
  };
}

/**
 * Maps raw backend/network error strings to user-friendly messages
 */
function getFriendlyAuthErrorMessage(rawMessage: string): string {
  const msg = rawMessage.toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
    return 'Incorrect email address or password. Please try again.';
  }
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'An account with this email address already exists.';
  }
  if (msg.includes('password should be at least') || msg.includes('weak_password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (msg.includes('network request failed') || msg.includes('failed to fetch')) {
    return 'Network connection error. Please check your internet connection.';
  }
  if (msg.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return rawMessage || 'An unexpected authentication error occurred.';
}
