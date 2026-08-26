import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Task, Priority } from '../../types/models';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { useToastStore } from '../../store/useToastStore';
import { useThemeStore } from '../../store/useThemeStore';
import { BottomSheet } from './BottomSheet';
import { Input } from './Input';
import { AppButton } from './AppButton';
import { radii, spacing, typography } from '../../constants/theme';
import { TaskCategory } from '../../features/tasks/taskTypes';

export interface TaskEditModalProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: TaskCategory[] = ['Work', 'Study', 'Personal', 'Fitness', 'Health', 'Other'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  visible,
  onClose,
}) => {
  const { goals, updateTask, deleteTask } = useLifeOsStore();
  const { showToast } = useToastStore();
  const { theme } = useThemeStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<string>('Work');
  const [goalId, setGoalId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('30');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setCategory(task.category || 'Work');
      setGoalId(task.goalId || undefined);
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
      setEstimatedMinutes(String(task.estimatedMinutes || 30));
    }
  }, [task, visible]);

  if (!task) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      showToast({
        title: 'Title Required',
        message: 'Please provide a task title.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSaving(true);
      const res = await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category,
        goalId: goalId || undefined,
        dueDate: dueDate.trim() || undefined,
        dueTime: dueTime.trim() || undefined,
        estimatedMinutes: parseInt(estimatedMinutes, 10) || 30,
      });

      if (res.success) {
        showToast({
          title: 'Task Updated',
          message: `Saved changes to "${title.trim()}".`,
          type: 'success',
        });
        onClose();
      } else {
        showToast({
          title: 'Update Failed',
          message: res.error || 'Could not update task.',
          type: 'error',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete task "${task.title}"?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Task',
        `Are you sure you want to permanently delete "${task.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const performDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteTask(task.id);
      if (res.success) {
        showToast({
          title: 'Task Deleted',
          message: 'Task removed from your schedule.',
          type: 'info',
        });
        onClose();
      } else {
        showToast({
          title: 'Deletion Failed',
          message: res.error || 'Could not delete task.',
          type: 'error',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit Task"
      subtitle="Modify task details and schedule"
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.formContainer}>
        <Input
          label="Task Title"
          placeholder="e.g. Optimize Database Indexes"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Description (Optional)"
          placeholder="e.g. Add indexes on user_id and due_date"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={2}
        />

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

        {/* Category Selector */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
          CATEGORY
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              activeOpacity={0.75}
              onPress={() => setCategory(cat)}
              style={[
                styles.catPill,
                {
                  backgroundColor: category === cat ? theme.primary : theme.surfaceElevated,
                  borderColor: category === cat ? theme.primary : theme.border,
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

        {/* Linked Goal Selector if any goals exist */}
        {goals.length > 0 && (
          <>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              LINKED OBJECTIVE / GOAL
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setGoalId(undefined)}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: !goalId ? theme.primary : theme.surfaceElevated,
                    borderColor: !goalId ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.catText,
                    { color: !goalId ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  None
                </Text>
              </TouchableOpacity>
              {goals.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  activeOpacity={0.75}
                  onPress={() => setGoalId(g.id)}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: goalId === g.id ? theme.primary : theme.surfaceElevated,
                      borderColor: goalId === g.id ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catText,
                      { color: goalId === g.id ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {g.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Date, Time & Estimated Min */}
        <View style={styles.inlineRow}>
          <View style={{ flex: 1, marginRight: spacing.xs }}>
            <Input
              label="Due Date"
              placeholder="YYYY-MM-DD"
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>
          <View style={{ width: 100, marginRight: spacing.xs }}>
            <Input
              label="Due Time"
              placeholder="HH:mm"
              value={dueTime}
              onChangeText={setDueTime}
            />
          </View>
          <View style={{ width: 90 }}>
            <Input
              label="Est. Min"
              placeholder="30"
              keyboardType="numeric"
              value={estimatedMinutes}
              onChangeText={setEstimatedMinutes}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <AppButton
            title="Save Changes"
            onPress={handleSave}
            loading={isSaving}
            style={{ flex: 1 }}
          />

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
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
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
