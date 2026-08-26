import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Flame, Trophy, Calendar, Check, Trash2 } from 'lucide-react-native';
import { Habit, HabitLog } from '../../types/models';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { useToastStore } from '../../store/useToastStore';
import { useThemeStore } from '../../store/useThemeStore';
import { habitService } from '../../features/habits/habitService';
import { calculateHabitStreak } from '../../features/habits/streakUtils';
import { BottomSheet } from './BottomSheet';
import { Card } from './Card';
import { Badge } from './Badge';
import { radii, spacing, typography } from '../../constants/theme';

export interface HabitDetailModalProps {
  habit: Habit | null;
  visible: boolean;
  onClose: () => void;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  habit,
  visible,
  onClose,
}) => {
  const { deleteHabit } = useLifeOsStore();
  const { showToast } = useToastStore();
  const { theme } = useThemeStore();

  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (habit && visible) {
      habitService.fetchLogsForHabit(habit.id).then((fetchedLogs) => {
        setLogs(fetchedLogs);
      });
    }
  }, [habit, visible]);

  if (!habit) return null;

  const streakData = calculateHabitStreak(logs);

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete habit "${habit.title}"?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Habit',
        `Are you sure you want to permanently delete "${habit.title}"?`,
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
      const res = await deleteHabit(habit.id);
      if (res.success) {
        showToast({
          title: 'Habit Deleted',
          message: 'Habit removed from tracking.',
          type: 'info',
        });
        onClose();
      } else {
        showToast({
          title: 'Deletion Failed',
          message: res.error || 'Could not delete habit.',
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
      title={habit.title}
      subtitle={`${habit.category} • ${habit.frequency.toUpperCase()} Target`}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        {/* Habit Description if present */}
        {habit.description && (
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {habit.description}
          </Text>
        )}

        {/* 1. Core Streak Metrics Strip */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard} padding="md">
            <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}14` }]}>
              <Flame size={16} color={theme.primary} />
            </View>
            <Text style={[styles.metricVal, { color: theme.textPrimary }]}>
              {streakData.currentStreak}d
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              Current Streak
            </Text>
          </Card>

          <Card style={styles.metricCard} padding="md">
            <View style={[styles.iconCircle, { backgroundColor: `${theme.secondary}14` }]}>
              <Trophy size={16} color={theme.secondary} />
            </View>
            <Text style={[styles.metricVal, { color: theme.textPrimary }]}>
              {streakData.bestStreak}d
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              Best Streak
            </Text>
          </Card>

          <Card style={styles.metricCard} padding="md">
            <View style={[styles.iconCircle, { backgroundColor: `${theme.success}14` }]}>
              <Calendar size={16} color={theme.success} />
            </View>
            <Text style={[styles.metricVal, { color: theme.textPrimary }]}>
              {streakData.completionRate}%
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              30d Consistency
            </Text>
          </Card>
        </View>

        {/* 2. 7-Day History Squares */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          PAST 7 DAYS
        </Text>
        <Card style={styles.historyCard} padding="md">
          <View style={styles.historySquaresRow}>
            {streakData.weeklyHistory.map((day) => (
              <View key={day.date} style={styles.dayCol}>
                <Text style={[styles.dayLabel, { color: theme.textMuted }]}>
                  {day.dayLabel}
                </Text>
                <View
                  style={[
                    styles.daySquare,
                    {
                      backgroundColor: day.completed
                        ? theme.success
                        : day.isToday
                        ? theme.surfaceHigherElevated
                        : theme.surfaceElevated,
                      borderColor: day.isToday ? theme.primary : theme.border,
                      borderWidth: day.isToday ? 1.5 : 1,
                    },
                  ]}
                >
                  {day.completed ? (
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text style={[styles.dayNum, { color: theme.textMuted }]}>
                      {day.dayNumber}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* 3. Delete Action */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={confirmDelete}
            disabled={isDeleting}
            style={[
              styles.deleteButton,
              { backgroundColor: `${theme.danger}18`, borderColor: `${theme.danger}40` },
            ]}
          >
            <Trash2 size={15} color={theme.danger} style={{ marginRight: 6 }} />
            <Text style={[styles.deleteText, { color: theme.danger }]}>
              Delete Habit
            </Text>
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
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.heavy,
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.xs,
  },
  historyCard: {
    marginBottom: spacing.lg,
  },
  historySquaresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 6,
  },
  daySquare: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: {
    fontSize: 10.5,
    fontWeight: typography.fontWeight.medium,
  },
  actionSection: {
    marginBottom: spacing.lg,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  deleteText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
});
