import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Goal, GoalStatus } from '../../types/models';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { useThemeStore } from '../../store/useThemeStore';
import { BottomSheet } from './BottomSheet';
import { Input } from './Input';
import { AppButton } from './AppButton';
import { radii, spacing, typography } from '../../constants/theme';
import { GoalCategory, GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from '../../features/goals/goalTypes';
import { getLocalDateString } from '../../features/tasks/taskUtils';

export interface GoalEditModalProps {
  goal: Goal | null; // If null -> Create mode
  visible: boolean;
  onClose: () => void;
}

const STATUSES: { label: string; value: GoalStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Paused', value: 'paused' },
];

export const GoalEditModal: React.FC<GoalEditModalProps> = ({
  goal,
  visible,
  onClose,
}) => {
  const { addGoal, updateGoal } = useLifeOsStore();
  const { user, isDemoMode } = useAuthStore();
  const { showToast } = useToastStore();
  const { theme } = useThemeStore();

  const isEdit = Boolean(goal);
  const userId = user?.id || (isDemoMode ? 'demo-user-001' : 'guest-user');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Fitness');
  const [targetValue, setTargetValue] = useState('100');
  const [currentValue, setCurrentValue] = useState('0');
  const [unit, setUnit] = useState('km');
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<GoalStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setCategory((goal.category as GoalCategory) || 'Fitness');
      setTargetValue(String(goal.targetValue || 100));
      setCurrentValue(String(goal.currentValue || 0));
      setUnit(goal.unit || '%');
      setStartDate(goal.startDate || getLocalDateString());
      setTargetDate(goal.targetDate || goal.deadline || '');
      setStatus(goal.status || 'active');
    } else {
      setTitle('');
      setDescription('');
      setCategory('Fitness');
      setTargetValue('100');
      setCurrentValue('0');
      setUnit('km');
      setStartDate(getLocalDateString());
      setTargetDate('');
      setStatus('active');
    }
  }, [goal, visible]);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast({
        title: 'Title Required',
        message: 'Please provide a title for your goal.',
        type: 'warning',
      });
      return;
    }

    const targetNum = parseFloat(targetValue);
    if (isNaN(targetNum) || targetNum <= 0) {
      showToast({
        title: 'Invalid Target',
        message: 'Target value must be a positive number.',
        type: 'warning',
      });
      return;
    }

    const currentNum = parseFloat(currentValue) || 0;

    if (startDate && targetDate && targetDate < startDate) {
      showToast({
        title: 'Invalid Target Date',
        message: 'Target date cannot be earlier than start date.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEdit && goal) {
        const res = await updateGoal(goal.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          targetValue: targetNum,
          currentValue: currentNum,
          unit: unit.trim() || '%',
          startDate: startDate.trim() || undefined,
          targetDate: targetDate.trim() || undefined,
          status,
        });

        if (res.success) {
          showToast({
            title: 'Goal Updated',
            message: `Saved changes to "${title.trim()}".`,
            type: 'success',
          });
          onClose();
        } else {
          showToast({
            title: 'Update Failed',
            message: res.error || 'Could not update goal.',
            type: 'error',
          });
        }
      } else {
        const res = await addGoal(userId, {
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          targetValue: targetNum,
          currentValue: currentNum,
          unit: unit.trim() || '%',
          startDate: startDate.trim() || undefined,
          targetDate: targetDate.trim() || undefined,
          status,
        });

        if (res.success) {
          showToast({
            title: 'Goal Created',
            message: `Objective "${title.trim()}" is now active.`,
            type: 'success',
          });
          onClose();
        } else {
          showToast({
            title: 'Creation Failed',
            message: res.error || 'Could not create goal.',
            type: 'error',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isEdit ? 'Edit Goal' : 'New Goal'}
      subtitle={isEdit ? 'Update objective and targets' : 'Set a long-term milestone'}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.formContainer}>
        <Input
          label="Goal Title"
          placeholder="e.g. Run 100 km"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Description (Optional)"
          placeholder="e.g. Build aerobic base for half marathon"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={2}
        />

        {/* Category Selector */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
          CATEGORY
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {GOAL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              activeOpacity={0.75}
              onPress={() => setCategory(cat)}
              style={[
                styles.catPill,
                {
                  backgroundColor: category === cat ? GOAL_CATEGORY_COLORS[cat] : theme.surfaceElevated,
                  borderColor: category === cat ? GOAL_CATEGORY_COLORS[cat] : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.catText,
                  { color: category === cat ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Target Value, Current Value & Unit */}
        <View style={styles.inlineRow}>
          <View style={{ flex: 1, marginRight: spacing.xs }}>
            <Input
              label="Target Value"
              placeholder="100"
              keyboardType="numeric"
              value={targetValue}
              onChangeText={setTargetValue}
            />
          </View>
          <View style={{ flex: 1, marginRight: spacing.xs }}>
            <Input
              label="Current Value"
              placeholder="0"
              keyboardType="numeric"
              value={currentValue}
              onChangeText={setCurrentValue}
            />
          </View>
          <View style={{ width: 80 }}>
            <Input
              label="Unit"
              placeholder="km"
              value={unit}
              onChangeText={setUnit}
            />
          </View>
        </View>

        {/* Start Date & Target Date */}
        <View style={styles.inlineRow}>
          <View style={{ flex: 1, marginRight: spacing.xs }}>
            <Input
              label="Start Date"
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Target Deadline"
              placeholder="YYYY-MM-DD"
              value={targetDate}
              onChangeText={setTargetDate}
            />
          </View>
        </View>

        {/* Status Pills (if Edit mode) */}
        {isEdit && (
          <>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              STATUS
            </Text>
            <View style={styles.statusRow}>
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  activeOpacity={0.75}
                  onPress={() => setStatus(s.value)}
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: status === s.value ? theme.primary : theme.surfaceElevated,
                      borderColor: status === s.value ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: status === s.value ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <AppButton
          title={isEdit ? 'Save Changes' : 'Create Goal'}
          onPress={handleSave}
          loading={isSubmitting}
          disabled={!title.trim()}
          fullWidth
          style={styles.submitBtn}
        />
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
  catScroll: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  catPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  catText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
  },
  inlineRow: {
    flexDirection: 'row',
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  statusPill: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  submitBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});
