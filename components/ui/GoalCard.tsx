import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Target, Calendar, CheckCircle2, Clock } from 'lucide-react-native';
import { Goal } from '../../types/models';
import { useThemeStore } from '../../store/useThemeStore';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { Badge } from './Badge';
import { radii, spacing, typography } from '../../constants/theme';
import { getGoalProgressSummary } from '../../features/goals/goalUtils';
import { GOAL_CATEGORY_COLORS, GoalCategory } from '../../features/goals/goalTypes';

export interface GoalCardProps {
  goal: Goal;
  onPress?: (goal: Goal) => void;
  style?: StyleProp<ViewStyle>;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onPress,
  style,
}) => {
  const { theme } = useThemeStore();
  const summary = getGoalProgressSummary(goal);
  const categoryColor = GOAL_CATEGORY_COLORS[goal.category as GoalCategory] || theme.primary;

  return (
    <Card
      style={[
        styles.card,
        {
          borderColor: summary.isCompleted ? `${theme.success}50` : theme.border,
          borderLeftWidth: 3.5,
          borderLeftColor: categoryColor,
        },
        style,
      ]}
      padding="md"
      onPress={onPress ? () => onPress(goal) : undefined}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          <Badge
            label={goal.category.toUpperCase()}
            size="sm"
            style={{ backgroundColor: `${categoryColor}18` }}
            textStyle={{ color: categoryColor, fontWeight: typography.fontWeight.bold }}
          />
          {summary.isCompleted ? (
            <Badge
              label="COMPLETED"
              variant="success"
              size="sm"
            />
          ) : (
            <View style={styles.daysBadge}>
              <Clock size={10} color={summary.isOverdue ? theme.danger : theme.textMuted} style={{ marginRight: 3 }} />
              <Text
                style={[
                  styles.daysText,
                  { color: summary.isOverdue ? theme.danger : theme.textMuted },
                ]}
              >
                {summary.label || 'Ongoing'}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.percentageText, { color: summary.isCompleted ? theme.success : theme.textPrimary }]}>
          {summary.percentage}%
        </Text>
      </View>

      <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
        {goal.title}
      </Text>

      {goal.description ? (
        <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
          {goal.description}
        </Text>
      ) : null}

      <View style={styles.progressSection}>
        <ProgressBar
          progress={summary.percentage}
          color={summary.isCompleted ? theme.success : categoryColor}
          height={6}
          backgroundColor={theme.surfaceHigherElevated}
        />

        <View style={styles.valuesRow}>
          <Text style={[styles.currentValue, { color: theme.textPrimary }]}>
            {goal.currentValue} <Text style={{ color: theme.textMuted, fontSize: 11 }}>/ {goal.targetValue} {goal.unit}</Text>
          </Text>
          {!summary.isCompleted && (
            <Text style={[styles.remainingValue, { color: theme.textMuted }]}>
              {summary.remaining} {goal.unit} left
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  daysText: {
    fontSize: 10.5,
    fontWeight: typography.fontWeight.medium,
  },
  percentageText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.heavy,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  description: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  progressSection: {
    marginTop: spacing.xs,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  currentValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  remainingValue: {
    fontSize: 10.5,
  },
});
