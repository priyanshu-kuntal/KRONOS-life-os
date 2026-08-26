import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { radii, spacing, typography } from '../../constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  secureTextEntry,
  ...restProps
}) => {
  const { theme } = useThemeStore();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: error
              ? theme.danger
              : isFocused
              ? theme.primary
              : theme.border,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}

        <TextInput
          placeholderTextColor={theme.textMuted}
          style={[
            styles.textInput,
            {
              color: theme.textPrimary,
              paddingLeft: leftIcon ? 0 : spacing.md,
              paddingRight: isPassword || rightIcon ? 0 : spacing.md,
            },
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...restProps}
        />

        {isPassword ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIconWrapper}
          >
            {isPasswordVisible ? (
              <EyeOff size={18} color={theme.textSecondary} />
            ) : (
              <Eye size={18} color={theme.textSecondary} />
            )}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIconWrapper}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hintText, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    letterSpacing: typography.letterSpacing.wide,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    height: 48,
  },
  leftIconWrapper: {
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: typography.fontSize.base,
  },
  rightIconWrapper: {
    paddingRight: spacing.md,
    paddingLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xxs,
    fontWeight: typography.fontWeight.medium,
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xxs,
  },
});
