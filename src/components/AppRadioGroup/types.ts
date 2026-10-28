import { StyleProp, TextStyle, ViewStyle } from 'react-native';

export interface RadioOption {
  label: string;
  value: string | number;
  description?: string;
}

export interface AppRadioGroupProps {
  options: RadioOption[];

  value?: string | number | null;
  defaultValue?: string | number;

  onChange?: (value: string | number) => void;

  disabled?: boolean;

  containerStyle?: StyleProp<ViewStyle>;
  optionStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export interface AppRadioButtonProps {
  selected: boolean;
  label: string;
  description?: string;
  onPress: () => void;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}
