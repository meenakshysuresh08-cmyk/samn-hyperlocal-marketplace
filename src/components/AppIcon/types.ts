import React from 'react';

export type VectorIconDefinition = {
  type: 'vector';
  pack: 'ion' | 'material' | 'materialCommunity' | 'feather';
  name: string; // dynamic string allowed, cast handled in component
};

export type SvgIconDefinition = {
  type: 'svg';
  component: React.FC<any>;
  /** When true, AppIcon may pass a color (explicit prop or theme default). */
  themable?: boolean;
};

export type ImageIcon = { uri: string } | number;

export type EmojiIcon = string;

export type IconSource =
  | VectorIconDefinition
  | SvgIconDefinition
  | ImageIcon
  | EmojiIcon;

export type AppIconSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'logo';

export interface AppIconProps {
  name: IconSource | IconName; // 🔥 Registry name OR direct object
  size?: AppIconSize;
  width?: number; // ← NEW
  height?: number;
  color?: string;
  rtlFlip?: boolean;
  pressable?: boolean;
  style?: any;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export type IconName = keyof typeof import('./IconRegistry').IconRegistry;
