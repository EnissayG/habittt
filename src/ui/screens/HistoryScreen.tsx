import { useCallback, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';

import type { LocalDate } from '../../domain';
import { DayGrid } from '../components/DayGrid';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { days } from '../format';
import { toggleRelapseErrorMessage } from '../messages';
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

  if (!detail) return <Screen>{null}</Screen>;

  async function toggle(date: LocalDate) {
    const result = await tracker.toggleRelapse(id, date);
    setError(result.ok ? null : toggleRelapseErrorMessage[result.error]);
    await reload();
  }

  return (
    <Screen scroll>
      <TopBar
        backLabel={detail.habit.name}
        onBack={navigation.goBack}
        right={days(detail.stats.totalDays)}
      />
      <Text style={styles.title}>Historique</Text>
      <DayGrid days={detail.days} width={width - 28} onPressDay={toggle} />
      <Text style={styles.legend}>
        Vert : jour tenu. Orange : rechute. Touche un jour pour corriger.
      </Text>
      {error && <Text style={styles.legend}>{error}</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  legend: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, lineHeight: 17 },
});
