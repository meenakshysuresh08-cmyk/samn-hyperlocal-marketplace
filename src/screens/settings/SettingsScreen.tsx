import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppText, Screen, SectionHeading } from '../../components';
import { useAppTheme } from '../../theme/useAppTheme';
import type { ThemePreference } from '../../theme/theme.types';

const options: ThemePreference[] = ['light', 'dark', 'system'];

export const SettingsScreen = () => {
  const { theme, preference, setPreference } = useAppTheme();

  return (
    <Screen>
      <SectionHeading title="APPEARANCE" />
      <AppText preset="heading2" style={styles.title}>
        Theme
      </AppText>
      <AppText preset="body" style={{ color: theme.textSecondary, marginBottom: 20 }}>
        Choose a fixed theme or follow Android system appearance.
      </AppText>

      <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {options.map(option => {
          const selected = option === preference;

          return (
            <Pressable
              key={option}
              style={[
                styles.option,
                { borderColor: theme.border },
                selected && { backgroundColor: theme.primary },
              ]}
              onPress={() => setPreference(option)}
            >
              <AppText
                preset="body"
                weight="semibold"
                style={[styles.optionText, selected ? styles.selectedOptionText : { color: theme.textPrimary }]}
              >
                {option}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.preview}>
        <AppButton text="Primary Button" onPress={() => undefined} />
        <AppButton text="Secondary" preset="secondary" onPress={() => undefined} style={styles.secondaryButton} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 8,
  },
  group: {
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  option: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  optionText: {
    textTransform: 'capitalize',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  preview: {
    marginTop: 24,
    gap: 12,
  },
  secondaryButton: {
    marginTop: 4,
  },
});
