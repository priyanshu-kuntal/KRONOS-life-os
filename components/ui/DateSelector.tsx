import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { radii, spacing, typography } from '../../constants/theme';
import { getWeekDates } from '../../lib/utils';

export interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  style?: ViewStyle;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onSelectDate,
  style,
}) => {
  const { theme } = useThemeStore();
  const week = getWeekDates(new Date());

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {week.map((item) => {
          const isSelected = item.dateString === selectedDate;

          return (
            <TouchableOpacity
              key={item.dateString}
              activeOpacity={0.75}
              onPress={() => onSelectDate(item.dateString)}
              style={[
                styles.dayPill,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : item.isToday
                    ? theme.surfaceElevated
                    : theme.surface,
                  borderColor: isSelected
                    ? theme.primary
                    : item.isToday
                    ? theme.borderActive
                    : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayName,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : item.isToday
                      ? theme.primary
                      : theme.textSecondary,
                  },
                ]}
              >
                {item.dayName.toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  {
                    color: isSelected ? '#FFFFFF' : theme.textPrimary,
                  },
                ]}
              >
                {item.dayNumber}
              </Text>
              {item.isToday && !isSelected && (
                <View
                  style={[
                    styles.todayDot,
                    { backgroundColor: theme.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayPill: {
    width: 48,
    height: 64,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  dayName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
});
