declare module 'expo' {
  export function registerRootComponent(component: React.ComponentType<any>): void;
}

declare module 'expo-font' {
  export function useFonts(map: Record<string, any>): [boolean, Error | null];
  export function loadAsync(map: Record<string, any>): Promise<void>;
}

declare module 'expo-linear-gradient' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface LinearGradientProps extends ViewProps {
    colors: readonly string[] | string[];
    start?: { x: number; y: number } | [number, number];
    end?: { x: number; y: number } | [number, number];
    locations?: readonly number[] | number[];
    pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  }

  export const LinearGradient: React.FC<LinearGradientProps>;
}

declare module '@expo/vector-icons' {
  import * as React from 'react';
  import { TextStyle, StyleProp } from 'react-native';

  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  }

  export const Feather: React.FC<IconProps>;
  export const Ionicons: React.FC<IconProps>;
  export const MaterialCommunityIcons: React.FC<IconProps>;
  export const MaterialIcons: React.FC<IconProps>;
}

declare module 'expo-image-picker' {
  export interface ImagePickerAsset {
    uri: string;
    assetId?: string | null;
    width: number;
    height: number;
    type?: 'image' | 'video' | 'livePhoto';
    fileName?: string | null;
    fileSize?: number | null;
    mimeType?: string | null;
    base64?: string | null;
  }

  export interface ImagePickerOptions {
    mediaTypes?: string[] | string;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    allowsMultipleSelection?: boolean;
    selectionLimit?: number;
    base64?: boolean;
  }

  export interface ImagePickerResult {
    canceled: boolean;
    assets: ImagePickerAsset[] | null;
  }

  export interface PermissionResponse {
    status: 'granted' | 'undetermined' | 'denied';
    granted: boolean;
    canAskAgain: boolean;
    expires: 'never' | number;
  }

  export function requestCameraPermissionsAsync(): Promise<PermissionResponse>;
  export function requestMediaLibraryPermissionsAsync(): Promise<PermissionResponse>;
  export function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
  export function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
}

declare module 'expo-document-picker' {
  export interface DocumentPickerAsset {
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
    lastModified?: number;
    file?: File;
  }

  export interface DocumentPickerOptions {
    type?: string | string[];
    copyToCacheDirectory?: boolean;
    multiple?: boolean;
  }

  export interface DocumentPickerResult {
    canceled: boolean;
    assets: DocumentPickerAsset[] | null;
  }

  export function getDocumentAsync(options?: DocumentPickerOptions): Promise<DocumentPickerResult>;
}

declare module 'expo-file-system' {
  export interface FileInfo {
    exists: boolean;
    uri: string;
    size?: number;
    isDirectory?: boolean;
    modificationTime?: number;
    md5?: string;
  }

  export interface GetInfoOptions {
    md5?: boolean;
    size?: boolean;
  }

  export function getInfoAsync(fileUri: string, options?: GetInfoOptions): Promise<FileInfo>;
}
