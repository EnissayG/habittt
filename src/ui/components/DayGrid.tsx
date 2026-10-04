import { Pressable, StyleSheet, View } from 'react-native';

import type { DayEntry, LocalDate } from '../../domain';
import { colors } from '../theme/tokens';

interface DayGridProps {
  days: readonly DayEntry[];
  onPressDay: (date: LocalDate) => void;
}

/**
 * One square per day since the start, oldest first. Temporary stand-in for
 * the pixel-art plant: each square is the future "cell" of its day.
 */
export function DayGrid({ days, onPressDay }: DayGridProps) {
  const lastIndex = days.length - 1;
  return (
    <View style={styles.grid}>
      {days.map((day) => (
        <Pressable
          key={day.date}
          accessibilityLabel={`${day.date}${day.relapsed ? ', rechute' : ''}`}
          onPress={() => onPressDay(day.date)}
          hitSlop={2}
          style={[
            styles.cell,
            { backgroundColor: day.relapsed ? colors.relapse : colors.clean },
            day.index === lastIndex && styles.today,
          ]}
        />
      ))}
    </View>
  );
}

const CELL = 28;

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { width: CELL, height: CELL, borderRadius: 2 },
  today: { borderWidth: 3, borderColor: colors.text },
});
