import { useFonts } from 'expo-font';
import { StyleSheet, Text, View } from 'react-native';

import { CANDIDATE_FILES, FONT_CANDIDATES } from '../theme/fontCandidates';
import { colors, fonts, spacing } from '../theme/tokens';

const NUMBERS = '952  982  508  717';
const PAIRS = '5 8 · 6 · 7 1 · 0 O';

/**
 * Lab board for choosing the digits' font: each candidate at the size of
 * the habit counter (52) and of the shelf labels (13 and 12). The digits
 * must be told apart at a glance: 5 and 8, 6, 7 and 1, 0 and O.
 */
export function DigitBoard() {
  const [loaded, error] = useFonts(CANDIDATE_FILES);
  if (!loaded && !error) return <Text style={styles.note}>Chargement des polices…</Text>;
  return (
    <View style={styles.board}>
      {FONT_CANDIDATES.map((font) => (
        <View key={font.label} style={styles.candidate}>
          <Text style={styles.note}>{font.label}</Text>
          <Text style={[styles.counter, { fontFamily: font.counter }]} allowFontScaling={false}>
            952 982
          </Text>
          {[13, 12].map((size) => (
            <View key={size}>
              <Text
                style={[styles.line, { fontFamily: font.label12, fontSize: size }]}
                allowFontScaling={false}
              >
                0123456789 · 982 jours
              </Text>
              <Text
                style={[styles.line, { fontFamily: font.label12, fontSize: size }]}
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
