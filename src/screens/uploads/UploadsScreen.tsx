import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton, AppText, Screen, SectionHeading, usePhotoPicker } from '../../components';
import type { Asset } from '../../components/PhotoPicker/types';
import type { RootStackParamList, UploadsStackParamList } from '../../navigation';
import { uploadFile, type UploadFilePart } from '../../services/uploadService';
import { useAppTheme } from '../../theme/useAppTheme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<UploadsStackParamList, 'Uploads'>,
  NativeStackScreenProps<RootStackParamList>
>;

const toImageFilePart = (asset: Asset): UploadFilePart | null => {
  if (!asset.uri) {
    return null;
  }

  return {
    uri: asset.uri,
    name: asset.fileName ?? 'image-upload.jpg',
    type: asset.type ?? 'image/jpeg',
  };
};

export const UploadsScreen = ({ navigation }: Props) => {
  const { theme } = useAppTheme();
  const [status, setStatus] = useState('No upload selected');
  const [isUploading, setIsUploading] = useState(false);

  const submitUpload = async (file: UploadFilePart) => {
    setIsUploading(true);
    setStatus(`Uploading ${file.name}`);

    try {
      const result = await uploadFile(file);
      setStatus(`Uploaded ${file.name}`);
      navigation.navigate('UploadDetails', { uploadId: result.id });
    } catch (error) {
      setStatus(`Upload failed for ${file.name}`);
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Unknown upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const { open: openPhotoPicker, PickerSheet } = usePhotoPicker(
    {
      onPicked: async ({ asset, source }) => {
        const file = toImageFilePart(asset);
        if (!file) {
          Alert.alert('No image selected', 'Please select an image with a valid file URI.');
          return;
        }
        setStatus(`Selected from ${source}`);
        await submitUpload(file);
      },
      onError: (message) => {
        Alert.alert('Photo picker error', message);
      },
    },
    {
      title: 'Add Photo',
      subtitle: 'Take a new photo or choose one from your gallery.',
    },
  );

  const chooseDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const doc = result.assets[0];
      await submitUpload({
        uri: doc.uri,
        name: doc.name ?? 'document-upload',
        type: doc.mimeType ?? 'application/octet-stream',
      });
    } catch (error) {
      Alert.alert('Document picker error', error instanceof Error ? error.message : 'Unknown picker error');
    }
  };

  return (
    <Screen>
      <SectionHeading title="UPLOADS" />
      <AppText preset="heading2" style={styles.title}>
        Uploads
      </AppText>
      <AppText preset="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
        Pick an image from camera or gallery, or choose a document to upload.
      </AppText>

      <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <AppButton text="Choose Image" icon="image" disabled={isUploading} onPress={openPhotoPicker} />
        <AppButton text="Choose File" icon="file" disabled={isUploading} onPress={chooseDocument} />

        <View style={styles.statusRow}>
          {isUploading ? <ActivityIndicator color={theme.primary} /> : null}
          <AppText preset="body" style={styles.status}>
            {status}
          </AppText>
        </View>
      </View>

      {PickerSheet}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 22,
    lineHeight: 22,
  },
  panel: {
    gap: 14,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  status: {
    flex: 1,
  },
});
