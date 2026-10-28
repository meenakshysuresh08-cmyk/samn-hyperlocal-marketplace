import { TextStyle, ViewStyle } from 'react-native';

import { IconName } from '../AppIcon/types';
import { TextPresets } from '../AppText/presets';

export type AppHeaderPreset = 'standard' | 'home' | 'back';

export interface AppHeaderProps {
  /**
   * Defines layout styling behavior natively.
   */
  preset?: AppHeaderPreset;
  /**
   * Optional title text.
   */
  title?: string;
  /**
   * Optional i18n translation key for the title.
   */
  tx?: string;
  /**
   * Text preset for the title. Defaults to "heading1".
   */
  titlePreset?: TextPresets;
  /**
   * Optional subtitle text.
   */
  subtitle?: string;
  /**
   * Optional i18n translation key for the subtitle.
   */
  subtitleTx?: string;
  /**
   * Whether the title should be centered. Defaults to true.
   */
  centerAligned?: boolean;
  /**
   * Action to perform when the left icon is pressed.
   * If showBack is true, this defaults to navigation.goBack().
   */
  onLeftPress?: () => void;
  /**
   * Custom left icon. Defaults to "chevron-left" if showBack is true.
   */
  leftIcon?: IconName;
  /**
   * Whether to show the back button.
   */
  showBack?: boolean;
  /**
   * Action to perform when the right icon is pressed.
   */
  onRightPress?: () => void;
  /**
   * Custom right icon.
   */
  rightIcon?: IconName;
  /**
   * Custom right content node.
   */
  rightContent?: React.ReactNode;
  /**
   * Custom left content node.
   */
  leftContent?: React.ReactNode;
  /**
   * Children will be rendered in the center slot if no title is provided.
   */
  children?: React.ReactNode;
  /**
   * Whether the header should be transparent.
   */
  transparent?: boolean;
  /**
   * Whether to automatically handle the top safe area. Defaults to true.
   */
  safeArea?: boolean;
  /**
   * Container style.
   */
  style?: ViewStyle | ViewStyle[];
  /**
   * Content style (the horizontal bar).
   */
  contentStyle?: ViewStyle | ViewStyle[];
  /**
   * Title style.
   */
  titleStyle?: TextStyle | TextStyle[];
}
