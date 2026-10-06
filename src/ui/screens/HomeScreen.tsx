import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { HabitId } from '../../domain';
import { Button } from '../components/Button';
import { days } from '../messages';
import { colors, fonts, spacing } from '../theme/tokens';
import { useTracker } from '../TrackerContext';
import { useLoader } from '../useLoader';

interface HomeScreenProps {
  onOpenHabit: (id: HabitId) => void;
  onNewHabit: () => void;
  /** Only passed in development builds: shows the plant lab entry. */
  onOpenLab?: () => void;
}

export function HomeScreen({ onOpenHabit, onNewHabit, onOpenLab }: HomeScreenProps) {
  const tracker = useTracker();
  const load = useCallback(() => tracker.listHabits(), [tracker]);
  const { data: habits } = useLoader(load);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>habittt</Text>

      {habits && habits.length === 0 && (
        <Text style={styles.empty}>
          Aucune habitude pour l&apos;instant.{'\n'}Ajoute celle que tu veux arrêter.
        </Text>
      )}

      <FlatList
        data={habits ?? []}
        keyExtractor={(item) => item.habit.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenHabit(item.habit.id)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <Text style={styles.name}>{item.habit.name}</Text>
            <Text style={styles.streak}>{days(item.stats.currentStreak)}</Text>
            <Text style={styles.meta}>record : {days(item.stats.longestStreak)}</Text>
          </Pressable>
        )}
      />

      <Button label="+ Nouvelle habitude" onPress={onNewHabit} />
      {onOpenLab && <Button label="Labo (dev)" variant="quiet" onPress={onOpenLab} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  title: { fontFamily: fonts.displayBold, fontSize: 32, color: colors.text },
  empty: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, lineHeight: 22 },
  list: { gap: spacing.md },
  card: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pressed: { opacity: 0.7 },
  name: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
  streak: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
