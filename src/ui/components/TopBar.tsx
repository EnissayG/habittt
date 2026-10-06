import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../theme/tokens';
import { PixelIcon } from './PixelIcon';

interface TopBarProps {
  /** Label of the back link ("étagère", "retour", a habit name…). */
  backLabel?: string;
  onBack?: () => void;
  /** Right side: a short text or an icon button. */
  right?: ReactNode;
}

export function TopBar({ backLabel, onBack, right }: TopBarProps) {
  return (
    <View style={styles.bar}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={`Retour : ${backLabel ?? ''}`}
          hitSlop={12}
          style={styles.back}
        >
          <PixelIcon name="back" />
          <Text style={styles.label}>{backLabel}</Text>
        </Pressable>
      ) : (
        <View />
      )}
      {typeof right === 'string' ? <Text style={styles.label}>{right}</Text> : right}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  label: { fontFamily: fonts.display, fontSize: 14, color: colors.muted },
});
