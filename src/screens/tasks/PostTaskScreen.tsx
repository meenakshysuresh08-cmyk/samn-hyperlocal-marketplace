import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTaskStore } from '../../services/taskStore';
import { useAuthStore } from '../../services/authStore';
import { colors, fontSizes, fontWeights, spacing } from '../../theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../../components/AppIcon';
import { ManualLocationModal } from '../../components/ManualLocationModal';
import { InteractiveLocationPickerModal } from '../../components/InteractiveLocationPickerModal';
import { TaskDateTimePickerModal } from '../../components/TaskDateTimePickerModal';

const categories = [
  { id: 'care_taking', label: '🤝 Care Takers / Elderly' },
  { id: 'hospital_accompany', label: '🏥 Hospital Escort' },
  { id: 'pet_care', label: '🐾 Pet Care & Walking' },
  { id: 'pet_grooming', label: '✂️ Pet Grooming & Spa' },
  { id: 'car_wash', label: '🚗 Car Wash & Detailing' },
  { id: 'gardening', label: '🌱 Gardening & Lawn' },
  { id: 'grocery', label: '🛍️ Grocery & Essentials' },
  { id: 'delivery', label: '🚚 Delivery & Courier' },
  { id: 'tech_help', label: '💻 Tech Support' },
  { id: 'cleaning', label: '✨ Deep Cleaning' },
  { id: 'repair', label: '🔧 Home Repairs' },
  { id: 'moving', label: '📦 Heavy Lifting & Moving' },
  { id: 'other', label: '⚡ General Assistance' },
];

