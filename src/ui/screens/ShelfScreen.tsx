import {
  Canvas,
  Circle,
  Group,
  Picture,
  RadialGradient,
  Rect,
  rect,
  vec,
  type SkPicture,
} from '@shopify/react-native-skia';
import { StatusBar } from 'expo-status-bar';
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
  drawFlame,
  drawSmoke,
  drawWallpaper,
  DAYLIGHT,
  gestureAt,
  lightLevel,
  MEDITATION_PIECES,
  reflectLights,
  roomLights,
  SIGN_PLANK,
  usedRows,
  planRoom,
  PLANT_GRID,
  drawWindow,
  withGesture,
  type AnimatedDecor,
  type LightSource,
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
import { floorContext, gesturePatch, type FloorContext } from '../shelf/gesturePatch';
import {
  floorPicture,
  mirrorImage,
  patchPicture,
  reflectedLightsPicture,
  scenePicture,
  wallPicture,
  type WallFrame,
} from '../shelf/scenePicture';
import {
  glowColor,
  glowStrength,
  lightsOffLook,
  roomColor,
  type LightsOffLook,
} from '../theme/scenePalette';
import { fonts, spacing, type Palette } from '../theme/tokens';
import { useLights, usePalette, useThemedStyles } from '../theme/ThemeContext';
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
/** On the shelf, a plant rests this many times longer between two gestures than on its own screen. */
const SHELF_CALM = 3;
/** Frames per second of the lights of the dark room: enough for a candle to flicker. */
const LIGHTS_FPS = 15;

/**
 * Screen 2: the shelf, a room seen one wall at a time. It fills the screen
 * edge to edge; the only gesture is a horizontal scroll through the room,
 * free with its natural deceleration, that settles on the nearest wall.
 */
