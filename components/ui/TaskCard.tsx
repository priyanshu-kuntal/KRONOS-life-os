import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Check, Clock } from 'lucide-react-native';
import { Task } from '../../types/models';
import { useThemeStore } from '../../store/useThemeStore';
import { Card } from './Card';
import { Badge, BadgeVariant } from './Badge';
import { radii, spacing, typography } from '../../constants/theme';

export interface TaskCardProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onPress?: (task: Task) => void;
  style?: StyleProp<ViewStyle>;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggle,
  onPress,
  style,
}) => {
  const { theme } = useThemeStore();
  const isCompleted = task.status === 'completed';

  const getPriorityVariant = (): BadgeVariant => {
    switch (task.priority) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'secondary';
      case 'low':
      default:
        return 'neutral';
    }
  };

  return (
    <Card
      style={[
        styles.card,
        {
          opacity: isCompleted ? 0.65 : 1,
        },
        style,
      ]}
      padding="md"
      onPress={onPress ? () => onPress(task) : undefined}
    >
      <View style={styles.row}>
        {/* Checkbox button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggle(task.id)}
          style={[
            styles.checkbox,
            {
              backgroundColor: isCompleted ? theme.success : 'transparent',
              borderColor: isCompleted ? theme.success : theme.borderActive,
            },
          ]}
        >
          {isCompleted && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </TouchableOpacity>

        {/* Task Details */}
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              {
                color: isCompleted ? theme.textMuted : theme.textPrimary,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {task.description && !isCompleted && (
            <Text
              style={[styles.description, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {task.description}
            </Text>
          )}

          <View style={styles.metaRow}>
            {task.dueTime && (
              <View style={styles.timeTag}>
                <Clock size={12} color={theme.textMuted} style={styles.timeIcon} />
                <Text style={[styles.timeText, { color: theme.textMuted }]}>
                  {task.dueTime}
                </Text>
              </View>
            )}

            <Badge
              label={task.priority.toUpperCase()}
              variant={getPriorityVariant()}
              size="sm"
            />

            {task.category && (
              <Badge
                label={task.category}
                variant="neutral"
                size="sm"
              />
            )}
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  description: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xxs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xxs,
  },
  timeIcon: {
    marginRight: 4,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
