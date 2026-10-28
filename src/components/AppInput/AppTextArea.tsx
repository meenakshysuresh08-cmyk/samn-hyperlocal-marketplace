import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';

import { AppText } from '../AppText';
import { AppInputStyles as S } from './styles';
import { useIsRTL } from '../../hooks/useIsRTL';
import { useThemeStore } from '../../theme/useThemeStore';

interface AppTextAreaProps {
  label?: string;
  labelTx?: string;
  labelTxOptions?: any;

  placeholder?: string;
  placeholderTx?: string;
  placeholderTxOptions?: any;

  value?: string;
  onChangeText?: (text: string) => void;

  minHeight?: number;
  maxHeight?: number;

  error?: string | null;
  errorTx?: string;

  helper?: string | null;
  helperTx?: string;

  containerStyle?: any;
}

export const AppTextArea: React.FC<AppTextAreaProps> = ({
  label,
  labelTx,
  labelTxOptions,

  placeholder,
  placeholderTx,
  placeholderTxOptions,

  value,
  onChangeText,

  minHeight = 120,
  maxHeight = 220,

  error,
  errorTx,

  helper,
  helperTx,

  containerStyle,
}) => {
  const theme = useThemeStore(s => s.theme);
  const isRTL = useIsRTL();

  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [height, setHeight] = useState(minHeight);

  const labelText = labelTx ?? label;
  const placeholderText = placeholderTx ?? placeholder;
  const errorText = errorTx ?? error;
  const helperText = helperTx ?? helper;

  // ----- Floating Label Animation -----
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
    outputRange: [16, -12],
  });

  const labelScale = animatedLabel.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={[S.container, containerStyle]}>
          {/* Floating Label */}
          {labelText && (
            <Animated.View
              style={{
                position: 'absolute',
                left: isRTL ? undefined : 12,
                right: isRTL ? 12 : undefined,
                top: 12,
                zIndex: 2,
                transform: [
                  { translateY: labelTranslateY },
                  { scale: labelScale },
                ],
              }}
            >
              <AppText
                text={labelText}
                size="sm"
                style={{
                  color: focused ? theme.primary : theme.textSecondary,
                }}
              />
            </Animated.View>
          )}

          {/* Wrapper */}
          <View
            style={[
              S.inputWrapper,
              {
                alignItems: 'flex-start',
                paddingTop: 22,
                borderColor: errorText ? 'red' : theme.border,
                backgroundColor: theme.card,
                height: height,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              multiline
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={!value || focused ? placeholderText : ''}
              placeholderTextColor={theme.textSecondary}
              style={[
                S.textInput,
                {
                  height: height - 26,
                  color: theme.text,
                  textAlignVertical: 'top',
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
              onContentSizeChange={e => {
                const newHeight = e.nativeEvent.contentSize.height;
                if (newHeight >= minHeight && newHeight <= maxHeight) {
                  setHeight(newHeight + 26);
                }
              }}
            />
          </View>

          {/* Error or Helper */}
          {errorText ? (
            <AppText text={errorText} preset="error" style={S.errorText} />
          ) : helperText ? (
            <AppText
              text={helperText}
              preset="helper"
              style={[
                S.helperText,
                {
                  color: theme.textSecondary,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            />
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