export function ShelfScreen({ navigation }: ScreenProps<'Shelf'>) {
  const colors = usePalette();
  const styles = useThemedStyles(makeStyles);
  const tracker = useTracker();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const load = useCallback(() => tracker.getShelf(), [tracker]);
  const { data: shelf } = useScreenData(load);
  const [page, setPage] = useState(0);
  // The lights of the room (ADR 0020, 0021): off, the room goes dark, what
  // gives light shines, and every other screen goes dark too.
  const lights = useLights();
  const lightsOff = lights.off;
  const focused = useIsFocused();

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
  // laid over the boards (see floorMirror). `context` is what a plant's
  // gesture needs to move its reflection too (see gesturePatch).
  const floor = useMemo((): Floor | null => {
    if (!fit || !view) return null;
    const { plan, floorRows: rows, cell } = fit;
    const room = composeRoom(plan);
    const boards = drawFloorBoards(plan.width, rows);
    const items = drawFloorItems(plan.width, rows, plan.floorItems);
    const paper = drawWallpaper(plan.width, plan.height);
    const context = floorContext(room, rows, boards, items, paper);
    const shining = roomLights(plan, room, paper);
    const reflection = reflectLights(room, rows, shining.lit, shining.sources);
    const mirror = mirrorImage(
      floorMirror(room, rows, (source: RoomSource | null) => roomColor(source, view)),
    );
    // Skia could not make the image: the same floor, one shape per color.
    const picture = mirror
      ? floorPicture(boards, mirror, items, view, cell)
      : scenePicture(drawFloor({ room, rows, items: plan.floorItems }), view, cell);
    return {
      picture,
      context,
      wallpaper: scenePicture(paper, view, cell),
      lit: scenePicture(shining.lit, view, cell),
      sources: shining.sources,
      litFloor: reflectedLightsPicture(reflection.cells, view, cell, {
        width: plan.width * cell,
        height: rows * cell,
      }),
      floorSources: reflection.sources,
    };
  }, [fit, view]);

  // Stable, so that the walls (memoized) do not redraw when the dots move.
  const onOpen = useCallback((id: string) => navigation.navigate('Habit', { id }), [navigation]);
  const onNew = useCallback(() => navigation.navigate('NewHabitName'), [navigation]);
  const onRetire = useCallback((id: string) => navigation.navigate('Retire', { id }), [navigation]);
  const onMeditate = useCallback(() => navigation.navigate('Meditation'), [navigation]);

  // Lights off, the room is as dark as the hour is (day, evening, night).
  const look = lightsOff && view ? lightsOffLook(view) : null;

  if (!shelf || !fit || !floor) return <View style={styles.screen} />;

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
        {walls.map((wall, i) => (
          <WallPage
            key={wall.wall.index}
            wall={wall}
            fit={fit}
            shelf={shelf}
            width={width}
            height={height}
            floor={floor}
            dark={look}
            awake={lightsOff && i === current}
            onOpen={onOpen}
            onNew={onNew}
            onRetire={onRetire}
            onMeditate={onMeditate}
          />
        ))}
      </ScrollView>

      {look && focused && <StatusBar style={look.statusBar} />}
      <View style={[styles.header, { top: insets.top }]}>
        <View>
          <Text style={[styles.logo, look && { color: look.text }]} maxFontSizeMultiplier={1}>
            habittt
          </Text>
          {/* The total is the sum of the current streaks, the numbers under the plants. */}
          <NumberText
            style={[styles.subtitle, look && { color: look.muted }]}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
          >
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
              <Text style={[styles.subtitle, look && { color: look.muted }]}>Labo</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Lumière de la pièce"
            accessibilityState={{ checked: !lightsOff }}
            hitSlop={12}
            onPress={lights.toggle}
          >
            <PixelIcon name="bulb" size={21} color={look ? look.text : colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Réglages"
            hitSlop={12}
            onPress={() => navigation.navigate('Settings')}
          >
            <PixelIcon name="gear" size={21} color={look ? look.text : colors.text} />
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

/** The floor of the whole room: its picture, and what a gesture's patch needs. */
interface Floor {
  picture: SkPicture;
  context: FloorContext;
  /** The wallpaper of the whole room, behind everything (see drawWallpaper). */
  wallpaper: SkPicture;
  /** With the lights off: what gives light, bright over the dark room, and the glows. */
  lit: SkPicture;
  sources: LightSource[];
  /** The same lights, seen in the polished floor (see reflectLights). */
  litFloor: SkPicture;
  floorSources: (LightSource & { strength: number })[];
}

interface WallPageProps {
  wall: WallPlan;
  fit: RoomFit;
  shelf: Shelf;
  width: number;
  height: number;
  floor: Floor;
  /** The lights are off: how dark the room is at this hour; null with the lights on. */
  dark: LightsOffLook | null;
  /** The glows of this wall move (only the wall in view, lights off). */
  awake: boolean;
  onOpen: (id: string) => void;
  onNew: () => void;
  /** A long press on a plant: take it off the shelf (never a swipe, kept for moving). */
  onRetire: (id: string) => void;
  /** The meditation corner (screen 12). */
  onMeditate: () => void;
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
  dark,
  awake,
  onOpen,
  onNew,
  onRetire,
  onMeditate,
}: WallPageProps) {
  const styles = useThemedStyles(makeStyles);
  const { cell } = fit;
  const pixelRatio = PixelRatio.get();
  const pageLeft = wall.wall.index * width;
  const toX = (x: number) => (x * fit.devicePixelsPerCell) / pixelRatio - pageLeft;
  const toY = (y: number) => fit.roomTop + (y * fit.devicePixelsPerCell) / pixelRatio;
  const bandHeight = (placed: PlacedItem) => placed.rows.to - placed.rows.from;
  // A label sits just under what it names: under the pot on a shelf, under
  // the lowest vine of a hanging plant (its band can be much taller, beside
  // the window), never below its band.
  const labelRow = (placed: PlacedItem) =>
    placed.content.kind === 'plant'
      ? Math.min(bandHeight(placed), usedRows(placed.content.image).bottom + 1 - placed.rows.from)
      : bandHeight(placed);

  const frame = useMemo(
    () => ({
      pageLeft,
      roomTop: fit.roomTop,
      floorTop: fit.floorTop,
      cell,
      devicePixelsPerCell: fit.devicePixelsPerCell,
      pixelRatio,
    }),
    [pageLeft, fit, cell, pixelRatio],
  );
  const picture = useMemo(
    () => wallPicture(wall.items, shelf.view, frame, { width, height }),
    [wall, shelf.view, frame, width, height],
  );
  const windowItem = wall.items.find((placed) => placed.content.kind === 'window');
  // What moves on this wall: the incense's smoke, the candle's flame.
  const wallRight = (wall.wall.index + 1) * fit.pageWidth;
  const moving = fit.plan.animated.filter(
    (a) => a.x >= wall.wall.index * fit.pageWidth && a.x < wallRight,
  );

  return (
    <View style={{ width, height }}>
      <WallCanvas
        wall={wall}
        view={shelf.view}
        picture={picture}
        floor={floor}
        frame={frame}
        width={width}
        height={height}
        dark={dark}
      />
      {windowItem && (
        <View
          style={[styles.zone, { left: toX(windowItem.x), top: toY(windowItem.y) }]}
          pointerEvents="none"
        >
          <AnimatedWindow view={shelf.view} cell={cell} dark={dark} />
        </View>
      )}
      {moving.map((decor) => (
        <View
          key={decor.kind}
          style={[styles.zone, { left: toX(decor.x), top: toY(decor.y) }]}
          pointerEvents="none"
        >
          <AnimatedDecorView kind={decor.kind} view={shelf.view} cell={cell} dark={dark} />
        </View>
      ))}
      {dark && (
        <Lights
          sources={floor.sources}
          reflected={floor.floorSources}
          floorTop={fit.floorTop}
          view={shelf.view}
          awake={awake}
          toX={toX}
          toY={toY}
          cell={cell}
          width={width}
          height={height}
        />
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
        if (placed.content.kind === 'decor' && placed.content.piece === 'sign') {
          // The way in, said plainly: the word on the wooden sign above the
          // cushion. It is the one a screen reader finds.
          const plank = SIGN_PLANK.height * cell;
          return (
            <Pressable
              key={`zone-${i}`}
              style={({ pressed }) => [styles.zone, zone, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Méditer"
              accessibilityHint="Ouvre le coin méditation"
              hitSlop={8}
              onPress={onMeditate}
            >
              <View style={[styles.signWord, { top: SIGN_PLANK.y * cell, height: plank }]}>
                <Text
                  style={[
                    styles.signLabel,
                    { fontSize: Math.min(14, Math.floor(plank * 0.62)) },
                    dark && dark.statusBar === 'light' && { color: dark.muted },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1}
                >
                  Méditer
                </Text>
              </View>
            </Pressable>
          );
        }
        if (placed.content.kind === 'decor' && MEDITATION_PIECES.includes(placed.content.piece)) {
          // The rest of the corner opens the meditation too.
          return (
            <Pressable
              key={`zone-${i}`}
              style={[styles.zone, zone]}
              accessible={false}
              onPress={onMeditate}
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
                top: toY(placed.y + labelRow(placed)),
                width: PLANT_GRID.width * cell,
              },
            ]}
            pointerEvents="none"
          >
            <Label placed={placed} shelf={shelf} dark={dark} />
          </View>
        ))}
    </View>
  );
});

interface WallCanvasProps {
  wall: WallPlan;
  view: WindowView;
  /** The wall, recorded once (see wallPicture). */
  picture: SkPicture;
  floor: Floor;
  frame: WallFrame & { floorTop: number };
  width: number;
  height: number;
  dark: LightsOffLook | null;
}

/**
 * The canvas of one wall: its part of the floor, the wall, and over them the
 * patch of the plants in the middle of their gesture (see gesturePatch).
 * Only this component follows the clock, and it draws again only when a
 * gesture starts or ends: the wall and the floor are never recorded again.
 */
function WallCanvas({ wall, view, picture, floor, frame, width, height, dark }: WallCanvasProps) {
  const t = useWindowClock(useIsFocused());
  // The plants in the middle of their gesture, and a key that names them.
  const moving = wall.items.flatMap((placed) => {
    if (placed.content.kind !== 'plant') return [];
    const { image } = placed.content;
    const part = gestureAt(image, t, SHELF_CALM);
    return part === null ? [] : [{ placed, image, part }];
  });
  const key = moving.map(({ placed, part }) => `${placed.x}:${placed.y}:${part}`).join(' ');
  const patch = useMemo(
    () => {
      if (moving.length === 0) return null;
      const moves = moving.map(({ placed, image, part }) => ({
        placed,
        moved: withGesture(image, part),
      }));
      return patchPicture(gesturePatch(moves, floor.context, view), frame, { width, height });
    },
    // `moving` is rebuilt at every beat of the clock; `key` says when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, wall, floor, view, frame, width, height],
  );

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Group transform={[{ translateX: -frame.pageLeft }, { translateY: frame.roomTop }]}>
        <Picture picture={floor.wallpaper} />
      </Group>
      <Group transform={[{ translateX: -frame.pageLeft }, { translateY: frame.floorTop }]}>
        <Picture picture={floor.picture} />
      </Group>
      <Picture picture={picture} />
      {patch && <Picture picture={patch} />}
      {dark && (
        // Lights off: the whole room goes dark, but what gives light stays bright.
        <>
          <Rect x={0} y={0} width={width} height={height} color={dark.veil} />
          <Group transform={[{ translateX: -frame.pageLeft }, { translateY: frame.roomTop }]}>
            <Picture picture={floor.lit} />
          </Group>
          <Group transform={[{ translateX: -frame.pageLeft }, { translateY: frame.floorTop }]}>
            <Picture picture={floor.litFloor} />
          </Group>
        </>
      )}
    </Canvas>
  );
}

