import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Calendar, Activity as ActivityIcon, User } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { FloatingActionButton } from './FloatingActionButton';
import { spacing, typography } from '../../constants/theme';

export const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const { theme } = useThemeStore();
  const { setQuickActionOpen } = useLifeOsStore();
  const { width } = useWindowDimensions();

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? theme.primary : theme.textMuted;
    const size = 20;

    switch (routeName) {
      case 'index':
        return <Home size={size} color={color} strokeWidth={isFocused ? 2.5 : 1.75} />;
      case 'schedule':
        return <Calendar size={size} color={color} strokeWidth={isFocused ? 2.5 : 1.75} />;
      case 'activity':
        return <ActivityIcon size={size} color={color} strokeWidth={isFocused ? 2.5 : 1.75} />;
      case 'profile':
        return <User size={size} color={color} strokeWidth={isFocused ? 2.5 : 1.75} />;
      default:
        return <Home size={size} color={color} />;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return 'Home';
      case 'schedule':
        return 'Plan';
      case 'activity':
        return 'Activity';
      case 'profile':
        return 'Profile';
      default:
        return routeName;
    }
  };

  const visibleRoutes = state.routes.filter(
    (route) => !['_sitemap', '+not-found'].includes(route.name)
  );

  const leftRoutes = visibleRoutes.slice(0, 2);
  const rightRoutes = visibleRoutes.slice(2, 4);

  const renderTabItem = (route: any) => {
    const isFocused = state.routes[state.index].name === route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        activeOpacity={0.75}
        onPress={onPress}
        style={styles.tabItem}
      >
        {getTabIcon(route.name, isFocused)}
        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? theme.primary : theme.textMuted,
              fontWeight: isFocused
                ? typography.fontWeight.semibold
                : typography.fontWeight.medium,
            },
          ]}
        >
          {getTabLabel(route.name)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.outerContainer,
        {
          backgroundColor: theme.surfaceElevated,
          borderTopColor: theme.borderSubtle,
        },
      ]}
    >
      <View
        style={[
          styles.innerContainer,
          {
            maxWidth: width >= 768 ? 640 : '100%',
          },
        ]}
      >
        <View style={styles.tabGroup}>{leftRoutes.map(renderTabItem)}</View>

        {/* Central Floating Quick Action '+' Button */}
        <FloatingActionButton onPress={() => setQuickActionOpen(true)} />

        <View style={styles.tabGroup}>{rightRoutes.map(renderTabItem)}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    borderTopWidth: 1,
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 22 : 6,
    paddingTop: 6,
    paddingHorizontal: spacing.sm,
  },
  tabGroup: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 54,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
    letterSpacing: 0.1,
  },
});
