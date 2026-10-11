import { Canvas, Group, Picture, type SkPicture } from '@shopify/react-native-skia';
import { memo, useCallback, useMemo, useState } from 'react';
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
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  composeRoom,
  drawFloor,
  drawFloorBoards,
  drawFloorItems,
  planRoom,
  PLANT_GRID,
  drawWindow,
  type PlacedItem,
  type RoomSource,
  type Shelf,
  type WallPlan,
  type WindowView,
} from '../../domain';
import { NumberText } from '../components/NumberText';
import { PixelIcon } from '../components/PixelIcon';
import { days } from '../format';
import type { ScreenProps } from '../navigation/types';
import { fitRoom, type RoomFit } from '../shelf/fitRoom';
import { floorMirror } from '../shelf/floorMirror';
import { floorPicture, mirrorImage, scenePicture, wallPicture } from '../shelf/scenePicture';
import { roomColor } from '../theme/scenePalette';
import { colors, fonts, spacing } from '../theme/tokens';
import { useTracker } from '../TrackerContext';
import { useScreenData } from '../useLoader';
import { useWindowClock } from '../useWindowClock';

// Text sizes are fixed so the room can be planned in whole cells; large
// accessibility sizes are allowed up to this factor.
const MAX_FONT_SCALE = 1.3;
const COUNT_LINE = 22;
const NAME_LINE = 15;
const LABEL_TOP = 3;
const LABEL_GAP = 6;
const LOGO_LINE = 32;
const SUBTITLE_LINE = 16;
const DOTS_HEIGHT = 24;

/**
 * Screen 2: the shelf, a room seen one wall at a time. It fills the screen
 * edge to edge; the only gesture is a horizontal scroll through the room,
 * free with its natural deceleration, that settles on the nearest wall.
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

  const view = shelf?.view;
  // The floor of the whole room, recorded once: its reflection is one image
  // laid over the boards (see floorMirror).
  const picture = useMemo(() => {
    if (!fit || !view) return null;
    const { plan, floorRows: rows, cell } = fit;
    const room = composeRoom(plan);
    const mirror = mirrorImage(
      floorMirror(room, rows, (source: RoomSource | null) => roomColor(source, view)),
    );
    // Skia could not make the image: the same floor, one shape per color.
    if (!mirror) {
      return scenePicture(drawFloor({ room, rows, items: plan.floorItems }), view, cell);
    }
    return floorPicture(
      drawFloorBoards(plan.width, rows),
      mirror,
      drawFloorItems(plan.width, rows, plan.floorItems),
      view,
      cell,
    );
  }, [fit, view]);

  // Stable, so that the walls (memoized) do not redraw when the dots move.
  const onOpen = useCallback((id: string) => navigation.navigate('Habit', { id }), [navigation]);
  const onNew = useCallback(() => navigation.navigate('NewHabitName'), [navigation]);
  const onRetire = useCallback((id: string) => navigation.navigate('Retire', { id }), [navigation]);

  if (!shelf || !fit || !picture) return <View style={styles.screen} />;

  const walls = fit.plan.walls;
  const current = Math.min(page, walls.length - 1);
  // The dots follow the scroll: the wall that fills most of the screen.
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(event.nativeEvent.contentOffset.x / width));

  return (
    <View style={styles.screen}>
      <ScrollView
        horizontal
        snapToInterval={width}
        snapToAlignment="start"
        decelerationRate="normal"
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={onScroll}
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
            onOpen={onOpen}
            onNew={onNew}
            onRetire={onRetire}
          />
        ))}
      </ScrollView>

      <View style={[styles.header, { top: insets.top }]}>
        <View>
          <Text style={styles.logo} maxFontSizeMultiplier={1}>
            habittt
          </Text>
          {/* The total is the sum of the current streaks, the numbers under the plants. */}
          <NumberText style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {`${shelf.totals.plants} ${shelf.totals.plants > 1 ? 'plantes' : 'plante'} · ${days(shelf.totals.currentDays)} de séries en cours`}
          </NumberText>
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
  floor: SkPicture;
  onOpen: (id: string) => void;
  onNew: () => void;
  /** A long press on a plant: take it off the shelf (never a swipe, kept for moving). */
  onRetire: (id: string) => void;
}

/**
 * One wall, one screen wide, in a single canvas: its part of the floor, the
 * whole wall as one picture, and the window. Transparent touch zones and the
 * labels lie on top.
 */
