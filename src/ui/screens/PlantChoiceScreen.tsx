import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  MAX_GROWTH_DAYS,
  PLANT_GRID,
  renderPlant,
  SPECIES_IDS,
  usedRows,
  type SpeciesId,
} from '../../domain';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { createHabitErrorMessage } from '../messages';
import type { ScreenProps } from '../navigation/types';
import { SPECIES_LABELS } from '../plant/labels';
import { PixelCanvas } from '../plant/PixelCanvas';
import { PlantPixels } from '../plant/PlantCanvas';
import { diceArt } from '../plant/slotArt';
import { colors, fonts } from '../theme/tokens';
import { useTracker } from '../TrackerContext';

/** Order of the tiles (the mockup's first, then the others). */
const TILE_ORDER: readonly SpeciesId[] = [
  'bonsai',
  'monstera',
  'cactus',
  'calathea',
  'ficus',
  'bamboo',
  'sansevieria',
  'fern',
  'pothos',
  'pearls',
  'spider',
  'aloe',
  'jade',
];

/** Seeds that make a nice grown example of each species (mockup's when given). */
const SHOWCASE_SEEDS: Partial<Record<SpeciesId, number>> = {
  bonsai: 3,
  monstera: 1,
  cactus: 100,
  calathea: 137,
  ficus: 174,
  bamboo: 100,
  sansevieria: 211,
  fern: 174,
};

type Choice = SpeciesId | 'surprise';
const COLUMNS = 3;
const GAP = 6;

/** Screen 4: choose the plant, shown grown up. */
export function PlantChoiceScreen({ navigation, route }: ScreenProps<'PlantChoice'>) {
  const tracker = useTracker();
  const { width } = useWindowDimensions();
  const [choice, setChoice] = useState<Choice>('bonsai');
  const [error, setError] = useState<string | null>(null);
  const [planting, setPlanting] = useState(false);

  // Every species of the registry, in the mockup's order first.
  const species = useMemo(
    () => [...TILE_ORDER, ...SPECIES_IDS.filter((id) => !TILE_ORDER.includes(id))],
    [],
  );
  const tiles = useMemo(
    () =>
      species.map((id) => ({
        id,
        image: renderPlant({
          species: id,
          seed: SHOWCASE_SEEDS[id] ?? 42,
          elapsedDays: MAX_GROWTH_DAYS,
          relapseDays: [],
        }),
      })),
    [species],
  );
  const dice = useMemo(() => diceArt(), []);
  const artColor = useCallback((color: string) => color, []);

  // Same band of rows for every tile: from the tallest plant down to the pot.
  const band = useMemo(
    () => ({ from: Math.min(...tiles.map((t) => usedRows(t.image).top)), to: PLANT_GRID.height }),
    [tiles],
  );
  const tileWidth = (width - 28 - GAP * (COLUMNS - 1)) / COLUMNS;
  const ratio = PixelRatio.get();
  const cell = Math.max(1, Math.floor(((tileWidth - 8) * ratio) / PLANT_GRID.width)) / ratio;

  async function plant() {
    setPlanting(true);
    const result = await tracker.addHabit({
      name: route.params.name,
      startDate: route.params.startDate,
      species: choice === 'surprise' ? undefined : choice,
    });
    setPlanting(false);
    if (!result.ok) {
      setError(createHabitErrorMessage[result.error]);
      return;
    }
    navigation.reset({
      index: 1,
      routes: [{ name: 'Shelf' }, { name: 'Habit', params: { id: result.value.id } }],
    });
  }

  const tile = (key: Choice, label: string, content: ReactNode) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityState={{ selected: choice === key }}
      accessibilityLabel={label}
      onPress={() => setChoice(key)}
      style={[styles.tile, { width: tileWidth }, choice === key && styles.selected]}
    >
      {content}
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );

  return (
    <Screen
      scroll
      footer={
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Planter" onPress={plant} disabled={planting} />
        </>
      }
    >
      <TopBar backLabel="retour" onBack={navigation.goBack} right="2 / 2" />
      <Text style={styles.title}>Choisis ta plante</Text>
      <View style={styles.tiles}>
        {tiles.map(({ id, image }) =>
          tile(id, SPECIES_LABELS[id], <PlantPixels image={image} cellSize={cell} rows={band} />),
        )}
        {tile(
          'surprise',
          'Surprise',
          <PixelCanvas grid={dice} colorOf={artColor} cellSize={cell} rows={band} />,
        )}
      </View>
      <Text style={styles.help}>
        La variété, le pot et les couleurs dépendent de ta graine. Tu les découvriras en la
        regardant pousser.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: {
    borderWidth: 2,
    borderColor: colors.line,
    paddingTop: 2,
    paddingBottom: 4,
    alignItems: 'center',
  },
  selected: { borderColor: colors.strong },
  tileLabel: { fontFamily: fonts.display, fontSize: 11, color: colors.text, textAlign: 'center' },
  help: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
});
