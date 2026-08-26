import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Target, CheckCircle2, Clock, Trash2, Edit3, Plus, CheckSquare, Sparkles } from 'lucide-react-native';
import { Goal, Task, Habit } from '../../types/models';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { useToastStore } from '../../store/useToastStore';
import { useThemeStore } from '../../store/useThemeStore';
import { BottomSheet } from './BottomSheet';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { Badge } from './Badge';
import { Input } from './Input';
import { AppButton } from './AppButton';
import { radii, spacing, typography } from '../../constants/theme';
import { getGoalProgressSummary } from '../../features/goals/goalUtils';
import { GOAL_CATEGORY_COLORS, GoalCategory } from '../../features/goals/goalTypes';

export interface GoalDetailModalProps {
  goal: Goal | null;
  visible: boolean;
  onClose: () => void;
  onEditPress?: (goal: Goal) => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  goal,
  visible,
  onClose,
  onEditPress,
}) => {
  const { tasks, habits, updateGoalProgress, updateGoal, deleteGoal } = useLifeOsStore();
  const { showToast } = useToastStore();
  const { theme } = useThemeStore();

  const [customAddValue, setCustomAddValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!goal) return null;

  const summary = getGoalProgressSummary(goal);
  const categoryColor = GOAL_CATEGORY_COLORS[goal.category as GoalCategory] || theme.primary;

  // Find linked tasks & habits
  const relatedTasks = tasks.filter((t) => t.goalId === goal.id);
  const relatedHabits = habits.filter((h) => h.goalId === goal.id);

  const handleQuickAdd = async (delta: number) => {
    try {
      setIsUpdating(true);
      const res = await updateGoalProgress(goal.id, delta, true);
      if (res.success) {
        showToast({
          title: 'Progress Updated',
          message: `Added +${delta} ${goal.unit} towards "${goal.title}".`,
          type: 'success',
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCustomAdd = async () => {
    const val = parseFloat(customAddValue);
    if (isNaN(val) || val <= 0) return;

    try {
      setIsUpdating(true);
      const res = await updateGoalProgress(goal.id, val, true);
      if (res.success) {
        showToast({
          title: 'Progress Updated',
          message: `Added +${val} ${goal.unit}.`,
          type: 'success',
        });
        setCustomAddValue('');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleCompletion = async () => {
    try {
      setIsUpdating(true);
      const newStatus = summary.isCompleted ? 'active' : 'completed';
      const newVal = summary.isCompleted ? Math.min(goal.currentValue, Math.max(0, goal.targetValue - 1)) : goal.targetValue;
      const res = await updateGoal(goal.id, {
        status: newStatus,
        currentValue: newVal,
      });

      if (res.success) {
        showToast({
          title: newStatus === 'completed' ? 'Goal Accomplished!' : 'Goal Reopened',
          message: newStatus === 'completed' ? `Congratulations on completing "${goal.title}"!` : `"${goal.title}" is back in progress.`,
          type: 'success',
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete goal "${goal.title}"?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Goal',
        `Are you sure you want to delete "${goal.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const performDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteGoal(goal.id);
      if (res.success) {
        showToast({
          title: 'Goal Deleted',
          message: 'Goal removed from your objectives.',
          type: 'info',
        });
        onClose();
      } else {
        showToast({
          title: 'Deletion Failed',
          message: res.error || 'Could not delete goal.',
          type: 'error',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={goal.title}
      subtitle={`${goal.category.toUpperCase()} • ${goal.unit.toUpperCase()} Target`}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        {/* Description */}
        {goal.description ? (
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {goal.description}
          </Text>
        ) : null}

        {/* 1. Core Progress Card */}
        <Card style={styles.progressCard} padding="md">
          <View style={styles.progressHeader}>
            <Text style={[styles.progressPct, { color: summary.isCompleted ? theme.success : theme.textPrimary }]}>
              {summary.percentage}%
            </Text>
            <View style={styles.daysBadge}>
              <Clock size={12} color={summary.isOverdue ? theme.danger : theme.textMuted} style={{ marginRight: 3 }} />
              <Text style={[styles.daysText, { color: summary.isOverdue ? theme.danger : theme.textMuted }]}>
                {summary.label || 'Ongoing'}
              </Text>
            </View>
          </View>

          <ProgressBar
            progress={summary.percentage}
            color={summary.isCompleted ? theme.success : categoryColor}
            height={8}
            backgroundColor={theme.surfaceHigherElevated}
            style={{ marginVertical: spacing.sm }}
          />

          <View style={styles.statSplitRow}>
            <View>
              <Text style={[styles.statSub, { color: theme.textMuted }]}>CURRENT</Text>
              <Text style={[styles.statVal, { color: theme.textPrimary }]}>
                {goal.currentValue} {goal.unit}
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.statSub, { color: theme.textMuted }]}>TARGET</Text>
              <Text style={[styles.statVal, { color: theme.textPrimary }]}>
                {goal.targetValue} {goal.unit}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.statSub, { color: theme.textMuted }]}>REMAINING</Text>
              <Text style={[styles.statVal, { color: theme.textPrimary }]}>
                {summary.remaining} {goal.unit}
              </Text>
            </View>
          </View>
        </Card>

        {/* 2. Quick Progress Adder */}
        {!summary.isCompleted && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              LOG PROGRESS (+{goal.unit})
            </Text>
            <View style={styles.quickPillRow}>
              {[1, 5, 10, 25].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  activeOpacity={0.75}
                  onPress={() => handleQuickAdd(amt)}
                  disabled={isUpdating}
                  style={[
                    styles.quickPill,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                  ]}
                >
                  <Plus size={12} color={theme.primary} />
                  <Text style={[styles.quickPillText, { color: theme.textPrimary }]}>
                    {amt} {goal.unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Log Input */}
            <View style={styles.customAddRow}>
              <View style={{ flex: 1, marginRight: spacing.xs }}>
                <Input
                  placeholder={`Custom amount in ${goal.unit}`}
                  keyboardType="numeric"
                  value={customAddValue}
                  onChangeText={setCustomAddValue}
                />
              </View>
              <AppButton
                title="Add"
                onPress={handleCustomAdd}
                loading={isUpdating}
                disabled={!customAddValue.trim()}
                style={{ height: 46, paddingHorizontal: spacing.lg }}
              />
            </View>
          </>
        )}

        {/* 3. Related Objectives (Tasks & Habits) */}
        {(relatedTasks.length > 0 || relatedHabits.length > 0) && (
          <View style={styles.relatedSection}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              LINKED MILESTONES
            </Text>
            {relatedTasks.map((t) => (
              <Card key={t.id} style={styles.subCard} padding="sm">
                <View style={styles.subCardRow}>
                  <CheckSquare size={14} color={theme.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.subCardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <Badge label={t.status.toUpperCase()} size="sm" variant={t.status === 'completed' ? 'success' : 'neutral'} />
                </View>
              </Card>
            ))}
            {relatedHabits.map((h) => (
              <Card key={h.id} style={styles.subCard} padding="sm">
                <View style={styles.subCardRow}>
                  <Sparkles size={14} color={theme.secondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.subCardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {h.title}
                  </Text>
                  <Badge label={`${h.currentStreak}d streak`} size="sm" variant="primary" />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* 4. Action Row */}
        <View style={styles.actionRow}>
          <AppButton
            title={summary.isCompleted ? 'Reopen Goal' : 'Mark as Completed'}
            onPress={handleToggleCompletion}
            loading={isUpdating}
            variant={summary.isCompleted ? 'outline' : 'primary'}
            style={{ flex: 1 }}
          />

          {onEditPress && (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                onClose();
                onEditPress(goal);
              }}
              style={[
                styles.iconBtn,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}
            >
              <Edit3 size={16} color={theme.textPrimary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={confirmDelete}
            disabled={isDeleting}
            style={[
              styles.iconBtn,
              { backgroundColor: `${theme.danger}18`, borderColor: `${theme.danger}40` },
            ]}
          >
            <Trash2 size={16} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  progressCard: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressPct: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
  },
  statSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  statSub: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  quickPillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  quickPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  customAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  relatedSection: {
    marginBottom: spacing.md,
  },
  subCard: {
    marginBottom: spacing.xs,
  },
  subCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subCardTitle: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
