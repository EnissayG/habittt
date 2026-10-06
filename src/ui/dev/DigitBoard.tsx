import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../theme/tokens';

const NUMBERS = '951  952  982  508  717';
const PAIRS = '5 8 · 6 · 7 1 · 0 O';

const BOARD = [
  { label: 'Pixelify Sans (avant)', family: fonts.displayBold },
  { label: 'Jersey 10 (retenue : fonts.numeric)', family: fonts.numeric },
];

/**
 * Lab board of the digits' font: the one chosen beside the one it replaced,
 * at the size of the habit counter (52) and of small labels (13 and 12).
 * The digits must be told apart at a glance: 5 and 8, 6, 7 and 1, 0 and O.
 */
export function DigitBoard() {
  return (
    <View style={styles.board}>
      {BOARD.map((font) => (
        <View key={font.label} style={styles.candidate}>
          <Text style={styles.note}>{font.label}</Text>
          <Text style={[styles.counter, { fontFamily: font.family }]} allowFontScaling={false}>
            951 982
          </Text>
          {[13, 12].map((size) => (
            <View key={size}>
              <Text
                style={[styles.line, { fontFamily: font.family, fontSize: size }]}
                allowFontScaling={false}
              >
                0123456789 · 982 jours
              </Text>
              <Text
                style={[styles.line, { fontFamily: font.family, fontSize: size }]}
                allowFontScaling={false}
              >
                {NUMBERS} · {PAIRS}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { gap: spacing.md },
  candidate: { gap: 2, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.sm },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  counter: { fontSize: 52, color: colors.text },
  line: { color: colors.text },
});