export default function PostTaskScreen({ navigation }: any) {
  const { createTask, isLoading } = useTaskStore();
  const { user, switchRole } = useAuthStore();
  const isCustomer = user?.activeRole === 'customer';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('care_taking');
  const [forSelf, setForSelf] = useState(true);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [address, setAddress] = useState(user?.location?.address || 'Koramangala, Bengaluru, India');
  const [coords, setCoords] = useState<[number, number]>(user?.location?.coordinates || [77.6271, 12.9352]);
  const [landmark, setLandmark] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('400');
  const [isUrgent, setIsUrgent] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showInteractiveMapModal, setShowInteractiveMapModal] = useState(false);

  // Date & Time Scheduling State
  const [scheduleType, setScheduleType] = useState<
    'asap' | 'today_evening' | 'tomorrow_morning' | 'tomorrow_evening' | 'custom'
  >('asap');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledText, setScheduledText] = useState('⚡ ASAP / Immediate');
  const [showDateTimePickerModal, setShowDateTimePickerModal] = useState(false);

  // Strict Role Guard: Only Customers can upload tasks
  if (!isCustomer) {
    return (
      <View style={styles.helperBlockedContainer}>
        <View style={styles.helperBlockedCard}>
          <Text style={styles.helperBlockedIcon}>🛑</Text>
          <Text style={styles.helperBlockedTitle}>Customer Feature Only</Text>
          <Text style={styles.helperBlockedDesc}>
            You are currently in <Text style={styles.boldText}>Helper Mode</Text>. Only Customers can upload and broadcast new task requests.
          </Text>
          <Text style={styles.helperBlockedSub}>
            As a Helper, you earn money by exploring nearby requests on the Live Radar map.
          </Text>

          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={async () => {
              await switchRole('customer');
            }}
          >
            <Text style={styles.switchRoleBtnText}>Switch to Customer Mode 🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.goToRadarBtn}
            onPress={() => navigation.navigate('Explore')}
          >
            <Text style={styles.goToRadarBtnText}>Go to Live Radar Map ➔</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSelectSchedulePreset = (
    type: 'asap' | 'today_evening' | 'tomorrow_morning' | 'tomorrow_evening'
  ) => {
    setScheduleType(type);
    const now = new Date();

    if (type === 'asap') {
      setScheduledDate(null);
      setScheduledText('⚡ ASAP / Immediate');
    } else if (type === 'today_evening') {
      const d = new Date();
      d.setHours(18, 0, 0, 0);
      setScheduledDate(d);
      setScheduledText('📅 Today Evening (6:00 PM)');
    } else if (type === 'tomorrow_morning') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      setScheduledDate(d);
      setScheduledText('📅 Tomorrow Morning (9:00 AM)');
    } else if (type === 'tomorrow_evening') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
      setScheduledDate(d);
      setScheduledText('📅 Tomorrow Evening (6:00 PM)');
    }
  };

  const handleCustomDateTimeConfirm = (date: Date, formatted: string) => {
    setScheduleType('custom');
    setScheduledDate(date);
    setScheduledText(`📅 ${formatted}`);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !budgetAmount || !address.trim()) {
      Alert.alert('Required Fields', 'Please fill in the task title, description, address, and budget amount.');
      return;
    }

    if (!forSelf && !recipientName.trim()) {
      Alert.alert('Recipient Required', 'Please enter the name of the person you are requesting help for.');
      return;
    }

    const payload = {
      title,
      description,
      category,
      forSelf,
      recipientName: forSelf ? '' : recipientName,
      recipientPhone: forSelf ? '' : recipientPhone,
      address,
      landmark,
      coordinates: coords,
      budgetAmount: Number(budgetAmount),
      budgetType: 'fixed',
      isUrgent,
      searchRadius: 15000,
      scheduledDate: scheduledDate ? scheduledDate.toISOString() : null,
      scheduledText,
    };

    const res = await createTask(payload);
    if (res.success) {
      Alert.alert('Success 🎉', 'Your task has been broadcasted to nearby helpers with your specified schedule and secure completion passcode generated!', [
        {
          text: 'View Task',
          onPress: () => navigation.navigate('TaskDetail', { taskId: res.task._id }),
        },
      ]);
    } else {
      Alert.alert('Error', res.message || 'Failed to post task');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.headerTitle}>Post a New Task</Text>
        <Text style={styles.headerSubtitle}>
          Broadcast your request to nearby verified helpers in real time
        </Text>

        {/* Recipient Toggle */}
        <Text style={styles.inputLabel}>Who needs this help? *</Text>
        <View style={styles.recipientToggleRow}>
          <TouchableOpacity
            style={[styles.recipientToggleBtn, forSelf && styles.recipientToggleBtnActive]}
            onPress={() => setForSelf(true)}
          >
            <Text style={[styles.recipientToggleText, forSelf && styles.recipientToggleTextActive]}>
              👤 For Myself
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.recipientToggleBtn, !forSelf && styles.recipientToggleBtnActiveIndigo]}
            onPress={() => setForSelf(false)}
          >
            <Text style={[styles.recipientToggleText, !forSelf && styles.recipientToggleTextActive]}>
              👥 For Someone Else
            </Text>
          </TouchableOpacity>
        </View>

        {/* Someone Else info */}
        {!forSelf && (
          <View style={styles.recipientInfoBox}>
            <Text style={styles.inputLabelSub}>Person Name / Relationship *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. My Mom, Grandma Mary, Friend"
              placeholderTextColor={colors.textTertiary}
              value={recipientName}
              onChangeText={setRecipientName}
            />
            <Text style={styles.inputLabelSub}>Recipient Phone (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={colors.textTertiary}
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              keyboardType="phone-pad"
            />
          </View>
        )}

        <Text style={styles.inputLabel}>Task Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Accompany elderly parent to hospital"
          placeholderTextColor={colors.textTertiary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.inputLabel}>Category *</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.categoryBtn, category === c.id && styles.categoryBtnActive]}
              onPress={() => setCategory(c.id)}
            >
              <Text style={[styles.categoryBtnText, category === c.id && styles.categoryBtnTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Description & Instructions *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Explain what needs to be done, timing, and any specific requirements..."
          placeholderTextColor={colors.textTertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        {/* Location Section with Interactive OSM Map Picker & Autocomplete Search */}
        <View style={styles.locationHeaderRow}>
          <Text style={styles.inputLabel}>
            {forSelf ? 'Task Location Address *' : "Recipient's Task Location Address *"}
          </Text>
          <View style={styles.locActionButtonsRow}>
            <TouchableOpacity
              style={styles.mapPickerBtn}
              onPress={() => setShowInteractiveMapModal(true)}
            >
              <Text style={styles.mapPickerBtnText}>🗺️ Map Pin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changeLocBtn}
              onPress={() => setShowLocationModal(true)}
            >
              <AppIcon name="search" width={11} height={11} color={colors.brandPrimary} />
              <Text style={styles.changeLocBtnText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addressCardPressable}
          onPress={() => setShowInteractiveMapModal(true)}
        >
          <View style={styles.addressCardLeft}>
            <AppIcon name="map-pin" width={18} height={18} color={colors.brandPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addressMainText} numberOfLines={2}>
                {address || 'Tap to select location on map...'}
              </Text>
              <Text style={styles.coordsSubText}>
                📍 Coordinates: {coords[1].toFixed(4)}° N, {coords[0].toFixed(4)}° E • Tap to adjust pin
              </Text>
            </View>
          </View>
          <View style={styles.mapPinActionBadge}>
            <Text style={styles.mapPinActionBadgeText}>Edit ➔</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.inputLabel}>
          Key Landmark Directions {forSelf ? '(Optional)' : '(Recommended)'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Opposite Apollo Pharmacy, Gate #2"
          placeholderTextColor={colors.textTertiary}
          value={landmark}
          onChangeText={setLandmark}
        />

        {/* Date & Time Scheduling Section */}
        <View style={styles.scheduleHeaderRow}>
          <Text style={styles.inputLabel}>When should this task be completed? *</Text>
          <TouchableOpacity
            style={styles.changeLocBtn}
            onPress={() => setShowDateTimePickerModal(true)}
          >
            <AppIcon name="calendar" width={12} height={12} color={colors.brandPrimary} />
            <Text style={styles.changeLocBtnText}>Custom Calendar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleChipsGrid}>
          <TouchableOpacity
            style={[styles.scheduleChip, scheduleType === 'asap' && styles.scheduleChipActive]}
            onPress={() => handleSelectSchedulePreset('asap')}
          >
            <Text style={[styles.scheduleChipText, scheduleType === 'asap' && styles.scheduleChipTextActive]}>
              ⚡ ASAP / Immediate
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scheduleChip, scheduleType === 'today_evening' && styles.scheduleChipActive]}
            onPress={() => handleSelectSchedulePreset('today_evening')}
          >
            <Text style={[styles.scheduleChipText, scheduleType === 'today_evening' && styles.scheduleChipTextActive]}>
              🌇 Today Evening (6 PM)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scheduleChip, scheduleType === 'tomorrow_morning' && styles.scheduleChipActive]}
            onPress={() => handleSelectSchedulePreset('tomorrow_morning')}
          >
            <Text style={[styles.scheduleChipText, scheduleType === 'tomorrow_morning' && styles.scheduleChipTextActive]}>
              🌅 Tomorrow (9 AM)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scheduleChip, scheduleType === 'tomorrow_evening' && styles.scheduleChipActive]}
            onPress={() => handleSelectSchedulePreset('tomorrow_evening')}
          >
            <Text style={[styles.scheduleChipText, scheduleType === 'tomorrow_evening' && styles.scheduleChipTextActive]}>
              🌆 Tomorrow (6 PM)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scheduleChip, scheduleType === 'custom' && styles.scheduleChipActiveIndigo]}
            onPress={() => setShowDateTimePickerModal(true)}
          >
            <Text style={[styles.scheduleChipText, scheduleType === 'custom' && styles.scheduleChipTextActive]}>
              🗓️ Pick Specific Date & Time...
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Schedule Banner */}
        <View style={styles.selectedScheduleBanner}>
          <AppIcon name="clock" width={14} height={14} color={colors.brandPrimary} />
          <Text style={styles.selectedScheduleText}>
            Target: <Text style={styles.selectedScheduleBold}>{scheduledText}</Text>
          </Text>
          {scheduleType === 'custom' && (
            <TouchableOpacity onPress={() => setShowDateTimePickerModal(true)}>
              <Text style={styles.editScheduleLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Offered Budget */}
        <Text style={styles.inputLabel}>Offered Reward Budget (INR ₹) *</Text>
        <TextInput
          style={[styles.input, styles.budgetInput]}
          placeholder="400"
          placeholderTextColor={colors.textTertiary}
          value={budgetAmount}
          onChangeText={setBudgetAmount}
          keyboardType="numeric"
        />

        {/* Urgent Toggle */}
        <View style={styles.urgentRow}>
          <View style={styles.urgentTextWrapper}>
            <Text style={styles.urgentTitle}>🔥 Urgent Priority</Text>
            <Text style={styles.urgentSub}>
              Pushes high-priority alerts to nearby helpers in range
            </Text>
          </View>
          <Switch
            value={isUrgent}
            onValueChange={setIsUrgent}
            trackColor={{ false: colors.bgElevated, true: '#ef4444' }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.brandPrimary, colors.accentIndigo]}
            style={styles.gradientBtn}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Broadcast Task Live</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Full-Screen Interactive OSM / Leaflet Map Picker Modal */}
        <InteractiveLocationPickerModal
          visible={showInteractiveMapModal}
          onClose={() => setShowInteractiveMapModal(false)}
          initialCoords={coords}
          initialAddress={address}
          onConfirmLocation={(newCoords, newAddress, newLandmark) => {
            setCoords(newCoords);
            setAddress(newAddress);
            if (newLandmark) {
              setLandmark(newLandmark);
            }
          }}
        />

        {/* Enhanced Manual Location Search Modal */}
        <ManualLocationModal
          visible={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onSelectLocation={(newCoords, newAddress) => {
            setCoords(newCoords);
            setAddress(newAddress);
          }}
        />

        {/* Date & Time Picker Modal */}
        <TaskDateTimePickerModal
          visible={showDateTimePickerModal}
          onClose={() => setShowDateTimePickerModal(false)}
          onConfirm={handleCustomDateTimeConfirm}
          initialDate={scheduledDate || undefined}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  headerTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  recipientToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  recipientToggleBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  recipientToggleBtnActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  recipientToggleBtnActiveIndigo: {
    backgroundColor: colors.accentIndigo,
    borderColor: colors.accentIndigo,
  },
  recipientToggleText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
  },
  recipientToggleTextActive: {
    color: '#fff',
  },
  recipientInfoBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginTop: spacing.xs,
  },
  inputLabelSub: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  changeLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  changeLocBtnText: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  inputLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    fontSize: fontSizes.sm,
  },
  locActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mapPickerBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  mapPickerBtnText: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  addressCardPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    marginBottom: spacing.xs,
  },
  addressCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  addressMainText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  coordsSubText: {
    color: colors.brandPrimary,
    fontSize: 10,
    marginTop: 3,
    fontWeight: fontWeights.medium,
  },
  mapPinActionBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginLeft: spacing.xs,
  },
  mapPinActionBadgeText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  addressInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  addressInputText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.md,
  },
  searchIconBtn: {
    padding: spacing.xs,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  budgetInput: {
    color: '#10b981',
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.black,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryBtn: {
    backgroundColor: colors.bgCard,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  categoryBtnActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  categoryBtnText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  categoryBtnTextActive: {
    color: '#fff',
  },
  scheduleChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  scheduleChip: {
    backgroundColor: colors.bgCard,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  scheduleChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  scheduleChipActiveIndigo: {
    backgroundColor: colors.accentIndigo,
    borderColor: colors.accentIndigo,
  },
  scheduleChipText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  scheduleChipTextActive: {
    color: '#fff',
    fontWeight: fontWeights.bold,
  },
  selectedScheduleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  selectedScheduleText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
  selectedScheduleBold: {
    color: colors.brandPrimary,
    fontWeight: fontWeights.bold,
  },
  editScheduleLink: {
    color: colors.brandPrimary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  urgentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    borderRadius: 16,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  urgentTextWrapper: {
    flex: 1,
  },
  urgentTitle: {
    color: '#ef4444',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  urgentSub: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  submitBtn: {
    marginTop: spacing.xl,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
  helperBlockedContainer: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  helperBlockedCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    maxWidth: 400,
  },
  helperBlockedIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  helperBlockedTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.black,
    marginBottom: spacing.sm,
  },
  helperBlockedDesc: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  boldText: {
    color: colors.brandPrimary,
    fontWeight: fontWeights.bold,
  },
  helperBlockedSub: {
    color: colors.textTertiary,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  switchRoleBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  switchRoleBtnText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  goToRadarBtn: {
    backgroundColor: colors.bgElevated,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  goToRadarBtnText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
});
