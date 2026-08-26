import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  StyleProp,
  useWindowDimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { radii, spacing, typography } from '../../constants/theme';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  style,
}) => {
  const { theme } = useThemeStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[
            styles.backdrop,
            {
              backgroundColor: theme.overlay,
              alignItems: isDesktop ? 'center' : 'stretch',
              justifyContent: isDesktop ? 'center' : 'flex-end',
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[
                styles.keyboardAvoid,
                {
                  maxWidth: isDesktop ? 600 : '100%',
                },
              ]}
            >
              <View
                style={[
                  styles.sheetContainer,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.borderActive,
                    borderRadius: isDesktop ? radii['2xl'] : undefined,
                    borderTopLeftRadius: radii['2xl'],
                    borderTopRightRadius: radii['2xl'],
                    borderWidth: isDesktop ? 1 : 0,
                    borderTopWidth: 1,
                  },
                  style,
                ]}
              >
                {/* Drag Handle (Mobile only) */}
                {!isDesktop && (
                  <View style={styles.handleWrapper}>
                    <View style={[styles.handle, { backgroundColor: theme.borderActive }]} />
                  </View>
                )}

                {/* Header */}
                {(title || subtitle) && (
                  <View style={styles.header}>
                    <View style={styles.headerTitles}>
                      {title && (
                        <Text style={[styles.title, { color: theme.textPrimary }]}>
                          {title}
                        </Text>
                      )}
                      {subtitle && (
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                          {subtitle}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={onClose}
                      style={[styles.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                      <X size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Content */}
                <View style={styles.content}>{children}</View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  keyboardAvoid: {
    width: '100%',
  },
  sheetContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.xl,
    paddingTop: spacing.sm,
    maxHeight: '90%',
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  headerTitles: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: spacing.xs,
  },
});
