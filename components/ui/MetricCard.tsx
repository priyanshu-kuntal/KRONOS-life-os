import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { Card } from './Card';
import { radii, spacing, typography } from '../../constants/theme';

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  style?: StyleProp<ViewStyle>;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  accentColor,
  trend,
  style,
}) => {
  const { theme } = useThemeStore();
  const activeAccent = accentColor || theme.primary;

  return (
    <Card style={[styles.card, style]} padding="lg">
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>
          {title.toUpperCase()}
        </Text>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${activeAccent}1F` }]}>
            {icon}
          </View>
        )}
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: theme.textPrimary }]}>
          {value}
        </Text>
        {unit && (
          <Text style={[styles.unit, { color: activeAccent }]}>
            {' '}{unit}
          </Text>
        )}
      </View>

      {(subtitle || trend) && (
        <View style={styles.footerRow}>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              {subtitle}
            </Text>
          )}
          {trend && (
            <View
              style={[
                styles.trendBadge,
                {
                  backgroundColor: trend.isPositive !== false ? theme.successAlpha : theme.dangerAlpha,
                },
              ]}
            >
              <Text
                style={[
                  styles.trendText,
                  {
                    color: trend.isPositive !== false ? theme.success : theme.danger,
                  },
                ]}
              >
                {trend.value}
              </Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    minWidth: 140,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.wider,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: spacing.xxs,
  },
  value: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: typography.letterSpacing.tight,
  },
  unit: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.xxs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  trendBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  trendText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
