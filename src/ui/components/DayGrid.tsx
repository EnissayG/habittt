import { Pressable, StyleSheet, View } from 'react-native';

import type { DayEntry, LocalDate } from '../../domain';
import { dayMonth } from '../format';
import { colors } from '../theme/tokens';

export const DAY_GRID_COLUMNS = 15;
const GAP = 3;

interface DayGridProps {
  days: readonly DayEntry[];
  /** Width available, in points. */
  width: number;
  onPressDay: (date: LocalDate) => void;
}

/**
 * One square per day since the start, oldest first, 15 per row: green for a
 * day held, orange for a relapse, today framed. Touching a day corrects it.
 */
export function DayGrid({ days, width, onPressDay }: DayGridProps) {
  const size = Math.floor((width - GAP * (DAY_GRID_COLUMNS - 1)) / DAY_GRID_COLUMNS);
  const lastIndex = days.length - 1;
  return (
    <View style={styles.grid}>
      {days.map((day) => (
        <Pressable
          key={day.date}
          accessibilityRole="button"
          accessibilityLabel={`Jour ${day.index + 1}, ${dayMonth(day.date)}${day.relapsed ? ', rechute' : ''}`}
          onPress={() => onPressDay(day.date)}
          hitSlop={1}
          style={[
            { width: size, height: size },
            { backgroundColor: day.relapsed ? colors.relapse : colors.clean },
            day.index === lastIndex && styles.today,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  today: { borderWidth: 2, borderColor: colors.strong },
});
