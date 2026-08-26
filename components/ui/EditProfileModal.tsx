import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { User, AlignLeft, Navigation, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { useThemeStore } from '../../store/useThemeStore';
import { BottomSheet } from './BottomSheet';
import { Input } from './Input';
import { AppButton } from './AppButton';
import { spacing } from '../../constants/theme';

export interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
}) => {
  const { user, updateProfile } = useAuthStore();
  const { showToast } = useToastStore();
  const { theme } = useThemeStore();

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [weeklyGoalKm, setWeeklyGoalKm] = useState('25');
  const [dailyTaskGoal, setDailyTaskGoal] = useState('6');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setBio(user.bio || '');
      setWeeklyGoalKm(String(user.weeklyDistanceGoalKm || 25));
      setDailyTaskGoal(String(user.dailyTaskGoal || 6));
    }
  }, [user, visible]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      showToast({
        title: 'Name Required',
        message: 'Full name cannot be empty.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSaving(true);
      const res = await updateProfile({
        fullName: fullName.trim(),
        bio: bio.trim(),
        weeklyDistanceGoalKm: parseFloat(weeklyGoalKm) || 25,
        dailyTaskGoal: parseInt(dailyTaskGoal, 10) || 6,
      });

      if (res.success) {
        showToast({
          title: 'Profile Updated',
          message: 'Your profile changes have been synchronized.',
          type: 'success',
        });
        onClose();
      } else {
        showToast({
          title: 'Update Failed',
          message: res.error || 'Could not save profile changes.',
          type: 'error',
        });
      }
    } catch (err: any) {
      showToast({
        title: 'Update Error',
        message: err?.message || 'An unexpected error occurred.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit Profile"
      subtitle="Update your identity and performance targets"
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.formContainer}>
        <Input
          label="Full Name"
          placeholder="e.g. Alex Rivera"
          value={fullName}
          onChangeText={setFullName}
          leftIcon={<User size={16} color={theme.textMuted} />}
        />

        <Input
          label="Bio / Focus Mantra"
          placeholder="e.g. Software Engineer & Marathon Runner"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={2}
          leftIcon={<AlignLeft size={16} color={theme.textMuted} />}
        />

        <View style={styles.inlineRow}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Input
              label="Weekly Goal (km)"
              placeholder="25"
              keyboardType="numeric"
              value={weeklyGoalKm}
              onChangeText={setWeeklyGoalKm}
              leftIcon={<Navigation size={16} color={theme.textMuted} />}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Daily Tasks Goal"
              placeholder="6"
              keyboardType="numeric"
              value={dailyTaskGoal}
              onChangeText={setDailyTaskGoal}
              leftIcon={<CheckCircle2 size={16} color={theme.textMuted} />}
            />
          </View>
        </View>

        <AppButton
          title="Save Changes"
          onPress={handleSave}
          loading={isSaving}
          fullWidth
          size="lg"
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
  inlineRow: {
    flexDirection: 'row',
  },
  submitBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});
