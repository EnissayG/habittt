import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MeditationCalendarDay, MonthId } from '../../domain';
import { NumberText } from '../components/NumberText';
import { dayMonth, monthTitle } from '../format';
import { useThemedStyles } from '../theme/ThemeContext';
import { fonts, type Palette } from '../theme/tokens';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const GAP = 4;

interface MeditationCalendarProps {
  month: MonthId;
  weeks: (MeditationCalendarDay | null)[][];
  width: number;
  /** null: no older month to show, or no newer one. */
  onPrevious: (() => void) | null;
  onNext: (() => void) | null;
}

/**
 * One month of meditation (ADR 0022): a green square for each day
 * meditated, today framed. A day without meditation is simply left plain:
 * nothing marks it as missed.
 */
export function MeditationCalendar({
  month,
  weeks,
  width,
  onPrevious,
  onNext,
}: MeditationCalendarProps) {
  const styles = useThemedStyles(makeStyles);
  const size = Math.floor((width - GAP * 6) / 7);
  return (
    <View style={{ width, gap: GAP }}>
      <View style={styles.header}>
        <Arrow label="‹" hint="Mois précédent" onPress={onPrevious} />
        <NumberText style={styles.title}>{monthTitle(month)}</NumberText>
        <Arrow label="›" hint="Mois suivant" onPress={onNext} />
      </View>
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
            <Cell key={i} day={day} size={size} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Arrow({
  label,
  hint,
  onPress,
}: {
  label: string;
  hint: string;
  onPress: (() => void) | null;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      hitSlop={12}
      onPress={onPress ?? undefined}
      style={[styles.arrow, !onPress && styles.hidden]}
    >
      <Text style={styles.arrowLabel}>{label}</Text>
    </Pressable>
  );
}

function Cell({ day, size }: { day: MeditationCalendarDay | null; size: number }) {
  const styles = useThemedStyles(makeStyles);
  const box = { width: size, height: size };
  if (!day) return <View style={box} />;
  const label = `${dayMonth(day.date, day.date)}${
    day.entry ? `, ${day.entry.minutes} minutes de méditation` : ''
  }${day.today ? ", aujourd'hui" : ''}`;
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[box, styles.cell, day.entry && styles.meditated, day.today && styles.today]}
    >
      <NumberText
        style={[styles.number, day.entry ? styles.onMeditated : day.future && styles.future]}
        allowFontScaling={false}
      >
        {String(day.dayOfMonth)}
      </NumberText>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontFamily: fonts.display, fontSize: 17, color: colors.text },
    arrow: { paddingHorizontal: 8 },
    arrowLabel: { fontFamily: fonts.display, fontSize: 20, color: colors.text },
    hidden: { opacity: 0 },
    row: { flexDirection: 'row', gap: GAP },
    weekday: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textAlign: 'center' },
    cell: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    meditated: { backgroundColor: colors.clean },
    today: { borderWidth: 2, borderColor: colors.text },
    number: { fontFamily: fonts.display, fontSize: 12, color: colors.text },
    onMeditated: { color: colors.onAccent },
    future: { color: colors.muted },
  });
