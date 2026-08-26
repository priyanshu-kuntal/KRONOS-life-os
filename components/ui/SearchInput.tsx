import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { radii, spacing, typography } from '../../constants/theme';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: ViewStyle;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search tasks, events, habits...',
  onClear,
  style,
}) => {
  const { theme } = useThemeStore();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      <Search size={18} color={theme.textMuted} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        style={[styles.input, { color: theme.textPrimary }]}
      />
      {value.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          style={styles.clearBtn}
        >
          <X size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: typography.fontSize.sm,
  },
  clearBtn: {
    padding: spacing.xxs,
  },
});
