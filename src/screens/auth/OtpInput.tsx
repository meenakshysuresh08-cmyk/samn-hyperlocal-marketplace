import React, { useRef, useState } from 'react';
import { Pressable, TextInput } from 'react-native';

import { AppText, AppView } from '../../components';
import { authColors, authStyles } from './authStyles';

const OTP_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange }) => {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(cleaned);
  };

  return (
    <AppView>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        style={authStyles.otpHiddenInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="One-time password"
      />

      <AppView style={authStyles.otpRow}>
        {digits.map((digit, index) => {
          const isActive = focused && index === activeIndex;
          const display = digit.trim() ? digit : '';

          return (
            <Pressable
              key={index}
              onPress={() => inputRef.current?.focus()}
              style={[authStyles.otpCell, isActive && authStyles.otpCellFocused]}
              accessibilityRole="button"
              accessibilityLabel={`Digit ${index + 1}`}
            >
              <AppText style={authStyles.otpCellText}>{display}</AppText>
            </Pressable>
          );
        })}
      </AppView>
    </AppView>
  );
};

export const OTP_LENGTH_CONST = OTP_LENGTH;
