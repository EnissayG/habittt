import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, type Palette } from '../theme/tokens';
import { useThemedStyles } from '../theme/ThemeContext';

interface ScreenProps {
  children: ReactNode;
  /** Scrollable content (lists, long forms). */
  scroll?: boolean;
  /** Content pinned under the scrolling area (main buttons). */
  footer?: ReactNode;
  /** Drawn over the whole screen, safe areas included (panels). */
  overlay?: ReactNode;
}

/** The phone frame of the mockup: cream background, 14 pt sides, safe areas. */
export function Screen({ children, scroll = false, footer, overlay }: ScreenProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.safe}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            style={styles.flex}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.flex]}>{children}</View>
        )}
        {footer && <View style={styles.footer}>{footer}</View>}
      </SafeAreaView>
      {overlay}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { paddingHorizontal: 14, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: 12 },
    footer: { paddingHorizontal: 14, paddingBottom: spacing.sm, gap: spacing.xs },
  });
