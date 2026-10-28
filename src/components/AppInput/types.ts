import { StyleProp, TextInputProps, ViewStyle } from 'react-native';

import { IconName } from '../AppIcon';

export interface AppInputProps extends TextInputProps {
  label?: string;
  labelTx?: string;
  labelTxOptions?: any;

  placeholder?: string;
  placeholderTx?: string;
  placeholderTxOptions?: any;

  error?: string | null;
  errorTx?: string;

  helper?: string | null;
  helperTx?: string;

  leftIcon?: IconName;
  rightIcon?: IconName;
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;

  rightIconContainerStyle?: StyleProp<ViewStyle>;
  rightIconColor?: string;

  containerStyle?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  /** Merged onto the bordered input wrapper (background, radius, border). */
  inputWrapperStyle?: StyleProp<ViewStyle>;
}
