import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import {
  journalMonths,
  monthCalendar,
  monthEntries,
  type LocalDate,
  type MonthId,
} from '../../domain';
import { MonthCalendar } from '../components/MonthCalendar';
import { NumberText } from '../components/NumberText';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { dayMonth, days } from '../format';
import { DaySheet } from '../habit/DaySheet';
import { NoteSheet } from '../habit/NoteSheet';
import { MOOD_LABELS, toggleRelapseErrorMessage } from '../messages';
import type { ScreenProps } from '../navigation/types';
import { fonts, type Palette } from '../theme/tokens';
import { useThemedStyles } from '../theme/ThemeContext';
import { useTracker } from '../TrackerContext';
import { useScreenData } from '../useLoader';

/** Screen sides (Screen's padding). */
const SIDES = 28;

/** The open panel: a day of the journal, or its note being written. Index in detail.days. */
type Open = { kind: 'day' | 'note'; index: number } | null;

/**
 * The plant's journal (replaces the history): a calendar of one month at a
 * time, swiped from the start month to the current one, and under it the
 * month's notes and relapses. Touching a day or a note opens that day.
 */
export function JournalScreen({ navigation, route }: ScreenProps<'Journal'>) {
  const styles = useThemedStyles(makeStyles);
  const { id, month: asked } = route.params;
  const tracker = useTracker();
  const { width } = useWindowDimensions();
  const load = useCallback(() => tracker.getHabit(id), [tracker, id]);
  const { data: detail, reload } = useScreenData(load);
  const [shown, setShown] = useState<number | null>(null);
  const [open, setOpen] = useState<Open>(null);
  const [error, setError] = useState<string | null>(null);

  const today = tracker.today();
  const pageWidth = width - SIDES;
  const months = useMemo(() => {
    const last = detail?.days[detail.days.length - 1];
    return detail && last ? journalMonths(detail.habit.startDate, last.date) : [];
  }, [detail]);

  if (!detail || months.length === 0) return <Screen>{null}</Screen>;

  // Opens on the asked month (the latest note's), otherwise on the last one.
  const initial = Math.max(0, months.indexOf(asked ?? months[months.length - 1]!));
  const current = Math.min(shown ?? initial, months.length - 1);
  const month: MonthId = months[current]!;
  const entries = monthEntries(month, detail.days);
  const readOnly = detail.habit.status !== 'shelf';
  const openEntry = open ? detail.days[open.index] : undefined;

  const onSwipe = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setShown(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  const openDay = (index: number) => {
    setError(null);
    setOpen({ kind: 'day', index });
  };

  async function toggleRelapse(date: LocalDate) {
    const result = await tracker.toggleRelapse(id, date);
    setError(result.ok ? null : toggleRelapseErrorMessage[result.error]);
    await reload();
  }

  return (
    <Screen
      scroll
      overlay={
        <>
          {open?.kind === 'day' && openEntry && (
            <DaySheet
              day={openEntry}
              today={today}
              error={error}
              onWrite={readOnly ? undefined : () => setOpen({ kind: 'note', index: open.index })}
              onToggleRelapse={readOnly ? undefined : () => void toggleRelapse(openEntry.date)}
              onClose={() => setOpen(null)}
            />
          )}
          {open?.kind === 'note' && openEntry && (
            <NoteSheet
              habitId={id}
              date={openEntry.date}
              dayNumber={openEntry.index + 1}
              initial={openEntry.note}
              mode="edit"
              onClose={() => setOpen({ kind: 'day', index: open.index })}
              onDone={() => {
                setOpen({ kind: 'day', index: open.index });
                void reload();
              }}
            />
          )}
        </>
      }
    >
      <TopBar
        backLabel={detail.habit.name}
        onBack={navigation.goBack}
        right={days(detail.stats.totalDays)}
      />
      <Text style={styles.title}>Journal</Text>
      <FlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={months}
        keyExtractor={(item) => item}
        initialScrollIndex={initial}
        getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
        onMomentumScrollEnd={onSwipe}
        renderItem={({ item }) => (
          <MonthCalendar
            month={item}
            weeks={monthCalendar(item, detail.days, today)}
            width={pageWidth}
            onPressDay={(day) => day.entry && openDay(day.entry.index)}
          />
        )}
      />
      <Text style={styles.legend}>
        Vert : jour tenu. Orange : rechute. Point rose : une note.
        {months.length > 1 ? ' Glisse pour changer de mois.' : ''} Touche un jour pour
        l&apos;ouvrir.
      </Text>

      {entries.length === 0 && <Text style={styles.legend}>Ni note ni rechute ce mois-ci.</Text>}
      {entries.map((day) => (
        <Pressable
          key={day.date}
          accessibilityRole="button"
          accessibilityHint="Ouvrir ce jour"
          onPress={() => openDay(day.index)}
          style={[styles.note, day.relapsed && styles.relapseNote]}
        >
          <NumberText style={styles.noteTitle}>
            {`Jour ${day.index + 1} · ${dayMonth(day.date, today)}${day.relapsed ? ' · rechute' : ''}`}
          </NumberText>
          {day.note?.mood && <Text style={styles.noteMood}>{MOOD_LABELS[day.note.mood]}</Text>}
          {day.note?.text ? <Text style={styles.noteText}>{day.note.text}</Text> : null}
        </Pressable>
      ))}
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
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
