import { StyleSheet, Text } from 'react-native';

import { NumberText } from './NumberText';
import { useThemedStyles } from '../theme/ThemeContext';
import { fonts, type Palette } from '../theme/tokens';

/**
 * Under a text field (ADR 0024): how many characters are left, shown as the
 * limit nears; at the limit, a plain sentence says why typing stops.
 */
export function TextLimit({ length, max }: { length: number; max: number }) {
  const styles = useThemedStyles(makeStyles);
  if (length >= max) {
    return (
      <Text style={styles.limit} accessibilityLiveRegion="polite">
        {`${max} caractères au maximum.`}
      </Text>
    );
  }
  if (length < max * 0.8) return null;
  return <NumberText style={styles.count}>{`${length} / ${max}`}</NumberText>;
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    count: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'right' },
    limit: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
  });
