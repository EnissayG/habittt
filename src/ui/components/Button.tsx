import { Pressable, StyleSheet, Text } from 'react-native';

import { fonts, spacing, type Palette } from '../theme/tokens';
import { useThemedStyles } from '../theme/ThemeContext';

interface ButtonProps {
  label: string;
  onPress: () => void;
  /**
   * primary: the green action. alt: a neutral action (used for the relapse,
   * which is never shown in red). quiet: a discreet underlined link.
   */
  variant?: 'primary' | 'alt' | 'quiet';
  disabled?: boolean;
}

/** No rounded corners, no shadow; buttons have a darker 4 px bottom edge. */
export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const styles = useThemedStyles(makeStyles);
  const labels = useThemedStyles(makeLabels);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        variant === 'quiet' ? styles.quiet : styles.base,
        variant === 'primary' && styles.primary,
        variant === 'alt' && styles.alt,
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <Text style={[styles.label, labels[variant]]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    base: {
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 4,
      alignItems: 'center',
    },
    primary: { backgroundColor: colors.accent, borderBottomColor: colors.accentEdge },
    alt: { backgroundColor: colors.surface, borderBottomColor: colors.line },
    quiet: { paddingVertical: spacing.sm, alignItems: 'center' },
    dimmed: { opacity: 0.6 },
    label: { fontFamily: fonts.display, fontSize: 15 },
  });

const makeLabels = (colors: Palette) =>
  StyleSheet.create({
    primary: { color: colors.onAccent },
    alt: { color: colors.text },
    quiet: { color: colors.muted, fontSize: 13, textDecorationLine: 'underline' },
  });
