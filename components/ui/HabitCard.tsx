import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import {
  Check,
  Sparkles,
  Zap,
  Activity as ActivityIcon,
  Sun,
  BookOpen,
  Moon,
  Flame,
} from 'lucide-react-native';
import { Habit } from '../../types/models';
import { useThemeStore } from '../../store/useThemeStore';
import { Card } from './Card';
import { radii, spacing, typography } from '../../constants/theme';

export interface HabitCardProps {
  habit: Habit;
  onToggle: (habitId: string) => void;
  onPress?: (habit: Habit) => void;
  style?: StyleProp<ViewStyle>;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onToggle,
  onPress,
  style,
}) => {
  const { theme } = useThemeStore();
  const isCompleted = Boolean(habit.completedToday);
  const habitColor = habit.color || theme.primary;

  const renderIcon = () => {
    const iconSize = 16;
    switch (habit.icon) {
      case 'zap':
        return <Zap size={iconSize} color={habitColor} />;
      case 'activity':
        return <ActivityIcon size={iconSize} color={habitColor} />;
      case 'sun':
        return <Sun size={iconSize} color={habitColor} />;
      case 'book-open':
        return <BookOpen size={iconSize} color={habitColor} />;
      case 'moon':
        return <Moon size={iconSize} color={habitColor} />;
      default:
        return <Sparkles size={iconSize} color={habitColor} />;
    }
  };

  return (
    <Card
      style={[styles.card, style]}
      padding="md"
      onPress={onPress ? () => onPress(habit) : undefined}
    >
      <View style={styles.container}>
        {/* Habit Icon Box */}
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: `${habitColor}14` },
          ]}
        >
          {renderIcon()}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text
            style={[styles.title, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {habit.title}
          </Text>

          <View style={styles.streakRow}>
            <View style={[styles.streakBadge, { backgroundColor: `${theme.primary}14` }]}>
              <Flame size={11} color={theme.primary} style={styles.streakIcon} />
              <Text style={[styles.streakText, { color: theme.primary }]}>
                {habit.currentStreak}d streak
              </Text>
            </View>
            <Text style={[styles.category, { color: theme.textMuted }]}>
              • {habit.category}
            </Text>
          </View>
        </View>

        {/* Quick Check button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggle(habit.id)}
          style={[
            styles.checkButton,
            {
              backgroundColor: isCompleted ? theme.success : theme.surfaceElevated,
              borderColor: isCompleted ? theme.success : theme.border,
            },
          ]}
        >
          {isCompleted && <Check size={14} color="#FFFFFF" strokeWidth={2.5} />}
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
    marginRight: spacing.xs,
  },
  streakIcon: {
    marginRight: 2,
  },
  streakText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  category: {
    fontSize: 11,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
