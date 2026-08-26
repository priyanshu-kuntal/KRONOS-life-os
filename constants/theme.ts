export interface ColorTheme {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfaceHigherElevated: string;
  surfaceSubtle: string;

  // Borders
  border: string;
  borderSubtle: string;
  borderActive: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Primary Action Accent (Electric Blue #4F8CFF)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryAlpha: string;

  // Secondary Accent (Cyan #38BDF8)
  secondary: string;
  secondaryLight: string;
  secondaryAlpha: string;

  // Semantic
  success: string;
  successAlpha: string;
  warning: string;
  warningAlpha: string;
  danger: string;
  dangerAlpha: string;
  info: string;
  infoAlpha: string;

  // Categorical / Feature
  habitStreak: string;
  habitStreakAlpha: string;
  aiIntelligence: string;
  aiIntelligenceAlpha: string;
  fitnessRun: string;
  fitnessCycle: string;
  fitnessWalk: string;

  // Overlays & Backdrop
  overlay: string;
  cardGlow: string;
}

export const darkTheme: ColorTheme = {
  background: '#08090C',
  backgroundSecondary: '#0C0E13',
  surface: '#111318',
  surfaceElevated: '#181B22',
  surfaceHigherElevated: '#1E222B',
  surfaceSubtle: '#13161D',

  border: '#242934',
  borderSubtle: '#1A1E26',
  borderActive: '#323B4C',

  textPrimary: '#F5F7FA',
  textSecondary: '#A1A8B5',
  textMuted: '#687080',
  textInverse: '#08090C',

  primary: '#4F8CFF',
  primaryLight: '#70A3FF',
  primaryDark: '#3A70D6',
  primaryAlpha: 'rgba(79, 140, 255, 0.12)',

  secondary: '#38BDF8',
  secondaryLight: '#7DD3FC',
  secondaryAlpha: 'rgba(56, 189, 248, 0.12)',

  success: '#34D399',
  successAlpha: 'rgba(52, 211, 153, 0.12)',
  warning: '#FBBF24',
  warningAlpha: 'rgba(251, 191, 36, 0.12)',
  danger: '#FB7185',
  dangerAlpha: 'rgba(251, 113, 133, 0.12)',
  info: '#38BDF8',
  infoAlpha: 'rgba(56, 189, 248, 0.12)',

  habitStreak: '#38BDF8',
  habitStreakAlpha: 'rgba(56, 189, 248, 0.12)',
  aiIntelligence: '#8B7CFF',
  aiIntelligenceAlpha: 'rgba(139, 124, 255, 0.12)',
  fitnessRun: '#38BDF8',
  fitnessCycle: '#4F8CFF',
  fitnessWalk: '#34D399',

  overlay: 'rgba(4, 5, 8, 0.82)',
  cardGlow: 'rgba(79, 140, 255, 0.06)',
};

export const lightTheme: ColorTheme = {
  background: '#F6F8FB',
  backgroundSecondary: '#EEF2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F3F8',
  surfaceHigherElevated: '#E8EDF5',
  surfaceSubtle: '#F8FAFC',

  border: '#E2E7EF',
  borderSubtle: '#EDF1F7',
  borderActive: '#CBD5E1',

  textPrimary: '#111827',
  textSecondary: '#667085',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  primaryAlpha: 'rgba(59, 130, 246, 0.10)',

  secondary: '#0EA5E9',
  secondaryLight: '#38BDF8',
  secondaryAlpha: 'rgba(14, 165, 233, 0.10)',

  success: '#10B981',
  successAlpha: 'rgba(16, 185, 129, 0.10)',
  warning: '#F59E0B',
  warningAlpha: 'rgba(245, 158, 11, 0.10)',
  danger: '#F43F5E',
  dangerAlpha: 'rgba(244, 63, 94, 0.10)',
  info: '#0EA5E9',
  infoAlpha: 'rgba(14, 165, 233, 0.10)',

  habitStreak: '#0EA5E9',
  habitStreakAlpha: 'rgba(14, 165, 233, 0.10)',
  aiIntelligence: '#7C3AED',
  aiIntelligenceAlpha: 'rgba(124, 58, 237, 0.10)',
  fitnessRun: '#0EA5E9',
  fitnessCycle: '#3B82F6',
  fitnessWalk: '#10B981',

  overlay: 'rgba(15, 23, 42, 0.45)',
  cardGlow: 'rgba(59, 130, 246, 0.05)',
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    mono: 'Courier',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 38,
    stat: 44,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.35,
    relaxed: 1.5,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 26,
  full: 9999,
};

export const shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  }),
};
