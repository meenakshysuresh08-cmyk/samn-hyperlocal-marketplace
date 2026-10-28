import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSizes, fontWeights } from '../theme/tokens';
import API from '../services/api';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  taskId: string;
  targetUser: {
    _id: string;
    name: string;
    avatar?: string;
    role: 'customer' | 'helper';
  };
  isCustomer: boolean;
  onSuccess: () => void;
}

const CUSTOMER_TAGS = [
  '⭐ Prompt & On Time',
  '🛠️ Quality Work',
  '🤝 Polite & Helpful',
  '✨ Clean & Careful',
  '🚀 Highly Recommended',
  '💬 Great Communication',
];

const HELPER_TAGS = [
  '📋 Clear Instructions',
  '💳 Prompt Approval',
  '🏡 Friendly Host',
  '🔒 Safe Environment',
  '💬 Responsive & Polite',
  '👍 Great to Work With',
];

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  taskId,
  targetUser,
  isCustomer,
  onSuccess,
}) => {
  const [score, setScore] = useState<number>(5);
  const [review, setReview] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const availableTags = isCustomer ? CUSTOMER_TAGS : HELPER_TAGS;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll access is needed to attach a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhoto(result.assets[0]);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not access photo library.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhoto(result.assets[0]);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  const handleSubmit = async () => {
    if (score < 1 || score > 5) {
      Alert.alert('Rating Required', 'Please select a star rating between 1 and 5.');
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('score', String(score));
      formData.append('review', review.trim());
      formData.append('tags', JSON.stringify(selectedTags));

      if (photo) {
        const uri = photo.uri;
        const filename = uri.split('/').pop() || 'review_photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('photo', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: filename,
          type,
        } as any);

        if (photo.base64) {
          formData.append('photoUrl', `data:image/jpeg;base64,${photo.base64}`);
        }
      }

      const res = await API.post('/ratings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        Alert.alert('Thank You! 🎉', 'Your review and rating have been recorded successfully.');
        onSuccess();
        onClose();
      } else {
        Alert.alert('Error', res.data.message || 'Failed to submit review');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to submit rating';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreDescription = (s: number) => {
    switch (s) {
      case 1:
        return '😞 Poor';
      case 2:
        return '😐 Fair';
      case 3:
        return '🙂 Good';
      case 4:
        return '😃 Very Good';
      case 5:
        return '🌟 Excellent & Outstanding!';
      default:
        return '';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                Rate & Review {targetUser.role === 'helper' ? 'Helper' : 'Customer'}
              </Text>
              <Text style={styles.headerSubtitle}>
                Share your experience working with {targetUser.name || 'User'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
          >
            {/* Target User Info */}
            <View style={styles.userBanner}>
              <Image
                source={{
                  uri:
                    targetUser.avatar ||
                    'https://res.cloudinary.com/demo/image/upload/v1690000000/default_avatar.png',
                }}
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{targetUser.name}</Text>
                <Text style={styles.userRoleTag}>
                  {targetUser.role === 'helper' ? '🛠️ Assigned Helper' : '👤 Task Requester'}
                </Text>
              </View>
            </View>

            {/* Interactive Star Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.sectionLabel}>Your Overall Rating</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <TouchableOpacity
                    key={starVal}
                    onPress={() => setScore(starVal)}
                    style={styles.starBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.starIcon, starVal <= score ? styles.starActive : styles.starInactive]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.scoreDesc}>{getScoreDescription(score)}</Text>
            </View>

            {/* Quick Feedback Tags */}
            <View style={styles.tagsSection}>
              <Text style={styles.sectionLabel}>What went well? (Optional)</Text>
              <View style={styles.tagsGrid}>
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                    >
                      <Text style={[styles.tagChipText, isSelected && styles.tagChipTextSelected]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Review Comment Input */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>Written Review & Feedback (Optional)</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Share your experience, punctuality, communication, or quality of work..."
                placeholderTextColor={colors.textTertiary}
                value={review}
                onChangeText={setReview}
              />
            </View>

            {/* Optional Photo Attachment (Customer completed work photo / Helper experience photo) */}
            <View style={styles.photoSection}>
              <View style={styles.photoHeaderRow}>
                <Text style={styles.sectionLabel}>
                  {isCustomer
                    ? '📸 Attach Work Photo (Optional)'
                    : '📸 Attach Experience Photo (Optional)'}
                </Text>
                <Text style={styles.optionalBadge}>Optional</Text>
              </View>
              <Text style={styles.photoHint}>
                {isCustomer
                  ? 'You can optionally attach a photo showing the completed work done by the helper.'
                  : 'You can optionally upload a photo of the completed assignment.'}
              </Text>

              {photo ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setPhoto(null)}
                  >
                    <Text style={styles.removePhotoText}>🗑️ Remove Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoButtonRow}>
                  <TouchableOpacity
                    style={styles.photoPickerBtn}
                    onPress={handlePickPhoto}
                  >
                    <Text style={styles.photoPickerBtnIcon}>🖼️</Text>
                    <Text style={styles.photoPickerBtnText}>Choose from Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoPickerBtn}
                    onPress={handleTakePhoto}
                  >
                    <Text style={styles.photoPickerBtnIcon}>📷</Text>
                    <Text style={styles.photoPickerBtnText}>Take Live Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Submit Action */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={[colors.brandPrimary, colors.accentIndigo]}
                style={styles.submitGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    Submit Review {photo ? 'with Photo 📸' : '⭐'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 22, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    fontSize: fontSizes.lg,
    color: colors.textTertiary,
    fontWeight: fontWeights.bold,
  },
  scrollBody: {
    paddingBottom: spacing['4xl'],
  },
  userBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.bgCanvas,
  },
  userInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  userRoleTag: {
    fontSize: fontSizes.xs,
    color: colors.brandPrimary,
    marginTop: 2,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  sectionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  starBtn: {
    padding: spacing.xs,
  },
  starIcon: {
    fontSize: 38,
  },
  starActive: {
    color: '#FBBF24',
  },
  starInactive: {
    color: 'rgba(255, 255, 255, 0.15)',
  },
  scoreDesc: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#FBBF24',
    marginTop: 2,
  },
  tagsSection: {
    marginBottom: spacing.lg,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tagChip: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tagChipSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: colors.brandPrimary,
  },
  tagChipText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  tagChipTextSelected: {
    color: colors.brandPrimary,
    fontWeight: fontWeights.bold,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  textArea: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    textAlignVertical: 'top',
    minHeight: 85,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: spacing.xs,
  },
  photoSection: {
    marginBottom: spacing.xl,
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionalBadge: {
    fontSize: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: colors.textSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: fontWeights.bold,
  },
  photoHint: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  photoButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoPickerBtn: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderStyle: 'dashed',
  },
  photoPickerBtnIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  photoPickerBtnText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.bgCanvas,
  },
  removePhotoBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  removePhotoText: {
    color: '#EF4444',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  submitGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.textTertiary,
    fontSize: fontSizes.xs,
  },
});
