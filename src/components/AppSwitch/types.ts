export interface AppSwitchProps {
  value?: boolean; // controlled
  defaultValue?: boolean; // uncontrolled
  onChange?: (val: boolean) => void;

  disabled?: boolean;

  size?: 'sm' | 'md' | 'lg';

  label?: string;
  description?: string;

  containerStyle?: any;
}
