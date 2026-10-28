import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

import { PhotoPickerSheet } from './PhotoPicker';
import type {
  Asset,
  PhotoPickerOptions,
  PhotoPickerResult,
  PhotoPickerSource,
  UsePhotoPickerCallbacks,
} from './types';

function mapExpoAssetToAsset(expoAsset: ImagePicker.ImagePickerAsset): Asset {
  return {
    uri: expoAsset.uri,
    fileName: expoAsset.fileName ?? (expoAsset.uri.split('/').pop() || 'photo.jpg'),
    type: expoAsset.mimeType ?? 'image/jpeg',
    fileSize: expoAsset.fileSize ?? null,
    width: expoAsset.width,
    height: expoAsset.height,
    base64: expoAsset.base64 ?? null,
  };
}

export type UsePhotoPickerReturn = {
  open: () => void;
  close: () => void;
  openCamera: () => Promise<void>;
  openGallery: () => Promise<void>;
  isOpen: boolean;
  lastResult: PhotoPickerResult | null;
  PickerSheet: React.ReactElement;
};

export function usePhotoPicker(
  callbacks: UsePhotoPickerCallbacks = {},
  options: PhotoPickerOptions = {},
): UsePhotoPickerReturn {
  const [visible, setVisible] = useState(false);
  const [lastResult, setLastResult] = useState<PhotoPickerResult | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const cameraOptions = useMemo<ImagePicker.ImagePickerOptions>(
    () => ({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
      ...(options.camera ?? {}),
    }),
    [options.camera],
  );

  const libraryOptions = useMemo<ImagePicker.ImagePickerOptions>(
    () => ({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: (options.selectionLimit ?? 1) > 1,
      selectionLimit: options.selectionLimit ?? 1,
      ...(options.library ?? {}),
    }),
    [options.selectionLimit, options.library],
  );

  const open = useCallback(() => setVisible(true), []);

  const close = useCallback(() => {
    setVisible(false);
    callbacksRef.current.onCancel?.();
  }, []);

  const handleSuccess = useCallback((result: PhotoPickerResult) => {
    setLastResult(result);
    callbacksRef.current.onPicked?.(result);
  }, []);

  const handleError = useCallback((message: string, source: PhotoPickerSource | 'sheet') => {
    callbacksRef.current.onError?.(message, source);
  }, []);

  const openCamera = useCallback(async () => {
    setVisible(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        handleError('Camera permission is required to capture photos.', 'camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync(cameraOptions);
      if (result.canceled) {
        callbacksRef.current.onCancel?.();
        return;
      }

      const expoAssets = result.assets ?? [];
      if (expoAssets.length > 0) {
        const assets = expoAssets.map(mapExpoAssetToAsset);
        handleSuccess({ asset: assets[0], assets, source: 'camera' });
      }
    } catch (error: unknown) {
      handleError(error instanceof Error ? error.message : 'Failed to open camera.', 'camera');
    }
  }, [cameraOptions, handleError, handleSuccess]);

  const openGallery = useCallback(async () => {
    setVisible(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        handleError('Photos permission is required to select photos.', 'gallery');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync(libraryOptions);
      if (result.canceled) {
        callbacksRef.current.onCancel?.();
        return;
      }

      const expoAssets = result.assets ?? [];
      if (expoAssets.length > 0) {
        const assets = expoAssets.map(mapExpoAssetToAsset);
        handleSuccess({ asset: assets[0], assets, source: 'gallery' });
      }
    } catch (error: unknown) {
      handleError(error instanceof Error ? error.message : 'Failed to open gallery.', 'gallery');
    }
  }, [libraryOptions, handleError, handleSuccess]);

  const PickerSheet = (
    <PhotoPickerSheet
      visible={visible}
      title={options.title}
      subtitle={options.subtitle}
      onClose={close}
      onSelectCamera={openCamera}
      onSelectGallery={openGallery}
    />
  );

  return {
    open,
    close,
    openCamera,
    openGallery,
    isOpen: visible,
    lastResult,
    PickerSheet,
  };
}
