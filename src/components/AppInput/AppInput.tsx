import { Animated, TextInput, TouchableOpacity } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';

import { AppIcon } from '../AppIcon';
import { AppInputProps } from './types';
import { AppText } from '../AppText';
import { AppInputStyles as S, SECURE_TOGGLE_ICON_SIZE } from './styles';
import { useIsRTL } from '../../hooks/useIsRTL';
import { useThemeStore } from '../../theme/useThemeStore';
import { AppView } from '../AppView';

export const AppInput: React.FC<AppInputProps> = ({
  label,
  labelTx,
  labelTxOptions,

  placeholder,
  placeholderTx,
  placeholderTxOptions,

  value,
  onChangeText,

  error,
  errorTx,

  helper,
  helperTx,

  leftIcon,
  rightIcon,
  onLeftIconPress,
  onRightIconPress,

  secureTextEntry,
  containerStyle,
  wrapperStyle,
  inputWrapperStyle,
  onFocus,
  onBlur,
  style: inputStyle,
  placeholderTextColor,
  rightIconContainerStyle,
  rightIconColor,
  ...rest
}) => {
  const theme = useThemeStore(s => s.theme);
  const isRTL = useIsRTL();

  const inputRef = useRef<TextInput>(null);

  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(!!secureTextEntry);

  useEffect(() => {
    setSecure(!!secureTextEntry);
  }, [secureTextEntry]);

  const labelText = labelTx ?? label;
  const placeholderText = placeholderTx ?? placeholder;
  const errorText = errorTx ?? error;
  const helperText = helperTx ?? helper;

  // --------- Floating Label Animation ---------
  const animatedLabel = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedLabel, {
      toValue: focused || !!value ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [focused, value]);

  const labelTranslateY = animatedLabel.interpolate({
    inputRange: [0, 1],
    outputRange: [14, -12],
  });

  const labelScale = animatedLabel.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  return (
    <AppView style={[S.container, containerStyle]}>
      {/* Floating Label */}
      {labelText && (
        // <Animated.View
        //   style={{
        //     // position: "absolute",
        //     // left: isRTL ? undefined : 10,
        //     // right: isRTL ? 10 : undefined,
        //     // top: -10,
        //     transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
        //   }}
        // >
        <AppText
          text={labelText}
          preset="label"
          style={{
            color: focused ? theme.primary : theme.textSecondary,
            marginVertical: 4,
            marginLeft: isRTL ? 0 : 4,
            marginRight: isRTL ? 4 : 0,
          }}
        />
        // </Animated.View>
      )}

      {/* Input Wrapper */}
      <AppView
        style={[
          S.inputWrapper,
          {
            borderColor: theme.border,
            backgroundColor: theme.card,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
          wrapperStyle,
          inputWrapperStyle,
          errorText ? { borderColor: theme.error } : null,
          !errorText && focused ? { borderColor: theme.primary } : null,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <TouchableOpacity
            style={S.iconButton}
            onPress={onLeftIconPress}
            disabled={!onLeftIconPress}
          >
            <AppIcon name={leftIcon} size="md" color={theme.textSecondary} />
          </TouchableOpacity>
        )}

        {/* TextInput */}
        <TextInput
          key={secureTextEntry ? (secure ? 'secure' : 'plain') : 'text'}
          ref={inputRef}
          style={[
            S.textInput,
            {
              color: theme.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
              paddingTop: labelText ? 10 : 10,
              flex: 1,
            },
            inputStyle,
          ]}
          placeholder={placeholderText}
          placeholderTextColor={placeholderTextColor ?? theme.textSecondary}
          value={value}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
          onChangeText={onChangeText}
          {...rest}
          secureTextEntry={secure}
        />

        {/* Secure Text Toggle */}
        {secureTextEntry && (
          <TouchableOpacity
            style={S.iconButton}
            onPress={() => setSecure(prev => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={secure ? 'Show password' : 'Hide password'}
          >
            <AppIcon
              name={secure ? 'eye' : 'eyeOff'}
              width={SECURE_TOGGLE_ICON_SIZE}
              height={SECURE_TOGGLE_ICON_SIZE}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Right Icon */}
        {!secureTextEntry && rightIcon && (
          <TouchableOpacity
            style={[S.iconButton, rightIconContainerStyle]}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            <AppIcon
              name={rightIcon}
              size="md"
              color={rightIconColor || theme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </AppView>

      {/* Error / Helper Text */}
      {errorText ? (
        <AppText
          text={errorText}
          preset="bodySmall"
          style={[S.errorText, { color: theme.error }]}
        />
      ) : helperText ? (
        <AppText
          text={helperText}
          preset="bodySmall"
          style={{
            color: theme.textSecondary,
            textAlign: isRTL ? 'right' : 'left',
          }}
        />
      ) : null}
    </AppView>
  );
};
