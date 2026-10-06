import { useCallback, useState } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { usedRows } from '../../domain';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { PixelIcon } from '../components/PixelIcon';
import { Screen } from '../components/Screen';
import { Sheet } from '../components/Sheet';
import { TopBar } from '../components/TopBar';
import { dayMonth, lowerFirst } from '../format';
import { RelapseSheet } from '../habit/RelapseSheet';
import type { ScreenProps } from '../navigation/types';
import { describePlant } from '../plant/labels';
import { PlantPixels } from '../plant/PlantCanvas';
import { pixelScale } from '../plant/pixelScale';
import { colors, fonts, spacing } from '../theme/tokens';
import { useTracker } from '../TrackerContext';
import { useScreenData } from '../useLoader';

/** Height the counter needs (big number and its label), in points. */
const COUNTER_HEIGHT = 74;

type OpenSheet = 'menu' | 'water' | 'relapse' | null;

/** Screen 5: one habit. The plant is the main element. */
export function HabitScreen({ navigation, route }: ScreenProps<'Habit'>) {
  const { id } = route.params;
  const tracker = useTracker();
  const { width, height } = useWindowDimensions();
  const load = useCallback(() => tracker.getHabit(id), [tracker, id]);
  const { data: detail, reload } = useScreenData(load);
  const [sheet, setSheet] = useState<OpenSheet>(null);

  if (!detail) return <Screen>{null}</Screen>;

  const { habit, stats, plant } = detail;
  const sceneWidth = width - 28;
  const scale = pixelScale(plant, { width: sceneWidth, height: height * 0.5 }, PixelRatio.get());

  // The counter sits in the empty space above the plant when there is room,
  // otherwise above the image.
  const freeAbove = usedRows(plant).top * scale.cellSize;
  const counterInside = freeAbove >= COUNTER_HEIGHT;
  const counter = (
    <View style={counterInside ? styles.counterOverlay : undefined}>
      <Text style={styles.count}>{stats.currentStreak}</Text>
      <Text style={styles.countLabel}>
        {stats.currentStreak > 1 ? 'jours' : 'jour'} sans {lowerFirst(habit.name)}
      </Text>
    </View>
  );

  return (
    <Screen
      scroll
      footer={
        <>
          <Button label="Arroser et écrire une note" onPress={() => setSheet('water')} />
          <Button label="J'ai rechuté" variant="quiet" onPress={() => setSheet('relapse')} />
        </>
      }
    >
      <TopBar
        backLabel="étagère"
        onBack={navigation.goBack}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu"
            hitSlop={12}
            onPress={() => setSheet('menu')}
          >
            <PixelIcon name="dots" size={21} />
          </Pressable>
        }
      />

      {!counterInside && counter}
      <View style={styles.scene}>
        <PlantPixels image={plant} cellSize={scale.cellSize} />
        {counterInside && counter}
      </View>

      <View>
        <Text style={styles.name}>{habit.name}</Text>
        <Text style={styles.traits}>{describePlant(plant)}</Text>
      </View>
      <View style={styles.chips}>
        <Chip label={`record ${stats.longestStreak} j`} />
        <Chip label={`depuis le ${dayMonth(habit.startDate)}`} />
      </View>

      <Sheet visible={sheet === 'menu'} onClose={() => setSheet(null)}>
        <Button
          label="Historique"
          variant="alt"
          onPress={() => {
            setSheet(null);
            navigation.navigate('History', { id });
          }}
        />
        <Button label="Fermer" variant="quiet" onPress={() => setSheet(null)} />
      </Sheet>

      <Sheet visible={sheet === 'water'} onClose={() => setSheet(null)}>
        <View style={styles.sheetTitle}>
          <PixelIcon name="drop" size={19} />
          <Text style={styles.sheetTitleText}>Arroser et écrire une note</Text>
        </View>
        <Text style={styles.body}>
          Bientôt : tu pourras arroser ta plante et écrire une note pour ce jour. Écrire restera
          toujours facultatif.
        </Text>
        <Button label="D'accord" variant="alt" onPress={() => setSheet(null)} />
      </Sheet>

      <RelapseSheet
        habitId={id}
        startDate={habit.startDate}
        visible={sheet === 'relapse'}
        onClose={() => setSheet(null)}
        onRecorded={() => void reload()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scene: { alignItems: 'center' },
  counterOverlay: { position: 'absolute', left: 0, top: 0 },
  count: { fontFamily: fonts.displayBold, fontSize: 52, color: colors.text, lineHeight: 52 },
  countLabel: { fontFamily: fonts.display, fontSize: 14, color: colors.text },
  name: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  traits: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sheetTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sheetTitleText: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 18 },
});
