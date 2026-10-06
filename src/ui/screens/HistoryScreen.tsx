import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';

import type { DayEntry, LocalDate } from '../../domain';
import { DayGrid } from '../components/DayGrid';
import { NumberText } from '../components/NumberText';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { dayMonth, days } from '../format';
import { NoteSheet } from '../habit/NoteSheet';
import { MOOD_LABELS, toggleRelapseErrorMessage } from '../messages';
import type { ScreenProps } from '../navigation/types';
import { colors, fonts } from '../theme/tokens';
import { useTracker } from '../TrackerContext';
import { useScreenData } from '../useLoader';

/** Screen 7: every day since the start; touching one corrects a relapse. */
export function HistoryScreen({ navigation, route }: ScreenProps<'History'>) {
  const { id } = route.params;
  const tracker = useTracker();
  const { width } = useWindowDimensions();
  const load = useCallback(() => tracker.getHabit(id), [tracker, id]);
  const { data: detail, reload } = useScreenData(load);
  const [error, setError] = useState<string | null>(null);
  /** The day whose note is being edited. */
  const [editing, setEditing] = useState<DayEntry | null>(null);

  if (!detail) return <Screen>{null}</Screen>;

  async function toggle(date: LocalDate) {
    const result = await tracker.toggleRelapse(id, date);
    setError(result.ok ? null : toggleRelapseErrorMessage[result.error]);
    await reload();
  }

  const today = tracker.today();
  // Notes under the grid, newest first.
  const noted = detail.days.filter((day) => day.note).reverse();

  return (
    <Screen
      scroll
      overlay={
        editing && (
          <NoteSheet
            habitId={id}
            date={editing.date}
            dayNumber={editing.index + 1}
            initial={editing.note}
            mode="edit"
            onClose={() => setEditing(null)}
            onDone={() => {
              setEditing(null);
              void reload();
            }}
          />
        )
      }
    >
      <TopBar
        backLabel={detail.habit.name}
        onBack={navigation.goBack}
        right={days(detail.stats.totalDays)}
      />
      <Text style={styles.title}>Historique</Text>
      <DayGrid days={detail.days} width={width - 28} onPressDay={toggle} />
      <Text style={styles.legend}>
        Vert : jour tenu. Orange : rechute. Encadré en rose : un jour avec une note. Touche un jour
        pour corriger une rechute.
      </Text>
      {error && <Text style={styles.legend}>{error}</Text>}
      {noted.map((day) => (
        <Pressable
          key={day.date}
          accessibilityRole="button"
          accessibilityHint="Modifier la note"
          onPress={() => setEditing(day)}
          style={[styles.note, day.relapsed && styles.relapseNote]}
        >
          <NumberText style={styles.noteTitle}>
            {`Jour ${day.index + 1} · ${day.relapsed ? 'rechute' : dayMonth(day.date, today)}`}
          </NumberText>
          {day.note?.mood && <Text style={styles.noteMood}>{MOOD_LABELS[day.note.mood]}</Text>}
          {day.note?.text ? <Text style={styles.noteText}>{day.note.text}</Text> : null}
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  legend: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, lineHeight: 17 },
  note: {
    borderLeftWidth: 3,
    borderLeftColor: colors.note,
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
  },
  relapseNote: { borderLeftColor: colors.relapse },
  noteTitle: { fontFamily: fonts.display, fontSize: 13, color: colors.text },
  // Only text goes on the surface color (TEXT_PAIRS).
  noteMood: { fontFamily: fonts.display, fontSize: 12, color: colors.text },
  noteText: { fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 18 },
});
