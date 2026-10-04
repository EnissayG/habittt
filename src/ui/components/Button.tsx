import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, spacing } from '../theme/tokens';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet';
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 4,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.accent },
  quiet: { backgroundColor: colors.surface },
  secondary: { borderWidth: 2, borderColor: colors.text },
  dimmed: { opacity: 0.6 },
  label: { fontFamily: fonts.body, fontSize: 16 },
});

const labelStyles = StyleSheet.create({
  primary: { color: colors.onAccent },
  quiet: { color: colors.text },
  secondary: { color: colors.text },
});
