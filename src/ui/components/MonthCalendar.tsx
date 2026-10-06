import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CalendarDay, MonthId } from '../../domain';
import { dayMonth, monthTitle } from '../format';
import { colors, fonts } from '../theme/tokens';
import { NumberText } from './NumberText';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const GAP = 4;

interface MonthCalendarProps {
  month: MonthId;
  weeks: (CalendarDay | null)[][];
  /** Width of the calendar, in points. */
  width: number;
  onPressDay: (day: CalendarDay) => void;
}

/**
 * One month of the journal: green for a day held, orange for a relapse, a
 * pink dot for a day with a note, today framed in the text color. Days
 * outside the habit's period are left empty.
 */
export function MonthCalendar({ month, weeks, width, onPressDay }: MonthCalendarProps) {
  const size = Math.floor((width - GAP * 6) / 7);
  return (
    <View style={{ width, gap: GAP }}>
      <NumberText style={styles.title}>{monthTitle(month)}</NumberText>
      <View style={styles.row}>
        {WEEKDAYS.map((name, i) => (
          <Text key={i} style={[styles.weekday, { width: size }]}>
            {name}
          </Text>
        ))}
      </View>
      {weeks.map((week, w) => (
        <View key={w} style={styles.row}>
          {week.map((day, i) => (
            <Cell key={i} day={day} size={size} onPress={onPressDay} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Cell({
  day,
  size,
  onPress,
}: {
  day: CalendarDay | null;
  size: number;
  onPress: (day: CalendarDay) => void;
}) {
  const box = { width: size, height: size };
  const entry = day?.entry;
  if (!day || !entry) {
    return <View style={[box, day?.today && styles.today]} />;
  }
  const facts = [
    entry.relapsed ? 'rechute' : 'jour tenu',
    entry.note ? 'une note' : null,
    day.today ? "aujourd'hui" : null,
  ].filter(Boolean);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dayMonth(day.date, day.date)}, ${facts.join(', ')}`}
      onPress={() => onPress(day)}
      style={[
        box,
        styles.cell,
        entry.relapsed ? styles.relapse : styles.clean,
        day.today && styles.today,
      ]}
    >
      <NumberText
        style={[styles.number, entry.relapsed ? styles.onRelapse : styles.onClean]}
        allowFontScaling={false}
      >
        {String(day.dayOfMonth)}
      </NumberText>
      {entry.note && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 17, color: colors.text },
  row: { flexDirection: 'row', gap: GAP },
  weekday: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textAlign: 'center' },
  cell: { alignItems: 'center', justifyContent: 'center' },
  clean: { backgroundColor: colors.clean },
  relapse: { backgroundColor: colors.relapse },
  today: { borderWidth: 2, borderColor: colors.text },
  number: { fontFamily: fonts.display, fontSize: 12 },
  onClean: { color: colors.onAccent },
  onRelapse: { color: colors.onRelapse },
  dot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    backgroundColor: colors.note,
    borderWidth: 1,
    borderColor: colors.background,
  },
});
