import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Trash2, Clock, MapPin, Calendar, AlertTriangle } from 'lucide-react-native';
import { EventItem } from '../../types/models';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { useToastStore } from '../../store/useToastStore';
import { useThemeStore } from '../../store/useThemeStore';
import { BottomSheet } from './BottomSheet';
import { Input } from './Input';
import { AppButton } from './AppButton';
import { radii, spacing, typography } from '../../constants/theme';
import { EventCategory, EVENT_CATEGORIES, EVENT_CATEGORY_COLORS } from '../../features/events/eventTypes';
import { getLocalDateString } from '../../features/tasks/taskUtils';

export interface EventEditModalProps {
  event: EventItem | null;
  visible: boolean;
  onClose: () => void;
}

export const EventEditModal: React.FC<EventEditModalProps> = ({
  event,
  visible,
  onClose,
}) => {
  const { updateEvent, deleteEvent } = useLifeOsStore();
  const { showToast } = useToastStore();
  const { theme } = useThemeStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Work');
  const [dateStr, setDateStr] = useState(getLocalDateString());
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('18:00');
  const [location, setLocation] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setCategory((event.category as EventCategory) || 'Work');
      setLocation(event.location || '');
      setIsAllDay(Boolean(event.isAllDay));

      try {
        const d = new Date(event.startTime);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setDateStr(`${year}-${month}-${day}`);

        const startH = String(d.getHours()).padStart(2, '0');
        const startM = String(d.getMinutes()).padStart(2, '0');
        setStartTime(`${startH}:${startM}`);

        const dEnd = new Date(event.endTime);
        const endH = String(dEnd.getHours()).padStart(2, '0');
        const endM = String(dEnd.getMinutes()).padStart(2, '0');
        setEndTime(`${endH}:${endM}`);
      } catch {
        setDateStr(getLocalDateString());
        setStartTime('17:00');
        setEndTime('18:00');
      }
    }
  }, [event, visible]);

  if (!event) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      showToast({
        title: 'Title Required',
        message: 'Please provide an event title.',
        type: 'warning',
      });
      return;
    }

    if (startTime >= endTime && !isAllDay) {
      showToast({
        title: 'Invalid Time Range',
        message: 'End time must be after start time.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSaving(true);
      const startIso = isAllDay
        ? `${dateStr}T00:00:00.000Z`
        : `${dateStr}T${startTime}:00.000Z`;
      const endIso = isAllDay
        ? `${dateStr}T23:59:59.999Z`
        : `${dateStr}T${endTime}:00.000Z`;

      const res = await updateEvent(event.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        startTime: startIso,
        endTime: endIso,
        isAllDay,
        location: location.trim() || undefined,
        color: EVENT_CATEGORY_COLORS[category] || '#4F8CFF',
      });

      if (res.success) {
        showToast({
          title: 'Event Updated',
          message: `Saved changes to "${title.trim()}".`,
          type: 'success',
        });
        onClose();
      } else {
        showToast({
          title: 'Update Failed',
          message: res.error || 'Could not update event.',
          type: 'error',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete event "${event.title}"?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Event',
        `Are you sure you want to delete "${event.title}"?`,
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
      const res = await deleteEvent(event.id);
      if (res.success) {
        showToast({
          title: 'Event Deleted',
          message: 'Event removed from your calendar.',
          type: 'info',
        });
        onClose();
      } else {
        showToast({
          title: 'Deletion Failed',
          message: res.error || 'Could not delete event.',
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
      title="Edit Event"
      subtitle="Reschedule or update calendar block"
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.formContainer}>
        <Input
          label="Event Title"
          placeholder="e.g. Weekly Strategy Sync"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Description (Optional)"
          placeholder="e.g. Q3 roadmap and feature priorities"
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
          {EVENT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              activeOpacity={0.75}
              onPress={() => setCategory(cat)}
              style={[
                styles.catPill,
                {
                  backgroundColor: category === cat ? EVENT_CATEGORY_COLORS[cat] : theme.surfaceElevated,
                  borderColor: category === cat ? EVENT_CATEGORY_COLORS[cat] : theme.border,
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

        {/* Date & Time Row */}
        <View style={styles.inlineRow}>
          <View style={{ flex: 1.2, marginRight: spacing.xs }}>
            <Input
              label="Date"
              placeholder="YYYY-MM-DD"
              value={dateStr}
              onChangeText={setDateStr}
            />
          </View>
          <View style={{ flex: 1, marginRight: spacing.xs }}>
            <Input
              label="Start Time"
              placeholder="17:00"
              value={startTime}
              onChangeText={setStartTime}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="End Time"
              placeholder="18:00"
              value={endTime}
              onChangeText={setEndTime}
            />
          </View>
        </View>

        <Input
          label="Location / Link"
          placeholder="e.g. Meeting Room 3 or Zoom link"
          value={location}
          onChangeText={setLocation}
          leftIcon={<MapPin size={16} color={theme.textMuted} />}
        />

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
