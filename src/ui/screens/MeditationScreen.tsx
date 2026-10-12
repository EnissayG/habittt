import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PixelRatio,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  breathFullness,
  breathWord,
  drawIncenseTimer,
  drawSun,
  INCENSE_TIMER_SIZE,
  isOver,
  MAX_GROWTH_DAYS,
  MEDITATION_LENGTHS,
  MEDITATIONS,
  minutesLeft,
  PLANT_GRID,
  plantDaysAt,
  pulsesBetween,
  renderPlant,
  sessionShare,
  SUN,
  type Meditation,
  type MeditationMinutes,
  type ScenePixel,
  type SpeciesId,
} from '../../domain';
import { Button } from '../components/Button';
import { NumberText } from '../components/NumberText';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { tapBreath, tapEnd } from '../meditation/haptics';
import { useSessionClock } from '../meditation/useSessionClock';
import type { ScreenProps } from '../navigation/types';
import { plantName } from '../plant/labels';
import { PixelCanvas } from '../plant/PixelCanvas';
import { PlantPixels } from '../plant/PlantCanvas';
import { pixelScale } from '../plant/pixelScale';
import { sceneColor } from '../theme/scenePalette';
import { colors, fonts, spacing } from '../theme/tokens';
import { useTracker } from '../TrackerContext';
import { useReduceMotion } from '../useReduceMotion';

/** With "reduce motion", the air around the sun keeps this reach: half a breath. */
const STILL_FULLNESS = 0.5;
/**
 * The scene of a session, in grid cells: the sun above the pot, the incense
 * beside it. The incense has an empty twin on the other side, so that the
 * plant stays in the middle of the screen.
 */
const SCENE = {
  width: PLANT_GRID.width + 2 * INCENSE_TIMER_SIZE.width,
  height: SUN.height + PLANT_GRID.height,
} as const;

interface SessionPlant {
  species: SpeciesId;
  seed: number;
}

type Stage =
  | { kind: 'choose' }
  | { kind: 'session'; meditation: Meditation; plant: SessionPlant }
  | { kind: 'end'; plant: SessionPlant };

/**
 * Screen 12: the meditation corner (docs/meditation.md, ADR 0017, 0019).
 * Choose a length, then a plant grows in its pot while one breathes, under a
 * sun whose air follows the breath, beside a stick of incense that burns
 * down with the session. The only words are "inspire" and "expire". Leaving
 * (Terminer or back) returns to the room. Nothing is saved.
 */
