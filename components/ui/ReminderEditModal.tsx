import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Bell, Trash2, Clock, Calendar } from 'lucide-react-native';
import { Reminder, Priority } from '../../types/models';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { useThemeStore } from '../../store/useThemeStore';
import { BottomSheet } from './BottomSheet';
import { Input } from './Input';
import { AppButton } from './AppButton';
import { radii, spacing, typography } from '../../constants/theme';
import { ReminderOffset, REMINDER_OFFSETS } from '../../features/reminders/reminderTypes';
import { calculateReminderTime } from '../../features/reminders/reminderUtils';
import { getLocalDateString } from '../../features/tasks/taskUtils';

export interface ReminderEditModalProps {
  reminder: Reminder | null; // If null -> create mode
  visible: boolean;
  onClose: () => void;
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export const ReminderEditModal: React.FC<ReminderEditModalProps> = ({
  reminder,
  visible,
  onClose,
}) => {
  const { addReminder, updateReminder, deleteReminder } = useLifeOsStore();
  const { user, isDemoMode } = useAuthStore();
  const { showToast } = useToastStore();
  const { theme } = useThemeStore();

  const isEdit = Boolean(reminder);
  const userId = user?.id || (isDemoMode ? 'demo-user-001' : 'guest-user');

  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(getLocalDateString());
  const [timeStr, setTimeStr] = useState('18:00');
  const [offset, setOffset] = useState<ReminderOffset>('at_time');
  const [priority, setPriority] = useState<Priority>('medium');
  const [enabled, setEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title || '');
      setPriority(reminder.priority || 'medium');
      setEnabled(reminder.enabled !== undefined ? reminder.enabled : true);

      try {
        const d = new Date(reminder.remindAt);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setDateStr(`${y}-${m}-${day}`);

        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        setTimeStr(`${h}:${min}`);
      } catch {
        setDateStr(getLocalDateString());
        setTimeStr('18:00');
      }
    } else {
      setTitle('');
      setDateStr(getLocalDateString());
      setTimeStr('18:00');
      setOffset('at_time');
      setPriority('medium');
      setEnabled(true);
    }
  }, [reminder, visible]);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast({
        title: 'Title Required',
        message: 'Please provide a title for your reminder.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const baseIso = `${dateStr}T${timeStr}:00.000Z`;
      const remindAtIso = calculateReminderTime(baseIso, offset);

      if (isEdit && reminder) {
        const res = await updateReminder(reminder.id, {
          title: title.trim(),
          remindAt: remindAtIso,
          priority,
          enabled,
        });

        if (res.success) {
          showToast({
            title: 'Reminder Updated',
            message: `Saved changes to "${title.trim()}".`,
            type: 'success',
          });
          onClose();
        } else {
          showToast({
            title: 'Update Failed',
            message: res.error || 'Could not update reminder.',
            type: 'error',
          });
        }
      } else {
        const res = await addReminder(userId, {
          title: title.trim(),
          remindAt: remindAtIso,
          priority,
          enabled,
        });

        if (res.success) {
          showToast({
            title: 'Reminder Set',
            message: `Scheduled reminder for ${timeStr}.`,
            type: 'success',
          });
          onClose();
        } else {
          showToast({
            title: 'Creation Failed',
            message: res.error || 'Could not set reminder.',
            type: 'error',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = () => {
    if (!reminder) return;
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete reminder "${reminder.title}"?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Reminder',
        `Are you sure you want to delete "${reminder.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const performDelete = async () => {
    if (!reminder) return;
    try {
      setIsDeleting(true);
      const res = await deleteReminder(reminder.id);
      if (res.success) {
        showToast({
          title: 'Reminder Deleted',
          message: 'Reminder removed.',
          type: 'info',
        });
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isEdit ? 'Edit Reminder' : 'New Reminder'}
      subtitle="Configure alert and notifications"
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.formContainer}>
        <Input
          label="Reminder Title"
          placeholder="e.g. Prepare presentation notes"
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.inlineRow}>
          <View style={{ flex: 1.2, marginRight: spacing.xs }}>
            <Input
              label="Date"
              placeholder="YYYY-MM-DD"
              value={dateStr}
              onChangeText={setDateStr}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Time"
              placeholder="18:00"
              value={timeStr}
              onChangeText={setTimeStr}
            />
          </View>
        </View>

        {/* Offset Presets */}
        {!isEdit && (
          <>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              ALERT PRESET
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.offsetScroll}>
              {REMINDER_OFFSETS.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  activeOpacity={0.75}
                  onPress={() => setOffset(o.value)}
                  style={[
                    styles.offsetPill,
                    {
                      backgroundColor: offset === o.value ? theme.primary : theme.surfaceElevated,
                      borderColor: offset === o.value ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.offsetText,
                      { color: offset === o.value ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Priority Selector */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
          PRIORITY
        </Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p}
              activeOpacity={0.75}
              onPress={() => setPriority(p)}
              style={[
                styles.priorityPill,
                {
                  backgroundColor: priority === p ? theme.primary : theme.surfaceElevated,
                  borderColor: priority === p ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.priorityText,
                  { color: priority === p ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Enabled Toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setEnabled(!enabled)}
          style={[
            styles.toggleRow,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
          ]}
        >
          <View>
            <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
              Reminder Active
            </Text>
            <Text style={[styles.toggleSub, { color: theme.textMuted }]}>
              {enabled ? 'Alert is enabled' : 'Alert is disabled'}
            </Text>
          </View>
          <View
            style={[
              styles.switchTrack,
              { backgroundColor: enabled ? theme.primary : theme.surfaceHigherElevated },
            ]}
          >
            <View
              style={[
                styles.switchThumb,
                {
                  transform: [{ translateX: enabled ? 18 : 2 }],
                  backgroundColor: '#FFFFFF',
                },
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actionRow}>
          <AppButton
            title={isEdit ? 'Save Changes' : 'Set Reminder'}
            onPress={handleSave}
            loading={isSubmitting}
            disabled={!title.trim()}
            style={{ flex: 1 }}
          />

          {isEdit && (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={confirmDelete}
              disabled={isDeleting}
              style={[
                styles.deleteBtn,
                { backgroundColor: `${theme.danger}18`, borderColor: `${theme.danger}40` },
              ]}
            >
              <Trash2 size={16} color={theme.danger} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    paddingVertical: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  inlineRow: {
    flexDirection: 'row',
  },
  offsetScroll: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  offsetPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  offsetText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  priorityPill: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  toggleTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  toggleSub: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  deleteBtn: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
