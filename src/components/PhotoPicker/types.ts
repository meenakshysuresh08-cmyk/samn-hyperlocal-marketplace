import type { ImagePickerOptions, ImagePickerAsset } from 'expo-image-picker';

export type PhotoPickerSource = 'camera' | 'gallery';

export type Asset = {
  uri: string;
  fileName?: string | null;
  type?: string | null;
  fileSize?: number | null;
  width?: number;
  height?: number;
  base64?: string | null;
};

export type PhotoPickerResult = {
  asset: Asset;
  assets: Asset[];
  source: PhotoPickerSource;
};

export type PhotoPickerOptions = {
  title?: string;
  subtitle?: string;
  selectionLimit?: number;
  camera?: Partial<ImagePickerOptions>;
  library?: Partial<ImagePickerOptions>;
};

export type UsePhotoPickerCallbacks = {
  onPicked?: (result: PhotoPickerResult) => void;
  onCancel?: () => void;
  onError?: (message: string, source: PhotoPickerSource | 'sheet') => void;
};