export function MeditationScreen({ navigation }: ScreenProps<'Meditation'>) {
  const tracker = useTracker();
  const [stage, setStage] = useState<Stage>({ kind: 'choose' });
  const [vibrate, setVibrate] = useState(true);

  if (stage.kind === 'session') {
    return (
      <Session
        meditation={stage.meditation}
        plant={stage.plant}
        vibrate={vibrate}
        onEnd={() => setStage({ kind: 'end', plant: stage.plant })}
        onQuit={navigation.goBack}
      />
    );
  }
  if (stage.kind === 'end') return <End plant={stage.plant} onBack={navigation.goBack} />;

  const start = (minutes: MeditationMinutes) =>
    setStage({
      kind: 'session',
      meditation: MEDITATIONS[minutes],
      plant: tracker.drawMeditationPlant(),
    });

  return (
    <Screen>
      <TopBar backLabel="étagère" onBack={navigation.goBack} />
      <Text style={styles.title}>Combien de temps ?</Text>
      <View style={styles.lengths}>
        {MEDITATION_LENGTHS.map((minutes) => (
          <Pressable
            key={minutes}
            accessibilityRole="button"
            onPress={() => start(minutes)}
            style={({ pressed }) => [styles.length, pressed && styles.pressed]}
          >
            <NumberText style={styles.lengthLabel}>{`${minutes} minutes`}</NumberText>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Vibrer au rythme du souffle</Text>
        <Switch
          value={vibrate}
          onValueChange={setVibrate}
          trackColor={{ false: colors.line, true: colors.accent }}
          thumbColor={colors.background}
          accessibilityLabel="Vibrer au rythme du souffle"
        />
      </View>
    </Screen>
  );
}

/** The plant of the session after `days` days: never dead, never moving, never watered. */
function sessionPlant(plant: SessionPlant, days: number) {
  return renderPlant({ ...plant, elapsedDays: days, relapseDays: [] });
}

/** The scale of the session scene: most of the screen, in whole device pixels. */
function useSceneScale() {
  const { width, height } = useWindowDimensions();
  return pixelScale(SCENE, { width: width - 28, height: height * 0.62 }, PixelRatio.get());
}

interface SessionProps {
  meditation: Meditation;
  plant: SessionPlant;
  vibrate: boolean;
  onEnd: () => void;
  onQuit: () => void;
}

function Session({ meditation, plant, vibrate, onEnd, onQuit }: SessionProps) {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const scale = useSceneScale();
  const [controls, setControls] = useState(true);
  const t = useSessionClock(true);
  const over = isOver(meditation, t);

  const ended = useRef(false);
  useEffect(() => {
    if (!over || ended.current) return;
    ended.current = true;
    tapEnd();
    onEnd();
  }, [over, onEnd]);

  const days = plantDaysAt(meditation, t);
  const image = useMemo(() => sessionPlant(plant, days), [plant, days]);
  // The breath, for the hand: the taps due since the last beat of the clock
  // (closer and stronger breathing in, fading breathing out).
  const felt = useRef(0);
  useEffect(() => {
    const due = vibrate ? pulsesBetween(meditation, felt.current, t) : [];
    felt.current = t;
    const last = due[due.length - 1];
    if (last) tapBreath(last.strength);
  }, [vibrate, meditation, t]);
  // The sun: its heart stays the same, the air around it spreads out with the
  // breath in and comes back with the breath out, in waves. With "reduce
  // motion" it stays still, half way.
  const sun = useMemo(
    () => (reduceMotion ? drawSun(STILL_FULLNESS) : drawSun(breathFullness(t), t)),
    [reduceMotion, t],
  );
  // Time passing: the stick burns down from the start to the end of the session.
  const incense = useMemo(
    () => drawIncenseTimer(sessionShare(meditation, t), reduceMotion ? 0 : t),
    [meditation, reduceMotion, t],
  );
  // The only word: it appears and fades away with each half of the breath.
  const word = breathWord(t);
  const left = minutesLeft(meditation, t);

  return (
    <Pressable
      style={[styles.session, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      onPress={() => setControls((shown) => !shown)}
      accessible={false}
    >
      <View style={styles.center}>
        <PixelCanvas grid={sun} colorOf={dayColor} cellSize={scale.cellSize} />
        <View style={styles.pot}>
          <View style={{ width: INCENSE_TIMER_SIZE.width * scale.cellSize }} />
          <PlantPixels image={image} cellSize={scale.cellSize} />
          <PixelCanvas grid={incense} colorOf={dayColor} cellSize={scale.cellSize} />
        </View>
        <Text
          style={[styles.word, { opacity: reduceMotion ? 1 : word.opacity }]}
          accessibilityLiveRegion="polite"
        >
          {word.word}
        </Text>
      </View>
      <View style={styles.controls}>
        {controls && (
          <>
            <NumberText style={styles.left}>{`encore ${left} min`}</NumberText>
            <Button label="Terminer" variant="quiet" onPress={onQuit} />
          </>
        )}
      </View>
    </Pressable>
  );
}

/** The sun and the incense have the same colors whatever the hour. */
const dayColor = (pixel: ScenePixel) => sceneColor(pixel, 'day');

function End({ plant, onBack }: { plant: SessionPlant; onBack: () => void }) {
  const scale = useSceneScale();
  const image = useMemo(() => sessionPlant(plant, MAX_GROWTH_DAYS), [plant]);
  return (
    <Screen footer={<Button label="Revenir à la pièce" onPress={onBack} />}>
      <View style={styles.center}>
        <PlantPixels image={image} cellSize={scale.cellSize} />
        <Text style={styles.name}>{plantName(image)}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  lengths: { gap: spacing.sm },
  length: {
    backgroundColor: colors.surface,
    borderBottomWidth: 4,
    borderBottomColor: colors.line,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pressed: { opacity: 0.6 },
  lengthLabel: { fontFamily: fonts.display, fontSize: 17, color: colors.text },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    gap: spacing.md,
  },
  rowLabel: { flex: 1, fontFamily: fonts.display, fontSize: 15, color: colors.text },
  session: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  pot: { flexDirection: 'row', alignItems: 'flex-end' },
  word: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 48,
    color: colors.text,
    textAlign: 'center',
  },
  name: { fontFamily: fonts.display, fontSize: 17, color: colors.text, textAlign: 'center' },
  controls: { alignItems: 'center', paddingBottom: spacing.sm, minHeight: 64 },
  left: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
