import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemedStyles } from '../theme/ThemeContext';
import { fonts, spacing, type Palette } from '../theme/tokens';

// A short, gentle message at the bottom of the screen (ADR 0024): what
// went wrong, said plainly, never in red. It goes away by itself, or with a
// touch. Every failure that is not already written under a field ends up
// here, so that nothing ever fails in silence.

/** Seconds a message stays. */
const SHOWN = 4.5;

type Show = (message: string) => void;

const NoticeContext = createContext<Show>(() => undefined);

export function NoticeProvider({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setMessage(null),
    );
  }, [opacity]);

  const show = useCallback<Show>(
    (text) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      AccessibilityInfo.announceForAccessibility(text);
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
      timer.current = setTimeout(hide, SHOWN * 1000);
    },
    [opacity, hide],
  );
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo(() => show, [show]);
  return (
    <NoticeContext.Provider value={value}>
      {children}
      {message && (
        <Animated.View
          style={[styles.wrap, { bottom: insets.bottom + spacing.lg, opacity }]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={hide}
            accessibilityRole="alert"
            accessibilityHint="Touche pour fermer"
            style={styles.notice}
          >
            <Text style={styles.text}>{message}</Text>
          </Pressable>
        </Animated.View>
      )}
    </NoticeContext.Provider>
  );
}

/** Shows a gentle message at the bottom of the screen. */
export function useNotice(): Show {
  return useContext(NoticeContext);
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { position: 'absolute', left: 14, right: 14, alignItems: 'center' },
    notice: {
      backgroundColor: colors.strong,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 4,
      borderBottomColor: colors.line,
      maxWidth: 420,
    },
    text: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.onStrong },
  });
