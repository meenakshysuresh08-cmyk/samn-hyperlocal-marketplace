import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, AppText, AppView } from '../../components';
import type { AuthStackParamList } from '../../navigation/RootNavigator.types';
import { authStyles } from './authStyles';
import { AuthFormField } from './AuthFormField';
import { AuthScreenLayout } from './AuthScreenLayout';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export const SignUpScreen = () => {
  const navigation = useNavigation<Nav>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <AuthScreenLayout
      footer={
        <AppView style={authStyles.footerRow}>
          <AppText style={authStyles.footerText}>Already have an account? </AppText>
          <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
            <AppText style={authStyles.footerLinkPrimary}>Login</AppText>
          </Pressable>
        </AppView>
      }
    >
      <AppView style={authStyles.headerBlockCentered}>
        <AppText preset="authCardTitle" style={authStyles.titleCentered}>
          Create Your Account
        </AppText>
        <AppText preset="authCardSubtitle" style={authStyles.subtitleCentered}>
          Join the SAMN community.
        </AppText>
      </AppView>

      <AuthFormField
        label="Full Name"
        labelStyle={authStyles.fieldLabelUpper}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Enter your full name"
        autoCapitalize="words"
        autoCorrect={false}
      />

      <AuthFormField
        label="Email Address"
        labelStyle={authStyles.fieldLabelUpper}
        value={email}
        onChangeText={setEmail}
        placeholder="email@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <AuthFormField
        label="Password"
        labelStyle={authStyles.fieldLabelUpper}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
      />

      <AuthFormField
        label="Confirm Password"
        labelStyle={authStyles.fieldLabelUpper}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="••••••••"
        secureTextEntry
      />

      <AppButton
        text="Create Account"
        preset="primary"
        onPress={() => navigation.navigate('Login')}
        style={authStyles.primaryButton}
        labelPreset="authButtonLabel"
        textWeight="semibold"
      />
    </AuthScreenLayout>
  );
};
