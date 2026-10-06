import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, spacing } from '../theme/tokens';
import { NumberText } from './NumberText';
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
          <NumberText style={styles.label}>{backLabel ?? ''}</NumberText>
        </Pressable>
      ) : (
        <View />
      )}
      {typeof right === 'string' ? <NumberText style={styles.label}>{right}</NumberText> : right}
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