const WallPage = memo(function WallPage({
  wall,
  fit,
  shelf,
  width,
  height,
  floor,
  onOpen,
  onNew,
  onRetire,
}: WallPageProps) {
  const { cell } = fit;
  const pixelRatio = PixelRatio.get();
  const pageLeft = wall.wall.index * width;
  const toX = (x: number) => (x * fit.devicePixelsPerCell) / pixelRatio - pageLeft;
  const toY = (y: number) => fit.roomTop + (y * fit.devicePixelsPerCell) / pixelRatio;
  const bandHeight = (placed: PlacedItem) => placed.rows.to - placed.rows.from;

  const picture = useMemo(
    () =>
      wallPicture(
        wall.items,
        shelf.view,
        {
          pageLeft,
          roomTop: fit.roomTop,
          cell,
          devicePixelsPerCell: fit.devicePixelsPerCell,
          pixelRatio,
        },
        { width, height },
      ),
    [wall, shelf.view, pageLeft, fit, cell, pixelRatio, width, height],
  );
  const windowItem = wall.items.find((placed) => placed.content.kind === 'window');

  return (
    <View style={{ width, height }}>
      <Canvas style={{ width, height }} pointerEvents="none">
        <Group transform={[{ translateX: -pageLeft }, { translateY: fit.floorTop }]}>
          <Picture picture={floor} />
        </Group>
        <Picture picture={picture} />
      </Canvas>
      {windowItem && (
        <View
          style={[styles.zone, { left: toX(windowItem.x), top: toY(windowItem.y) }]}
          pointerEvents="none"
        >
          <AnimatedWindow view={shelf.view} cell={cell} />
        </View>
      )}

      {wall.items.map((placed, i) => {
        const zone = {
          left: toX(placed.x),
          top: toY(placed.y),
          width: placed.content.image.width * cell,
          height: bandHeight(placed) * cell,
        };
        if (placed.content.kind === 'plant') {
          const summary = shelf.habits[placed.content.id]!;
          const id = placed.content.id;
          return (
            <Pressable
              key={`zone-${i}`}
              style={[styles.zone, zone]}
              accessibilityRole="button"
              accessibilityLabel={
                summary.life.dead
                  ? `${summary.habit.name}, n'a pas tenu cette fois, ${days(summary.life.days)} tenus`
                  : `${summary.habit.name}, ${days(summary.life.days)}`
              }
              onPress={() => onOpen(id)}
              onLongPress={() => onRetire(id)}
              accessibilityActions={[{ name: 'longpress', label: 'Retirer' }]}
              onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === 'longpress') onRetire(id);
              }}
            />
          );
        }
        if (placed.content.kind === 'slot' && placed.content.slot === 'new') {
          return (
            <Pressable
              key={`zone-${i}`}
              style={[styles.zone, zone]}
              accessibilityRole="button"
              accessibilityLabel="Nouvelle habitude"
              onPress={onNew}
            />
          );
        }
        return null;
      })}

      {wall.items
        .filter((placed) => placed.labelled)
        .map((placed, i) => (
          <View
            key={`label-${i}`}
            style={[
              styles.label,
              {
                left: toX(placed.x),
                top: toY(placed.y + bandHeight(placed)),
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
});

/**
 * The window in its own small canvas, so that only it redraws a few times
 * per second; it stops when the shelf is not shown.
 */
function AnimatedWindow({ view, cell }: { view: WindowView; cell: number }) {
  const t = useWindowClock(useIsFocused());
  const image = useMemo(() => drawWindow(view, t), [view, t]);
  const picture = useMemo(() => scenePicture(image, view, cell), [image, view, cell]);
  return (
    <Canvas style={{ width: image.width * cell, height: image.height * cell }}>
      <Picture picture={picture} />
    </Canvas>
  );
}

/**
 * Under a plant: its days first, large, then its name, quieter. A dead
 * plant keeps the days it held, quiet too: they no longer run.
 */
function Label({ placed, shelf }: { placed: PlacedItem; shelf: Shelf }) {
  const plant = placed.content.kind === 'plant' ? shelf.habits[placed.content.id] : undefined;
  return (
    <>
      <NumberText
        style={[styles.count, (!plant || plant.life.dead) && styles.newCount]}
        numberOfLines={1}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
      >
        {plant ? days(plant.life.days) : 'Nouvelle'}
      </NumberText>
      <NumberText style={styles.name} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {plant ? plant.habit.name : 'habitude'}
      </NumberText>
    </>
  );
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
  zone: { position: 'absolute' },
  label: {
    position: 'absolute',
    alignItems: 'center',
    paddingTop: LABEL_TOP,
    paddingHorizontal: 2,
  },
  count: {
    fontFamily: fonts.display,
    fontSize: 15,
    lineHeight: COUNT_LINE,
    color: colors.text,
    textAlign: 'center',
  },
  newCount: { color: colors.muted },
  name: {
    fontFamily: fonts.display,
    fontSize: 12,
    lineHeight: NAME_LINE,
    color: colors.muted,
    textAlign: 'center',
  },
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