/**
 * The window in its own small canvas, so that only it redraws a few times
 * per second; it stops when the shelf is not shown.
 */
/**
 * The incense's smoke or the candle's flame, in its own small canvas: only
 * it redraws a few times per second, and it stops when the shelf is not
 * shown (and with "reduce motion").
 */
function AnimatedDecorView({
  kind,
  view,
  cell,
  dark,
}: {
  kind: AnimatedDecor['kind'];
  view: WindowView;
  cell: number;
  dark: LightsOffLook | null;
}) {
  const t = useWindowClock(useIsFocused());
  const image = useMemo(() => (kind === 'smoke' ? drawSmoke(t) : drawFlame(t)), [kind, t]);
  const picture = useMemo(() => scenePicture(image, view, cell), [image, view, cell]);
  return (
    <Canvas style={{ width: image.width * cell, height: image.height * cell }}>
      {/* In the dark, the flame still shines; the smoke is only a pale trace. */}
      <Group opacity={dark && kind === 'smoke' ? (dark.statusBar === 'dark' ? 0.75 : 0.35) : 1}>
        <Picture picture={picture} />
      </Group>
    </Canvas>
  );
}

function AnimatedWindow({
  view,
  cell,
  dark,
}: {
  view: WindowView;
  cell: number;
  dark: LightsOffLook | null;
}) {
  const t = useWindowClock(useIsFocused());
  const image = useMemo(() => drawWindow(view, t), [view, t]);
  const picture = useMemo(() => scenePicture(image, view, cell), [image, view, cell]);
  const size = { width: image.width * cell, height: image.height * cell };
  const daylight = rect(
    DAYLIGHT.x * cell,
    DAYLIGHT.y * cell,
    DAYLIGHT.width * cell,
    DAYLIGHT.height * cell,
  );
  return (
    <Canvas style={size}>
      <Picture picture={picture} />
      {dark && (
        // Lights off: the frame, the curtains and the sill darken with the
        // room; only the glass the curtains leave open keeps the light of
        // the hour, a little dimmed.
        <>
          <Rect x={0} y={0} {...size} color={dark.veil} blendMode="srcATop" />
          <Group clip={daylight}>
            <Picture picture={picture} />
            <Rect rect={daylight} color={dark.windowVeil} />
          </Group>
        </>
      )}
    </Canvas>
  );
}

