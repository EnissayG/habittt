import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { HabitId, LocalDate } from '../../domain';
import { Button } from '../components/Button';
import { DayGrid } from '../components/DayGrid';
import { days, toggleRelapseErrorMessage } from '../messages';
import { colors, fonts, spacing } from '../theme/tokens';
import { useTracker } from '../TrackerContext';
import { useLoader } from '../useLoader';

interface HabitScreenProps {
  habitId: HabitId;
  onBack: () => void;
}

export function HabitScreen({ habitId, onBack }: HabitScreenProps) {
  const tracker = useTracker();
  const load = useCallback(() => tracker.getHabit(habitId), [tracker, habitId]);
  const { data: detail, reload } = useLoader(load);
  const [error, setError] = useState<string | null>(null);

  async function toggle(date: LocalDate) {
    const result = await tracker.toggleRelapse(habitId, date);
    setError(result.ok ? null : toggleRelapseErrorMessage[result.error]);
    await reload();
  }

  const today = detail?.days[detail.days.length - 1];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>‹ Mes habitudes</Text>
      </Pressable>

      {detail && (
        <>
          <Text style={styles.name}>{detail.habit.name}</Text>

          <View>
            <Text style={styles.streak}>{detail.stats.currentStreak}</Text>
            <Text style={styles.streakLabel}>
              {detail.stats.currentStreak > 1 ? 'jours sans rechute' : 'jour sans rechute'}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <Stat label="record" value={days(detail.stats.longestStreak)} />
            <Stat label="depuis le début" value={days(detail.stats.totalDays)} />
          </View>

          <View style={styles.section}>
            <DayGrid days={detail.days} onPressDay={toggle} />
            <Text style={styles.hint}>
              Vert : jour tenu. Rouge : rechute. Touche un jour pour déclarer ou annuler une
              rechute.
            </Text>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          {today && (
            <Button
              label={
                today.relapsed ? "Annuler la rechute d'aujourd'hui" : "J'ai rechuté aujourd'hui"
              }
              variant={today.relapsed ? 'secondary' : 'danger'}
              onPress={() => toggle(today.date)}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  back: { fontFamily: fonts.mono, fontSize: 16, color: colors.muted },
  name: { fontFamily: fonts.mono, fontSize: 26, color: colors.text },
  streak: { fontFamily: fonts.mono, fontSize: 72, color: colors.accent, lineHeight: 80 },
  streakLabel: { fontFamily: fonts.mono, fontSize: 16, color: colors.text },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.md,
  },
  statValue: { fontFamily: fonts.mono, fontSize: 18, color: colors.text },
  statLabel: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  section: { gap: spacing.sm },
  hint: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted, lineHeight: 18 },
  error: { fontFamily: fonts.mono, fontSize: 14, color: colors.danger },
});
