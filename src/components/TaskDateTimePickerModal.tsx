import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors, fontSizes, fontWeights, spacing } from '../theme/tokens';
import { AppIcon } from './AppIcon';

interface TaskDateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date, formattedString: string) => void;
  initialDate?: Date;
}

export const TaskDateTimePickerModal: React.FC<TaskDateTimePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialDate,
}) => {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  // Generate the next 14 days
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dateNum = d.getDate();
    return {
      date: d,
      dayName,
      monthName,
      dateNum,
      fullDateStr: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  });

  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutes = ['00', '15', '30', '45'];

  const getResolvedDate = (): { date: Date; formatted: string } => {
    const baseDate = new Date(dateOptions[selectedDateIndex].date);
    let hour24 = selectedHour;
    if (selectedPeriod === 'PM' && hour24 < 12) hour24 += 12;
    if (selectedPeriod === 'AM' && hour24 === 12) hour24 = 0;

    baseDate.setHours(hour24, parseInt(selectedMinute, 10), 0, 0);

    const formatted = `${dateOptions[selectedDateIndex].fullDateStr} at ${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    return { date: baseDate, formatted };
  };

  const handleApply = () => {
    const { date, formatted } = getResolvedDate();
    onConfirm(date, formatted);
    onClose();
  };

  const currentPreview = getResolvedDate().formatted;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconCircle}>
                <AppIcon name="calendar" width={18} height={18} color="#fff" />
              </View>
              <View>
                <Text style={styles.title}>Select Task Schedule</Text>
                <Text style={styles.subtitle}>Specify when the helper should complete this task</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bodyContent}>
            {/* Horizontal Date Picker */}
            <Text style={styles.sectionLabel}>Select Date</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScrollContainer}
            >
              {dateOptions.map((item, idx) => {
                const isSelected = selectedDateIndex === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.datePill, isSelected && styles.datePillSelected]}
                    onPress={() => setSelectedDateIndex(idx)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                      {item.dayName}
                    </Text>
                    <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>
                      {item.dateNum}
                    </Text>
                    <Text style={[styles.monthName, isSelected && styles.monthNameSelected]}>
                      {item.monthName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Picker */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Select Preferred Time</Text>
            
            <View style={styles.timePickerContainer}>
              {/* Hour Grid */}
              <Text style={styles.subLabel}>Hour</Text>
              <View style={styles.hourGrid}>
                {hours.map((h) => {
                  const isSelected = selectedHour === h;
                  return (
                    <TouchableOpacity
                      key={h}
                      style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                      onPress={() => setSelectedHour(h)}
                    >
                      <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                        {h}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Minute & Period Row */}
              <View style={styles.minutePeriodRow}>
                <View style={styles.minuteCol}>
                  <Text style={styles.subLabel}>Minute</Text>
                  <View style={styles.minuteRow}>
                    {minutes.map((m) => {
                      const isSelected = selectedMinute === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[styles.minuteChip, isSelected && styles.timeChipSelected]}
                          onPress={() => setSelectedMinute(m)}
                        >
                          <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                            :{m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.periodCol}>
                  <Text style={styles.subLabel}>AM / PM</Text>
                  <View style={styles.periodRow}>
                    {(['AM', 'PM'] as const).map((p) => {
                      const isSelected = selectedPeriod === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[styles.periodChip, isSelected && styles.periodChipSelected]}
                          onPress={() => setSelectedPeriod(p)}
                        >
                          <Text style={[styles.periodChipText, isSelected && styles.periodChipTextSelected]}>
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* Live Preview Box */}
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Scheduled Target:</Text>
              <Text style={styles.previewText}>📅 {currentPreview}</Text>
            </View>

            {/* Confirm & Cancel Buttons */}
            <TouchableOpacity style={styles.confirmBtn} onPress={handleApply}>
              <Text style={styles.confirmBtnText}>Save Task Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 22, 0.85)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  bodyContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.xs,
  },
  dateScrollContainer: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  datePill: {
    width: 72,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  datePillSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  dayName: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: fontWeights.semibold,
  },
  dayNameSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dateNum: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.black,
    marginVertical: 2,
  },
  dateNumSelected: {
    color: '#fff',
  },
  monthName: {
    color: colors.textTertiary,
    fontSize: 10,
  },
  monthNameSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timePickerContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  timeChip: {
    width: '14.5%',
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  timeChipSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  timeChipText: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  timeChipTextSelected: {
    color: '#fff',
  },
  minutePeriodRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  minuteCol: {
    flex: 3,
  },
  minuteRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  minuteChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  periodCol: {
    flex: 2,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  periodChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  periodChipSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  periodChipText: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  periodChipTextSelected: {
    color: '#fff',
  },
  previewBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  previewLabel: {
    color: colors.textTertiary,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: fontWeights.bold,
  },
  previewText: {
    color: colors.brandPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  cancelBtnText: {
    color: colors.textTertiary,
    fontSize: fontSizes.xs,
  },
});
