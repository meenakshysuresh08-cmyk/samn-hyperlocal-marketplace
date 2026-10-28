import { StyleProp, ViewStyle } from 'react-native';

export interface AppCheckboxProps {
  label?: string;
  description?: string;

  value?: boolean;
  defaultValue?: boolean;
  onChange?: (checked: boolean) => void;

  disabled?: boolean;

  boxSize?: number;
  hitSlop?: number | object;

  containerStyle?: StyleProp<ViewStyle>;
}
