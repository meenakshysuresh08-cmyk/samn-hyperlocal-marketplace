import React, { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useThemeStore } from '../../theme/useThemeStore';
import { AppText } from '../AppText';

export type SectionHeadingProps = {
  title: string;
  /** Optional element rendered to the right (e.g. a "+ ADD" / "MANAGE" link). */
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const SectionHeadingInner: React.FC<SectionHeadingProps> = ({
  title,
  trailing,
  style,
}) => {
  const isDark = useThemeStore(s => s.colorScheme === 'dark');
  const muted = isDark ? '#94A3B8' : '#64748B';

  return (
    <View style={[styles.row, style]}>
      <AppText
        style={[styles.title, { color: muted }]}
        allowFontScaling={false}
      >
        {title}
      </AppText>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  trailing: {
    marginLeft: 12,
  },
});

export const SectionHeading = memo(SectionHeadingInner);
