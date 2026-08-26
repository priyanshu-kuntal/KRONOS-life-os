import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Moon,
  Sun,
  Laptop,
  Flame,
  Trophy,
  ShieldCheck,
  LogOut,
  Zap,
  UserCheck,
  Edit3,
  LogIn,
  Target,
  Plus,
  CheckCircle2,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { useToastStore } from '../../store/useToastStore';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { AppButton } from '../../components/ui/AppButton';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { EditProfileModal } from '../../components/ui/EditProfileModal';
import { GoalCard } from '../../components/ui/GoalCard';
import { GoalDetailModal } from '../../components/ui/GoalDetailModal';
import { GoalEditModal } from '../../components/ui/GoalEditModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { radii, spacing, typography } from '../../constants/theme';
import { ThemeMode, Goal } from '../../types/models';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, mode, setMode } = useThemeStore();
  const { user, isDemoMode, signOut } = useAuthStore();
  const { goals, getDailyTaskStats, getActiveGoalsStats } = useLifeOsStore();
  const { showToast } = useToastStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedGoalDetail, setSelectedGoalDetail] = useState<Goal | null>(null);
  const [goalEditModalState, setGoalEditModalState] = useState<{ visible: boolean; goal: Goal | null }>({
    visible: false,
    goal: null,
  });

  const taskStats = getDailyTaskStats();
  const goalStats = getActiveGoalsStats();

  const activeGoals = goals.filter((g) => g.status === 'active' && g.currentValue < g.targetValue);
  const completedGoals = goals.filter((g) => g.status === 'completed' || (g.targetValue > 0 && g.currentValue >= g.targetValue));

  const handleSignOut = async () => {
    await signOut();
    showToast({
      title: 'Signed Out',
      message: 'Life OS session closed.',
      type: 'info',
    });
    router.replace('/(auth)/login');
  };

  const handleThemeChange = (newMode: ThemeMode) => {
    setMode(newMode);
    showToast({
      title: 'Theme Applied',
      message: `${newMode.toUpperCase()} mode active.`,
      type: 'info',
    });
  };

  const displayName = user?.fullName || (isDemoMode ? 'Demo Explorer' : 'Life OS Member');
  const displayEmail = user?.email || (isDemoMode ? 'offline-sandbox@kronos.local' : 'member@kronos.os');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer maxWidth={1040}>
          {/* 1. TOP HEADER & USER CARD */}
          <View style={styles.topHeader}>
            <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
              Profile & Settings
            </Text>
          </View>

          <Card style={styles.userCard} padding="lg">
            <View style={styles.userRow}>
              <Avatar
                url={user?.avatarUrl}
                name={displayName}
                size="xl"
                online={!isDemoMode}
              />
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.userName, { color: theme.textPrimary }]}>
                    {displayName}
                  </Text>
                  <Badge
                    label={isDemoMode ? 'DEMO' : 'LIVE'}
                    variant={isDemoMode ? 'neutral' : 'primary'}
                    size="sm"
                    style={{ marginLeft: 6 }}
                  />
                </View>
                <Text style={[styles.userEmail, { color: theme.textMuted }]}>
                  {displayEmail}
                </Text>
                {user?.bio ? (
                  <Text style={[styles.userBio, { color: theme.textSecondary }]} numberOfLines={2}>
                    {user.bio}
                  </Text>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setEditModalVisible(true)}
              style={[
                styles.editProfileBtn,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}
            >
              <Edit3 size={14} color={theme.textPrimary} style={{ marginRight: 6 }} />
              <Text style={[styles.editProfileText, { color: theme.textPrimary }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </Card>

          {/* 2. STATS STRIP */}
          <View style={styles.statsRow}>
            <Card style={styles.statMiniCard} padding="md">
              <View style={[styles.statIconCircle, { backgroundColor: `${theme.secondary}14` }]}>
                <Flame size={15} color={theme.secondary} />
              </View>
              <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
                {user?.currentStreak || 7}d
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                Habit Streak
              </Text>
            </Card>

            <Card style={styles.statMiniCard} padding="md">
              <View style={[styles.statIconCircle, { backgroundColor: `${theme.primary}14` }]}>
                <Target size={15} color={theme.primary} />
              </View>
              <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
                {goalStats.completed}/{goalStats.total}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                Goals Hit
              </Text>
            </Card>

            <Card style={styles.statMiniCard} padding="md">
              <View style={[styles.statIconCircle, { backgroundColor: `${theme.success}14` }]}>
                <Zap size={15} color={theme.success} />
              </View>
              <Text style={[styles.statNumber, { color: theme.textPrimary }]}>
                {taskStats.percentage}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                Daily Tasks
              </Text>
            </Card>
          </View>

          {/* 3. STRATEGIC GOALS DASHBOARD */}
          <SectionHeader
            title="Strategic Goals"
            badgeCount={`${goalStats.active} active`}
            actionText="+ New Goal"
            onActionPress={() => setGoalEditModalState({ visible: true, goal: null })}
          />

          {activeGoals.length > 0 ? (
            activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onPress={(g) => setSelectedGoalDetail(g)}
              />
            ))
          ) : (
            <EmptyState
              icon={<Target size={24} color={theme.primary} />}
              title="No Active Goals"
              description="Define milestones like distance targets, books to read, or skills to master."
              actionText="Establish Goal"
              onActionPress={() => setGoalEditModalState({ visible: true, goal: null })}
            />
          )}

          {/* 4. COMPLETED GOALS (if any) */}
          {completedGoals.length > 0 && (
            <>
              <SectionHeader
                title="Accomplished Goals"
                badgeCount={completedGoals.length}
                style={{ marginTop: spacing.lg }}
              />
              {completedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onPress={(g) => setSelectedGoalDetail(g)}
                />
              ))}
            </>
          )}

          {/* 5. THEME SELECTION */}
          <SectionHeader title="Appearance" style={{ marginTop: spacing.lg }} />
          <Card style={styles.themeCard} padding="md">
            <View style={styles.themeButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleThemeChange('dark')}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: mode === 'dark' ? theme.primary : theme.surfaceElevated,
                    borderColor: mode === 'dark' ? theme.primary : theme.border,
                  },
                ]}
              >
                <Moon size={16} color={mode === 'dark' ? '#FFFFFF' : theme.textSecondary} />
                <Text
                  style={[
                    styles.themeBtnText,
                    { color: mode === 'dark' ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleThemeChange('light')}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: mode === 'light' ? theme.primary : theme.surfaceElevated,
                    borderColor: mode === 'light' ? theme.primary : theme.border,
                  },
                ]}
              >
                <Sun size={16} color={mode === 'light' ? '#FFFFFF' : theme.textSecondary} />
                <Text
                  style={[
                    styles.themeBtnText,
                    { color: mode === 'light' ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleThemeChange('system')}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: mode === 'system' ? theme.primary : theme.surfaceElevated,
                    borderColor: mode === 'system' ? theme.primary : theme.border,
                  },
                ]}
              >
                <Laptop size={16} color={mode === 'system' ? '#FFFFFF' : theme.textSecondary} />
                <Text
                  style={[
                    styles.themeBtnText,
                    { color: mode === 'system' ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  System
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* 6. SYSTEM STATUS CARD */}
          <SectionHeader title="System & Cloud Sync" />
          <Card style={styles.systemCard} padding="md">
            <View style={styles.sysRow}>
              <View style={styles.sysInfoCol}>
                <View style={styles.sysTitleRow}>
                  <ShieldCheck
                    size={16}
                    color={isSupabaseConfigured ? theme.success : theme.warning}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.sysTitle, { color: theme.textPrimary }]}>
                    {isSupabaseConfigured ? 'Supabase Cloud Connected' : 'Demo Local Sandbox'}
                  </Text>
                </View>
                <Text style={[styles.sysDesc, { color: theme.textMuted }]}>
                  {isSupabaseConfigured
                    ? 'Encrypted row-level security enabled.'
                    : 'Configure EXPO_PUBLIC_SUPABASE_URL for multi-device sync.'}
                </Text>
              </View>
              <Badge
                label={isSupabaseConfigured ? 'ONLINE' : 'SANDBOX'}
                variant={isSupabaseConfigured ? 'success' : 'neutral'}
                size="sm"
              />
            </View>
          </Card>

          {/* 7. AUTH ACTIONS */}
          <View style={styles.authActionSection}>
            {isDemoMode ? (
              <AppButton
                title="Sign In / Register Account"
                leftIcon={<LogIn size={16} color="#FFFFFF" />}
                onPress={() => router.push('/(auth)/login')}
                variant="primary"
                fullWidth
              />
            ) : (
              <AppButton
                title="Sign Out"
                leftIcon={<LogOut size={16} color={theme.danger} />}
                onPress={handleSignOut}
                variant="outline"
                fullWidth
                style={{ borderColor: `${theme.danger}40` }}
                textStyle={{ color: theme.danger }}
              />
            )}
          </View>

          <Text style={[styles.versionText, { color: theme.textMuted }]}>
            KRONOS Life OS • Build 2.4 (Phase 2D Production)
          </Text>
        </ResponsiveContainer>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
      />

      {/* Goal Detail & Progress Logger Modal */}
      <GoalDetailModal
        goal={selectedGoalDetail}
        visible={Boolean(selectedGoalDetail)}
        onClose={() => setSelectedGoalDetail(null)}
        onEditPress={(g) => {
          setSelectedGoalDetail(null);
          setGoalEditModalState({ visible: true, goal: g });
        }}
      />

      {/* Goal Create & Edit Modal */}
      <GoalEditModal
        goal={goalEditModalState.goal}
        visible={goalEditModalState.visible}
        onClose={() => setGoalEditModalState({ visible: false, goal: null })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : spacing.xl,
    paddingBottom: 96,
  },
  topHeader: {
    marginBottom: spacing.md,
  },
  pageTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.heavy,
  },
  userCard: {
    marginBottom: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  userEmail: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  userBio: {
    fontSize: typography.fontSize.xs,
    marginTop: 4,
    lineHeight: 16,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  editProfileText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statMiniCard: {
    flex: 1,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.heavy,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  themeCard: {
    marginBottom: spacing.md,
  },
  themeButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  systemCard: {
    marginBottom: spacing.md,
  },
  sysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sysInfoCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  sysTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sysTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  sysDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  authActionSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  versionText: {
    fontSize: 10.5,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
});
