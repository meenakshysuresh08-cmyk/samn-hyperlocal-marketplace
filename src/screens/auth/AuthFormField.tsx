import React from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { AppInput, AppText, AppView } from '../../components';
import type { AppInputProps } from '../../components/AppInput';
import { authColors, authStyles } from './authStyles';

type AuthFormFieldProps = Omit<AppInputProps, 'containerStyle'> & {
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export const AuthFormField: React.FC<AuthFormFieldProps> = ({
  label,
  labelStyle,
  containerStyle,
  inputWrapperStyle,
  style,
  placeholderTextColor,
  ...inputProps
}) => (
  <AppView style={[authStyles.fieldSpacing, containerStyle]}>
    <AppText style={[authStyles.fieldLabel, labelStyle]}>{label}</AppText>
    <AppInput
      {...inputProps}
      inputWrapperStyle={[authStyles.inputWrapper, inputWrapperStyle]}
      style={[authStyles.inputText, style]}
      placeholderTextColor={placeholderTextColor ?? authColors.inputPlaceholder}
      containerStyle={{ marginBottom: 0 }}
    />
  </AppView>
);
