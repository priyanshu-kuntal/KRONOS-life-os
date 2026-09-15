import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Rect,
  Line,
} from 'react-native-svg';
import { MapPin, Navigation, Radio } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { SportType } from '../../types/models';
import { projectCoordinatesToSvg } from '../../lib/location/locationUtils';
import { radii, spacing, typography } from '../../constants/theme';

export interface RouteMapProps {
  points: { latitude: number; longitude: number }[];
  sportType?: SportType;
  height?: number;
  width?: number;
  showLivePulse?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  points,
  sportType = 'running',
  height = 240,
  width = 340,
  showLivePulse = false,
  style,
}) => {
  const { theme } = useThemeStore();

  const getSportColor = (): string => {
    switch (sportType) {
      case 'cycling':
        return theme.fitnessCycle; // #4F8CFF
      case 'walking':
        return theme.fitnessWalk; // #34D399
      case 'running':
      default:
        return theme.fitnessRun; // #38BDF8
    }
  };

  const routeColor = getSportColor();
  const projection = projectCoordinatesToSvg(points, width, height, 28);
  const hasRoute = points.length >= 2 && projection.pathD.length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.borderSubtle,
        },
        style,
      ]}
    >
      {hasRoute ? (
        <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            {/* Soft Ambient Glow Gradient */}
            <SvgGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={routeColor} stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#4F8CFF" stopOpacity="1" />
            </SvgGradient>

            {/* Background Map Grid Pattern */}
            <SvgGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.borderSubtle} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={theme.borderSubtle} stopOpacity="0.05" />
            </SvgGradient>
          </Defs>

          {/* Precision Grid Coordinates Lines */}
          <Line x1="0" y1={height / 3} x2={width} y2={height / 3} stroke={theme.borderSubtle} strokeWidth="0.75" strokeDasharray="4, 4" opacity="0.4" />
          <Line x1="0" y1={(height / 3) * 2} x2={width} y2={(height / 3) * 2} stroke={theme.borderSubtle} strokeWidth="0.75" strokeDasharray="4, 4" opacity="0.4" />
          <Line x1={width / 3} y1="0" x2={width / 3} y2={height} stroke={theme.borderSubtle} strokeWidth="0.75" strokeDasharray="4, 4" opacity="0.4" />
          <Line x1={(width / 3) * 2} y1="0" x2={(width / 3) * 2} y2={height} stroke={theme.borderSubtle} strokeWidth="0.75" strokeDasharray="4, 4" opacity="0.4" />

          {/* Route Outer Shadow/Glow Path */}
          <Path
            d={projection.pathD}
            fill="none"
            stroke={routeColor}
            strokeWidth="6"
            strokeOpacity="0.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Primary Route Path */}
          <Path
            d={projection.pathD}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Start Point Pin (Emerald Green) */}
          {projection.startPoint && (
            <>
              <Circle
                cx={projection.startPoint.x}
                cy={projection.startPoint.y}
                r="7"
                fill="#10B981"
                opacity="0.3"
              />
              <Circle
                cx={projection.startPoint.x}
                cy={projection.startPoint.y}
                r="4.5"
                fill="#10B981"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* Current / Finish Point (Pulsing Target) */}
          {projection.endPoint && (
            <>
              {showLivePulse && (
                <Circle
                  cx={projection.endPoint.x}
                  cy={projection.endPoint.y}
                  r="11"
                  fill={routeColor}
                  opacity="0.3"
                />
              )}
              <Circle
                cx={projection.endPoint.x}
                cy={projection.endPoint.y}
                r="6.5"
                fill={routeColor}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </>
          )}
        </Svg>
      ) : (
        <View style={styles.emptyContainer}>
          <Radio size={28} color={theme.textMuted} style={styles.radarIcon} />
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
            Acquiring GPS Satellite Signal...
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Move outdoors or start workout to render live telemetry path
          </Text>
        </View>
      )}

      {/* Telemetry Point Counter Pill */}
      {hasRoute && (
        <View
          style={[
            styles.telemetryBadge,
            { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
          ]}
        >
          <Navigation size={10} color={routeColor} style={{ marginRight: 4 }} />
          <Text style={[styles.telemetryText, { color: theme.textSecondary }]}>
            {points.length} GPS Points
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  radarIcon: {
    marginBottom: spacing.xs,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  telemetryBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  telemetryText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
});