/** A color of the theme with an opacity, for the glows. */
function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 1000) / 1000})`;
}

/**
 * The glows of the dark room, in their own canvas over the wall: each light
 * shines around itself, alive in its own way (lightLevel). Only the wall in
 * view moves (`awake`), and nothing moves with "reduce motion".
 */
function Lights({
  sources,
  reflected,
  floorTop,
  view,
  awake,
  toX,
  toY,
  cell,
  width,
  height,
}: {
  sources: LightSource[];
  /** The glows seen in the floor, in rows of the floor image. */
  reflected: (LightSource & { strength: number })[];
  floorTop: number;
  view: WindowView;
  awake: boolean;
  toX: (x: number) => number;
  toY: (y: number) => number;
  cell: number;
  width: number;
  height: number;
}) {
  const styles = useThemedStyles(makeStyles);
  const focused = useIsFocused();
  const t = useWindowClock(awake && focused, LIGHTS_FPS);
  const inView = (source: LightSource) => {
    const x = toX(source.x);
    const reach = source.radius * cell;
    return x > -reach && x < width + reach;
  };
  const glow = (source: LightSource, y: number, weaker: number, key: string) => {
    const center = vec(toX(source.x), y);
    const r = source.radius * cell;
    const color = glowColor(source.kind, view);
    const strength = glowStrength(source.kind, view) * lightLevel(source, t) * weaker;
    return (
      <Circle key={key} c={center} r={r}>
        <RadialGradient
          c={center}
          r={r}
          colors={[
            withAlpha(color, strength),
            withAlpha(color, strength * 0.35),
            withAlpha(color, 0),
          ]}
          positions={[0, 0.35, 1]}
        />
      </Circle>
    );
  };
  return (
    <Canvas style={[styles.lights, { width, height }]} pointerEvents="none">
      {sources.filter(inView).map((source, i) => glow(source, toY(source.y), 1, `room-${i}`))}
      {/* The same glows in the polished floor, flattened and kept on the floor. */}
      <Group clip={rect(0, floorTop, width, height - floorTop)}>
        {reflected
          .filter(inView)
          .map((source, i) =>
            glow(source, floorTop + source.y * cell, source.strength, `floor-${i}`),
          )}
      </Group>
    </Canvas>
  );
}

/**
 * Under a plant: its days first, large, then its name, quieter. A dead
 * plant keeps the days it held, quiet too: they no longer run.
 */
function Label({
  placed,
  shelf,
  dark,
}: {
  placed: PlacedItem;
  shelf: Shelf;
  dark: LightsOffLook | null;
}) {
  const styles = useThemedStyles(makeStyles);
  const plant = placed.content.kind === 'plant' ? shelf.habits[placed.content.id] : undefined;
  const quiet = !plant || plant.life.dead;
  return (
    <>
      <NumberText
        style={[
          styles.count,
          quiet && styles.newCount,
          dark && { color: quiet ? dark.muted : dark.text },
        ]}
        numberOfLines={1}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
      >
        {plant ? days(plant.life.days) : 'Nouvelle'}
      </NumberText>
      <NumberText
        style={[styles.name, dark && { color: dark.muted }]}
        numberOfLines={1}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
      >
        {plant ? plant.habit.name : 'habitude'}
      </NumberText>
    </>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
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
    logo: {
      fontFamily: fonts.displayBold,
      fontSize: 30,
      color: colors.text,
      lineHeight: LOGO_LINE,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.muted,
      lineHeight: SUBTITLE_LINE,
    },
    zone: { position: 'absolute' },
    lights: { position: 'absolute', left: 0, top: 0 },
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
    signWord: { position: 'absolute', left: 0, right: 0, justifyContent: 'center' },
    signLabel: { fontFamily: fonts.display, color: colors.onWood, textAlign: 'center' },
    pressed: { opacity: 0.6 },
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
