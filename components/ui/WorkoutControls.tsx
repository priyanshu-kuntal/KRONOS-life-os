import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Pause, Play, CheckCircle2, Trash2, Zap, AlertTriangle } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { radii, spacing, typography } from '../../constants/theme';
import { AppButton } from './AppButton';

export interface WorkoutControlsProps {
  onFinishConfirmed: () => void;
  onDiscardConfirmed: () => void;
}

export const WorkoutControls: React.FC<WorkoutControlsProps> = ({
  onFinishConfirmed,
  onDiscardConfirmed,
}) => {
  const { theme } = useThemeStore();
  const {
    status,
    pauseWorkout,
    resumeWorkout,
    isSimulated,
    toggleSimulationMode,
  } = useWorkoutStore();

  const [discardModalVisible, setDiscardModalVisible] = useState(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* Simulation Mode Pill Switcher */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleSimulationMode}
        style={[
          styles.simulationPill,
          {
            backgroundColor: isSimulated ? theme.secondary + '20' : theme.surfaceElevated,
            borderColor: isSimulated ? theme.secondary : theme.borderSubtle,
          },
        ]}
      >
        <Zap
          size={12}
          color={isSimulated ? theme.secondary : theme.textMuted}
          style={{ marginRight: 5 }}
        />
        <Text
          style={[
            styles.simulationText,
            { color: isSimulated ? theme.secondary : theme.textMuted },
          ]}
        >
          {isSimulated ? 'DEMO GPS SIMULATION: ON' : 'ENABLE DEMO GPS SIMULATION'}
        </Text>
      </TouchableOpacity>

      {/* Main Control Actions */}
      {status === 'active' && (
        <View style={styles.singleButtonContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={pauseWorkout}
            style={[styles.circleButtonLarge, { backgroundColor: '#F59E0B' }]}
          >
            <Pause size={32} color="#FFFFFF" />
            <Text style={styles.circleButtonText}>PAUSE</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'paused' && (
        <View style={styles.pausedControlsRow}>
          {/* Discard Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDiscardModalVisible(true)}
            style={[styles.circleButtonSmall, { backgroundColor: theme.surfaceElevated, borderColor: theme.danger }]}
          >
            <Trash2 size={20} color={theme.danger} />
            <Text style={[styles.circleSubText, { color: theme.danger }]}>DISCARD</Text>
          </TouchableOpacity>

          {/* Resume Button (Center Dominant) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={resumeWorkout}
            style={[styles.circleButtonLarge, { backgroundColor: '#10B981' }]}
          >
            <Play size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
            <Text style={styles.circleButtonText}>RESUME</Text>
          </TouchableOpacity>

          {/* Finish Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFinishModalVisible(true)}
            style={[styles.circleButtonSmall, { backgroundColor: theme.surfaceElevated, borderColor: theme.primary }]}
          >
            <CheckCircle2 size={20} color={theme.primary} />
            <Text style={[styles.circleSubText, { color: theme.primary }]}>FINISH</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* DISCARD CONFIRMATION MODAL */}
      <Modal
        visible={discardModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDiscardModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AlertTriangle size={36} color={theme.danger} style={{ marginBottom: spacing.sm }} />
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Discard Workout?
            </Text>
            <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
              This will erase all current GPS telemetry, pace metrics, and distance recorded in this session.
            </Text>

            <View style={styles.modalBtnRow}>
              <AppButton
                title="Keep Tracking"
                variant="outline"
                onPress={() => setDiscardModalVisible(false)}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Discard"
                variant="danger"
                onPress={() => {
                  setDiscardModalVisible(false);
                  onDiscardConfirmed();
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* FINISH CONFIRMATION MODAL */}
      <Modal
        visible={finishModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFinishModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <CheckCircle2 size={36} color={theme.primary} style={{ marginBottom: spacing.sm }} />
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Complete Session?
            </Text>
            <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
              Save this workout and recorded GPS breadcrumbs to your KRONOS athletic logbook.
            </Text>

            <View style={styles.modalBtnRow}>
              <AppButton
                title="Continue"
                variant="outline"
                onPress={() => setFinishModalVisible(false)}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Save & Finish"
                variant="primary"
                onPress={() => {
                  setFinishModalVisible(false);
                  onFinishConfirmed();
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  simulationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  simulationText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
  },
  singleButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  circleButtonLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  circleButtonSmall: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.fontWeight.heavy,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  circleSubText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
});
