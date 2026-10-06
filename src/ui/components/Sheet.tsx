import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme/tokens';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** A panel that slides up from the bottom over a dimmed screen. */
export function Sheet({ visible, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Fermer" />
        <View style={[styles.sheet, { paddingBottom: spacing.md + insets.bottom }]}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  dim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.dim },
  sheet: {
    backgroundColor: colors.background,
    borderTopWidth: 3,
    borderTopColor: colors.strong,
    paddingTop: spacing.md,
    paddingHorizontal: 14,
    gap: 10,
  },
});
