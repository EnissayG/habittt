import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, BackHandler, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme/tokens';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Points the panel travels when it slides in. */
const SLIDE = 320;

/**
 * A panel that slides up from the bottom over a dimmed screen. Drawn inside
 * the screen (pass it as the Screen's `overlay`), not as a native modal:
 * iOS presents one modal at a time, and one that failed to close blocked
 * every panel after it.
 */
export function Sheet({ visible, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  const [offset] = useState(() => new Animated.Value(SLIDE));
  // Callers pass inline functions: keep the latest without restarting the slide.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!visible) return;
    offset.setValue(SLIDE);
    Animated.timing(offset, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      close.current();
      return true;
    });
    return () => back.remove();
  }, [visible, offset]);

  if (!visible) return null;
  return (
    <Animated.View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Fermer" />
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: spacing.md + insets.bottom, transform: [{ translateY: offset }] },
        ]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.dim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopWidth: 3,
    borderTopColor: colors.strong,
    paddingTop: spacing.md,
    paddingHorizontal: 14,
    gap: 10,
  },
});
