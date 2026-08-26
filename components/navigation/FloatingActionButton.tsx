import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { shadows } from '../../constants/theme';

export interface FloatingActionButtonProps {
  onPress: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onPress }) => {
  const { theme } = useThemeStore();

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[
          styles.button,
          {
            backgroundColor: theme.primary,
            ...shadows.glow(theme.primary),
          },
        ]}
      >
        <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    top: -14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
