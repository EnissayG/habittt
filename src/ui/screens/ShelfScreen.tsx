import { useCallback } from 'react';
import {
  PixelRatio,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROOM_SIZE, type ScenePixel, type Shelf, type WindowView } from '../../domain';
import { Button } from '../components/Button';
import { PixelIcon } from '../components/PixelIcon';
import { days } from '../format';
import type { ScreenProps } from '../navigation/types';
import type { RowWindow } from '../plant/colorRuns';
import { PixelCanvas } from '../plant/PixelCanvas';
import { PlantPixels } from '../plant/PlantCanvas';
import { buildShelfRows, type ShelfRowView, type SlotView } from '../shelf/shelfRows';
import { sceneColor } from '../theme/scenePalette';
import { colors, fonts, spacing } from '../theme/tokens';
import { useTracker } from '../TrackerContext';
import { useScreenData } from '../useLoader';

/** Screen 2: the shelf, a place rather than a list. */
export function ShelfScreen({ navigation }: ScreenProps<'Shelf'>) {
  const tracker = useTracker();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const load = useCallback(() => tracker.getShelf(), [tracker]);
  const { data: shelf } = useScreenData(load);

  // One sharp scale for the whole room: three plants across the screen.
  const ratio = PixelRatio.get();
  const cell = Math.max(1, Math.floor((width * ratio) / ROOM_SIZE.width)) / ratio;
  const floorHeight = ROOM_SIZE.height * cell;

  if (!shelf) return <View style={styles.screen} />;

  const openHabit = (id: string) => navigation.navigate('Habit', { id });
  const newHabit = () => navigation.navigate('NewHabitName');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>habittt</Text>
          <Text style={styles.subtitle}>
            {shelf.totals.plants} {shelf.totals.plants > 1 ? 'plantes' : 'plante'} ·{' '}
            {days(shelf.totals.cleanDays)} {shelf.totals.cleanDays > 1 ? 'gagnés' : 'gagné'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Réglages"
          hitSlop={12}
          onPress={() => navigation.navigate('Settings')}
        >
          <PixelIcon name="gear" size={21} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.wall, { paddingBottom: floorHeight + spacing.md }]}
      >
        {buildShelfRows(shelf).map((row, i) => (
          <ShelfRow
            key={`${row.kind}-${i}`}
            row={row}
            cell={cell}
            shelf={shelf}
            onOpen={openHabit}
            onNew={newHabit}
          />
        ))}
        {__DEV__ && (
          <Button label="Labo (dev)" variant="quiet" onPress={() => navigation.navigate('Lab')} />
        )}
      </ScrollView>

      <View style={[styles.floor, { height: floorHeight }]} pointerEvents="none">
        <SceneCanvas image={shelf.room} view={shelf.view} cell={cell} />
      </View>
    </View>
  );
}

interface ShelfRowProps {
  row: ShelfRowView;
  cell: number;
  shelf: Shelf;
  onOpen: (id: string) => void;
  onNew: () => void;
}

function ShelfRow({ row, cell, shelf, onOpen, onNew }: ShelfRowProps) {
  const slotWidth = (ROOM_SIZE.width / 3) * cell;
  return (
    <View>
      <View style={styles.row}>
        {row.slots.map((slot, i) => (
          <SlotPixels
            key={i}
            slot={slot}
            row={row}
            view={shelf.view}
            cell={cell}
            onOpen={onOpen}
            onNew={onNew}
          />
        ))}
        {row.kind === 'window' && (
          <View style={{ marginLeft: row.slots.length === 0 ? slotWidth : 0 }}>
            <SceneCanvas image={shelf.window} view={shelf.view} cell={cell} />
          </View>
        )}
      </View>
      <View style={styles.row}>
        {row.slots.map((slot, i) => (
          <SlotLabel key={i} slot={slot} width={slotWidth} />
        ))}
      </View>
    </View>
  );
}

interface SlotPixelsProps {
  slot: SlotView;
  row: ShelfRowView;
  view: WindowView;
  cell: number;
  onOpen: (id: string) => void;
  onNew: () => void;
}

function SlotPixels({ slot, row, view, cell, onOpen, onNew }: SlotPixelsProps) {
  if (slot.kind === 'plant') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${slot.name}, ${days(slot.streak)}`}
        onPress={() => onOpen(slot.id)}
      >
        <PlantPixels image={slot.image} cellSize={cell} rows={row.rows} />
      </Pressable>
    );
  }
  const art = <SceneCanvas image={slot.art} view={view} cell={cell} rows={row.rows} />;
  if (slot.kind === 'new') {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel="Nouvelle habitude" onPress={onNew}>
        {art}
      </Pressable>
    );
  }
  return art;
}

function SlotLabel({ slot, width }: { slot: SlotView; width: number }) {
  if (slot.kind === 'empty') return <View style={{ width }} />;
  const plant = slot.kind === 'plant';
  return (
    <View style={[styles.label, { width }]}>
      <Text style={[styles.name, !plant && styles.newName]} numberOfLines={2}>
        {plant ? slot.name : 'Nouvelle'}
      </Text>
      <Text style={styles.small}>{plant ? `${slot.streak} j` : 'habitude'}</Text>
    </View>
  );
}

function SceneCanvas({
  image,
  view,
  cell,
  rows,
}: {
  image: Shelf['window'];
  view: WindowView;
  cell: number;
  rows?: RowWindow;
}) {
  const colorOf = useCallback((pixel: ScenePixel) => sceneColor(pixel, view), [view]);
  return <PixelCanvas grid={image} colorOf={colorOf} cellSize={cell} rows={rows} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  logo: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.text, lineHeight: 32 },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  wall: { alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row' },
  label: { alignItems: 'center', paddingTop: 4, paddingHorizontal: 2 },
  name: { fontFamily: fonts.display, fontSize: 13, color: colors.text, textAlign: 'center' },
  newName: { color: colors.muted },
  small: { fontFamily: fonts.display, fontSize: 12, color: colors.muted },
  floor: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
});
