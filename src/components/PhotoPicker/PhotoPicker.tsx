import React, { memo } from 'react';
import { Modal, Platform, Pressable, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeStore } from '../../theme/useThemeStore';
import { AppIcon } from '../AppIcon';
import { AppText } from '../AppText';
import { createPhotoPickerStyles } from './styles';

export type PhotoPickerSheetProps = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
};

const PhotoPickerSheetInner: React.FC<PhotoPickerSheetProps> = ({
  visible,
  title = 'Add Photo',
  subtitle = 'Choose how you want to add a photo.',
  onClose,
  onSelectCamera,
  onSelectGallery,
}) => {
  const theme = useThemeStore(state => state.theme);
  const isDark = useThemeStore(state => state.colorScheme) === 'dark';
  const styles = createPhotoPickerStyles(theme, isDark);
  const accent = theme.primary;
  const insets = useSafeAreaInsets();
  const bottomGap = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 12);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss photo picker"
      >
        <Pressable onPress={() => undefined} accessible={false} style={styles.sheetWrapper}>
          <View style={[styles.sheet, { paddingBottom: bottomGap }]}>
            <View style={styles.grabber} />

            <AppText style={styles.title} allowFontScaling={false}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText style={styles.subtitle} allowFontScaling={false}>
                {subtitle}
              </AppText>
            ) : null}

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.option}
                onPress={onSelectCamera}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Take Photo"
              >
                <View style={styles.optionIconWrap}>
                  <AppIcon name="camera" color={accent} width={22} height={22} />
                </View>
                <AppText style={styles.optionLabel} allowFontScaling={false}>
                  Take Photo
                </AppText>
                <AppText style={styles.optionHint} allowFontScaling={false}>
                  Use camera
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={onSelectGallery}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Choose from Gallery"
              >
                <View style={styles.optionIconWrap}>
                  <AppIcon name="image" color={accent} width={22} height={22} />
                </View>
                <AppText style={styles.optionLabel} allowFontScaling={false}>
                  From Gallery
                </AppText>
                <AppText style={styles.optionHint} allowFontScaling={false}>
                  Pick existing photo
                </AppText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <AppText style={styles.cancelText} allowFontScaling={false}>
                Cancel
              </AppText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export const PhotoPickerSheet = memo(PhotoPickerSheetInner);
