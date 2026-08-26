import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, useWindowDimensions } from 'react-native';

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * ResponsiveContainer ensures content remains centered and beautifully proportioned
 * on large desktop and tablet screens while expanding smoothly to 100% on mobile devices.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 1040,
  style,
}) => {
  const { width } = useWindowDimensions();

  return (
    <View
      style={[
        styles.container,
        {
          maxWidth: width >= 768 ? maxWidth : '100%',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
  },
});
