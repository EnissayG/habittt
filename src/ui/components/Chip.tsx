import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, spacing } from '../theme/tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  /** Larger chips are used for choices (dates); small ones for facts. */
  big?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export function Chip({ label, selected = false, big = false, onPress, disabled }: ChipProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected, disabled }}
      onPress={onPress}
      disabled={!onPress || disabled}
      style={[
        styles.chip,
        big && styles.big,
        selected && styles.selected,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, big && styles.bigLabel, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { backgroundColor: colors.surface, paddingVertical: 3, paddingHorizontal: spacing.sm },
  big: { paddingVertical: 6, paddingHorizontal: 10 },
  selected: { backgroundColor: colors.strong },
  disabled: { opacity: 0.5 },
  label: { fontFamily: fonts.display, fontSize: 12, color: colors.text },
  bigLabel: { fontSize: 14 },
  selectedLabel: { color: colors.onStrong },
});
