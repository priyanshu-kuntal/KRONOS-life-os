import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Play, Navigation, AlertCircle } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { WorkoutHUD } from '../../components/ui/WorkoutHUD';
import { RouteMap } from '../../components/ui/RouteMap';
import { WorkoutControls } from '../../components/ui/WorkoutControls';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { AppButton } from '../../components/ui/AppButton';
import { Input } from '../../components/ui/Input';
import { radii, spacing, typography } from '../../constants/theme';
import { SportType } from '../../types/models';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user, isDemoMode } = useAuthStore();
  const { showToast } = useToastStore();
  const {
    status,
    sportType,
    setSportType,
    startWorkout,
    finishWorkout,
    discardWorkout,
    routePoints,
    errorMessage,
  } = useWorkoutStore();

  const [notes, setNotes] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  const userId = user?.id || (isDemoMode ? 'demo-user-001' : 'guest-user');

  const handleBack = () => {
    if (status === 'active' || status === 'paused') {
      if (Platform.OS === 'web') {
        const confirmDiscard = window.confirm(
          'Workout in progress! Discard session and return to Dashboard?'
        );
        if (confirmDiscard) {
          discardWorkout();
          router.back();
        }
      } else {
        Alert.alert(
          'Workout In Progress',
          'Discard current tracking session and exit?',
          [
            { text: 'Keep Tracking', style: 'cancel' },
            {
              text: 'Discard & Exit',
              style: 'destructive',
              onPress: async () => {
                await discardWorkout();
                router.back();
              },
            },
          ]
        );
      }
    } else {
      router.back();
    }
  };

  const handleStart = async () => {
    const started = await startWorkout(userId, sportType);
    if (!started) {
      showToast({
        title: 'Location Notice',
        message: 'Running in simulated GPS mode for preview.',
        type: 'info',
      });
    }
  };

  const handleFinishConfirmed = async () => {
    try {
      setIsFinishing(true);
      const res = await finishWorkout(notes);
      if (res.success) {
        showToast({
          title: 'Workout Completed!',
          message: `Saved ${res.activity?.title || 'session'} to athletic logbook.`,
          type: 'success',
        });
        router.replace('/(tabs)/activity');
      }
    } finally {
      setIsFinishing(false);
    }
  };

  const handleDiscardConfirmed = async () => {
    await discardWorkout();
    showToast({
      title: 'Workout Discarded',
      message: 'Session erased.',
      type: 'info',
    });
    router.replace('/(tabs)/activity');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer maxWidth={680}>
          {/* 1. TOP NAVIGATION HEADER */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBack}
              style={[
                styles.backBtn,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle },
              ]}
            >
              <ChevronLeft size={20} color={theme.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                {status === 'idle' ? 'Ready to Track' : 'Live Workout HUD'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                {status === 'idle'
                  ? 'Select sport & acquire GPS lock'
                  : 'Real-time telemetry recording'}
              </Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {/* 2. ERROR / NOTICE BANNER */}
          {errorMessage && (
            <View style={[styles.errorBanner, { backgroundColor: theme.danger + '20', borderColor: theme.danger }]}>
              <AlertCircle size={16} color={theme.danger} style={{ marginRight: 6 }} />
              <Text style={[styles.errorText, { color: theme.danger }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {/* 3. SPORT TYPE PICKER (WHEN IDLE) */}
          {status === 'idle' && (
            <View style={styles.idleSportSection}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                CHOOSE SPORT
              </Text>
              <View style={styles.sportGrid}>
                {(['running', 'cycling', 'walking', 'hiking', 'workout'] as SportType[]).map(
                  (sport) => {
                    const isSelected = sportType === sport;
                    return (
                      <TouchableOpacity
                        key={sport}
                        activeOpacity={0.75}
                        onPress={() => setSportType(sport)}
                        style={[
                          styles.sportCard,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.surfaceElevated,
                            borderColor: isSelected ? theme.primary : theme.borderSubtle,
                          },
                        ]}
                      >
                        <Navigation
                          size={18}
                          color={isSelected ? '#FFFFFF' : theme.textSecondary}
                          style={{ marginBottom: 6 }}
                        />
                        <Text
                          style={[
                            styles.sportCardLabel,
                            {
                              color: isSelected ? '#FFFFFF' : theme.textSecondary,
                              fontWeight: isSelected ? typography.fontWeight.bold : typography.fontWeight.medium,
                            },
                          ]}
                        >
                          {sport.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>

              <View style={styles.startBtnWrap}>
                <AppButton
                  title="START WORKOUT"
                  leftIcon={<Play size={18} color="#FFFFFF" style={{ marginRight: 6 }} />}
                  onPress={handleStart}
                  size="lg"
                  variant="primary"
                />
              </View>
            </View>
          )}

          {/* 4. ACTIVE / PAUSED HUD */}
          {(status === 'active' || status === 'paused') && (
            <>
              {/* PRIMARY TELEMETRY HUD */}
              <WorkoutHUD />

              {/* VECTOR ROUTE MAP WITH LIVE PULSING POSITION */}
              <Text style={[styles.sectionTitle, { color: theme.textMuted, marginTop: spacing.md }]}>
                LIVE ROUTE MAP
              </Text>
              <RouteMap
                points={routePoints}
                sportType={sportType}
                height={220}
                showLivePulse={status === 'active'}
              />

              {/* OPTIONAL NOTES INPUT */}
              {status === 'paused' && (
                <View style={styles.notesSection}>
                  <Input
                    label="Workout Notes (Optional)"
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="E.g. Great rhythm through hill interval, legs felt fresh"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              )}

              {/* WORKOUT INTERACTION CONTROLS */}
              <WorkoutControls
                onFinishConfirmed={handleFinishConfirmed}
                onDiscardConfirmed={handleDiscardConfirmed}
              />
            </>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : spacing.xl,
    paddingBottom: 96,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.heavy,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  idleSportSection: {
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.sm,
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  sportCard: {
    minWidth: '47%',
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportCardLabel: {
    fontSize: typography.fontSize.xs,
    letterSpacing: typography.letterSpacing.wider,
  },
  startBtnWrap: {
    marginTop: spacing.md,
  },
  notesSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
});
