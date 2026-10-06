import { Canvas, Group, Picture } from '@shopify/react-native-skia';
import { useCallback, useMemo, useState } from 'react';
import {
  PixelRatio,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  composeRoom,
  drawFloor,
  planRoom,
  PLANT_GRID,
  type PlacedItem,
  type ScenePixel,
  type Shelf,
  type WallPlan,
  type WindowView,
} from '../../domain';
import { PixelIcon } from '../components/PixelIcon';
import { days } from '../format';
import type { ScreenProps } from '../navigation/types';
import type { RowWindow } from '../plant/colorRuns';
import { PixelCanvas } from '../plant/PixelCanvas';
import { PlantPixels } from '../plant/PlantCanvas';
import { fitRoom, type RoomFit } from '../shelf/fitRoom';
import { scenePicture } from '../shelf/scenePicture';
import { sceneColor } from '../theme/scenePalette';
import { colors, fonts, spacing } from '../theme/tokens';
import { useTracker } from '../TrackerContext';
import { useScreenData } from '../useLoader';

// Text sizes are fixed so the room can be planned in whole cells; large
// accessibility sizes are allowed up to this factor.
const MAX_FONT_SCALE = 1.3;
const NAME_LINE = 16;
const COUNT_LINE = 15;
const LABEL_TOP = 3;
const LABEL_GAP = 6;
const LOGO_LINE = 32;
const SUBTITLE_LINE = 16;
const DOTS_HEIGHT = 24;

/**
 * Screen 2: the shelf, a room seen one wall at a time. It fills the screen
 * edge to edge; the only gesture is a horizontal swipe from wall to wall.
 */
