import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import React, { useRef, useState } from 'react';

import { AppIcon } from '../AppIcon';
import { AppInputStyles as S } from '../AppInput/styles';
import { useIsRTL } from '../../hooks/useIsRTL';
import { useThemeStore } from '../../theme/useThemeStore';

interface AppInputPasswordProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;

  error?: string | null;
  helper?: string | null;

  containerStyle?: StyleProp<ViewStyle>;
  returnKeyType?: 'done' | 'next' | 'go' | 'send';
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
}

export const AppInputPassword: React.FC<AppInputPasswordProps> = ({
  label,
  placeholder,
  value,
  onChangeText,

  error,
  helper,

  containerStyle,
  returnKeyType = 'done',
  onSubmitEditing,
  blurOnSubmit = true,
}) => {
  const theme = useThemeStore(s => s.theme);
  const isRTL = useIsRTL();
  
  const [secure, setSecure] = useState(true);
  const inputRef = useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={[S.container, containerStyle]}>
          {/* Label */}
          {label && (
            <Text
              style={[
                S.label,
                { color: theme.text, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {label}
            </Text>
          )}

          {/* Input Wrapper */}
          <View
            style={[
              S.inputWrapper,
              {
                borderColor: error ? 'red' : theme.border,
                backgroundColor: theme.card,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            {/* TextInput */}
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={secure}
              style={[
                S.textInput,
                {
                  color: theme.text,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
              returnKeyType={returnKeyType}
              onSubmitEditing={onSubmitEditing}
              blurOnSubmit={blurOnSubmit}
            />

            {/* Right toggle icon */}
            <TouchableOpacity
              onPress={() => setSecure(!secure)}
              style={S.iconButton}
            >
              {/* <AppIcon
                name={secure ? "eye-off-outline" : "eye-outline"}
                size="md"
                color={theme.textSecondary}
              /> */}
              <AppIcon
                name={{
                  type: 'vector',
                  pack: 'material',
                  name: secure ? 'explore-off' : 'explore',
                }}
                size="lg"
              />
            </TouchableOpacity>
          </View>

          {/* Error / Helper */}
          {error ? (
            <Text style={S.errorText}>{error}</Text>
          ) : helper ? (
            <Text
              style={[
                S.helperText,
                {
                  color: theme.textSecondary,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            >
              {helper}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
