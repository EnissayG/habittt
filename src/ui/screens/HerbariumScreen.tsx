import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HerbariumLife } from '../../domain';
import { NumberText } from '../components/NumberText';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { dayMonth, days } from '../format';
import type { ScreenProps } from '../navigation/types';
import { colors, fonts, spacing } from '../theme/tokens';
import { useTracker } from '../TrackerContext';
import { useScreenData } from '../useLoader';

/**
 * Screen 10, the herbarium (replaces the garden, ADR 0013): the past lives
 * of every plant, with their start, their end and their days. Touching a
 * habit opens its journal.
 */
export function HerbariumScreen({ navigation }: ScreenProps<'Herbarium'>) {
  const tracker = useTracker();
  const load = useCallback(() => tracker.getHerbarium(), [tracker]);
  const { data: entries } = useScreenData(load);
  const today = tracker.today();

  if (!entries) return <Screen>{null}</Screen>;

  const lifeLine = (life: HerbariumLife) =>
    `Vie ${life.index + 1} · du ${dayMonth(life.start, today)} au ${dayMonth(life.end, today)}`;

  return (
    <Screen scroll>
      <TopBar backLabel="réglages" onBack={navigation.goBack} />
      <View>
        <Text style={styles.title}>L&apos;herbier</Text>
        <Text style={styles.small}>Les vies passées de tes plantes.</Text>
      </View>
      {entries.length === 0 && (
        <Text style={styles.small}>
          Rien pour l&apos;instant. Quand une plante n&apos;a pas tenu, elle vient sécher ici.
        </Text>
      )}
      {entries.map(({ habit, lives }) => (
        <View key={habit.id} style={styles.entry}>
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Ouvrir son journal"
            onPress={() => navigation.navigate('Journal', { id: habit.id })}
          >
            <NumberText style={styles.name}>{`${habit.name} ›`}</NumberText>
            {habit.status === 'garden' && (
              <Text style={styles.small}>Retirée de l&apos;étagère.</Text>
            )}
          </Pressable>
          {lives.map((life) => (
            <View key={life.index} style={styles.life}>
              <NumberText style={styles.lifeLine}>{lifeLine(life)}</NumberText>
              <NumberText style={styles.small}>
                {`${days(life.days)} · ${life.endedBy === 'relapse' ? "n'a pas tenu" : 'retirée'}`}
              </NumberText>
            </View>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  small: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, lineHeight: 17 },
  entry: {
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
  },
  name: { fontFamily: fonts.display, fontSize: 17, color: colors.text },
  life: { paddingLeft: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.line, gap: 1 },
  lifeLine: { fontFamily: fonts.display, fontSize: 13, color: colors.text },
});