export function ShelfScreen({ navigation }: ScreenProps<'Shelf'>) {
  const tracker = useTracker();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const load = useCallback(() => tracker.getShelf(), [tracker]);
  const { data: shelf } = useScreenData(load);
  const [page, setPage] = useState(0);

  const fontScale = Math.min(PixelRatio.getFontScale(), MAX_FONT_SCALE);
  const headerHeight = spacing.sm * 2 + LOGO_LINE + SUBTITLE_LINE * fontScale;

  const fit = useMemo(() => {
    if (!shelf) return null;
    const plants = Object.fromEntries(
      Object.entries(shelf.habits).map(([id, summary]) => [id, summary.plant]),
    );
    return fitRoom({
      screen: { width, height },
      pixelRatio: PixelRatio.get(),
      insets: { top: insets.top, bottom: insets.bottom },
      headerHeight,
      labelHeight: LABEL_TOP + (NAME_LINE + COUNT_LINE) * fontScale + LABEL_GAP,
      dotsHeight: DOTS_HEIGHT,
      plan: (geometry) =>
        planRoom({ layout: shelf.layout, plants, window: shelf.window, ...geometry }),
    });
  }, [shelf, width, height, insets.top, insets.bottom, headerHeight, fontScale]);

  const floor = useMemo(
    () => fit && drawFloor({ room: composeRoom(fit.plan), rows: fit.floorRows }),
    [fit],
  );
  const picture = useMemo(
    () => (floor && fit && shelf ? scenePicture(floor, shelf.view, fit.cell) : null),
    [floor, fit, shelf],
  );

  if (!shelf || !fit || !picture) return <View style={styles.screen} />;

  const walls = fit.plan.walls;
  const current = Math.min(page, walls.length - 1);
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(event.nativeEvent.contentOffset.x / width));

  return (
    <View style={styles.screen}>
      <ScrollView
        horizontal
        pagingEnabled
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {walls.map((wall) => (
          <WallPage
            key={wall.wall.index}
            wall={wall}
            fit={fit}
            shelf={shelf}
            width={width}
            height={height}
            floor={picture}
            onOpen={(id) => navigation.navigate('Habit', { id })}
            onNew={() => navigation.navigate('NewHabitName')}
          />
        ))}
      </ScrollView>

      <View style={[styles.header, { top: insets.top }]}>
        <View>
          <Text style={styles.logo} maxFontSizeMultiplier={1}>
            habittt
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {shelf.totals.plants} {shelf.totals.plants > 1 ? 'plantes' : 'plante'} ·{' '}
            {days(shelf.totals.cleanDays)} {shelf.totals.cleanDays > 1 ? 'gagnés' : 'gagné'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {__DEV__ && (
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => navigation.navigate('Lab')}
            >
              <Text style={styles.subtitle}>Labo</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Réglages"
            hitSlop={12}
            onPress={() => navigation.navigate('Settings')}
          >
            <PixelIcon name="gear" size={21} />
          </Pressable>
        </View>
      </View>

      {walls.length > 1 && (
        <View
          style={[styles.dots, { bottom: insets.bottom + spacing.sm, gap: 2 * fit.cell }]}
          pointerEvents="none"
          accessible
          accessibilityLabel={`Mur ${current + 1} sur ${walls.length}`}
        >
          {walls.map((wall, i) => (
            <View
              key={wall.wall.index}
              style={{
                width: (i === current ? 4 : 2) * fit.cell,
                height: 2 * fit.cell,
                backgroundColor: i === current ? colors.onFloor : colors.onFloorMuted,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

interface WallPageProps {
  wall: WallPlan;
  fit: RoomFit;
  shelf: Shelf;
  width: number;
  height: number;
  floor: ReturnType<typeof scenePicture>;
  onOpen: (id: string) => void;
  onNew: () => void;
}

/** One wall, one screen wide: its items and labels, and its part of the floor. */
function WallPage({ wall, fit, shelf, width, height, floor, onOpen, onNew }: WallPageProps) {
  const { cell } = fit;
  const origin = wall.wall.index * width;
  const left = (placed: PlacedItem) => placed.x * cell - origin;
  const top = (placed: PlacedItem) => fit.roomTop + placed.y * cell;
  const bandHeight = (placed: PlacedItem) => placed.rows.to - placed.rows.from;

  return (
    <View style={{ width, height }}>
      <Canvas
        style={[styles.floor, { top: fit.floorTop, width, height: height - fit.floorTop }]}
        pointerEvents="none"
      >
        <Group transform={[{ translateX: -origin }]}>
          <Picture picture={floor} />
        </Group>
      </Canvas>

      {wall.items.map((placed, i) => (
        <View key={`item-${i}`} style={[styles.placed, { left: left(placed), top: top(placed) }]}>
          <Item placed={placed} shelf={shelf} cell={cell} onOpen={onOpen} onNew={onNew} />
        </View>
      ))}

      {wall.items
        .filter((placed) => placed.labelled)
        .map((placed, i) => (
          <View
            key={`label-${i}`}
            style={[
              styles.label,
              {
                left: left(placed),
                top: top(placed) + bandHeight(placed) * cell,
                width: PLANT_GRID.width * cell,
              },
            ]}
            pointerEvents="none"
          >
            <Label placed={placed} shelf={shelf} />
          </View>
        ))}
    </View>
  );
}

interface ItemProps {
  placed: PlacedItem;
  shelf: Shelf;
  cell: number;
  onOpen: (id: string) => void;
  onNew: () => void;
}

function Item({ placed, shelf, cell, onOpen, onNew }: ItemProps) {
  const { content, rows } = placed;
  switch (content.kind) {
    case 'plant': {
      const summary = shelf.habits[content.id]!;
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${summary.habit.name}, ${days(summary.stats.currentStreak)}`}
          onPress={() => onOpen(content.id)}
        >
          <PlantPixels image={content.image} cellSize={cell} rows={rows} />
        </Pressable>
      );
    }
    case 'window':
      return <SceneCanvas image={content.image} view={shelf.view} cell={cell} rows={rows} />;
    case 'slot': {
      const art = <SceneCanvas image={content.image} view={shelf.view} cell={cell} rows={rows} />;
      if (content.slot !== 'new') return art;
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nouvelle habitude"
          onPress={onNew}
        >
          {art}
        </Pressable>
      );
    }
  }
}

function Label({ placed, shelf }: { placed: PlacedItem; shelf: Shelf }) {
  const plant = placed.content.kind === 'plant' ? shelf.habits[placed.content.id] : undefined;
  return (
    <>
      <Text
        style={[styles.name, !plant && styles.newName]}
        numberOfLines={1}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
      >
        {plant ? plant.habit.name : 'Nouvelle'}
      </Text>
      <Text style={styles.small} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {plant ? `${plant.stats.currentStreak} j` : 'habitude'}
      </Text>
    </>
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
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.text, lineHeight: LOGO_LINE },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    lineHeight: SUBTITLE_LINE,
  },
  floor: { position: 'absolute', left: 0 },
  placed: { position: 'absolute' },
  label: {
    position: 'absolute',
    alignItems: 'center',
    paddingTop: LABEL_TOP,
    paddingHorizontal: 2,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 13,
    lineHeight: NAME_LINE,
    color: colors.text,
    textAlign: 'center',
  },
  newName: { color: colors.muted },
  small: { fontFamily: fonts.display, fontSize: 12, lineHeight: COUNT_LINE, color: colors.muted },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: DOTS_HEIGHT,
  },
});
