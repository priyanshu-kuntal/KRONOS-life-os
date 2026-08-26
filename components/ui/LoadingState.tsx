import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { spacing, typography } from '../../constants/theme';

export interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading Life OS...',
  style,
}) => {
  const { theme } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }, style]}>
      <ActivityIndicator size="large" color={theme.primary} />
      {message && (
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  message: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
