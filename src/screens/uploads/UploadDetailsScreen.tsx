import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../../components/Screen';
import type { RootStackParamList } from '../../navigation';
import { useAppTheme } from '../../theme/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'UploadDetails'>;

export const UploadDetailsScreen = ({ route }: Props) => {
  const { colors } = useAppTheme();

  return (
    <Screen>
      <Text style={[styles.title, { color: colors.text }]}>Upload Complete</Text>
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.mutedText }]}>Upload ID</Text>
        <Text style={[styles.value, { color: colors.text }]}>{route.params.uploadId}</Text>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 20,
    fontSize: 26,
    fontWeight: '800',
  },
  panel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
  },
});
