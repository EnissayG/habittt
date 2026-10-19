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
  drawSparkles,
  drawSun,
  INCENSE_TIMER_SIZE,
  isOver,
  MAX_GROWTH_DAYS,
  MEDITATION_BONSAI,
  MEDITATION_LENGTHS,
  MEDITATIONS,
  minutesLeft,
  PLANT_GRID,
  pulsesBetween,
  renderPlant,
  sessionShare,
  SUN,
  type Meditation,
  type MeditationMinutes,
  type ScenePixel,
} from '../../domain';
import { Button } from '../components/Button';
import { NumberText } from '../components/NumberText';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { tapBreath, tapEnd } from '../meditation/haptics';
import { useSessionClock } from '../meditation/useSessionClock';
import type { ScreenProps } from '../navigation/types';
import { LivingPlant } from '../plant/LivingPlant';
import { PixelCanvas } from '../plant/PixelCanvas';
import { pixelScale } from '../plant/pixelScale';
import { sceneColor, sunOnDark } from '../theme/scenePalette';
import { fonts, spacing, type Palette } from '../theme/tokens';
import { useLights, usePalette, useThemedStyles } from '../theme/ThemeContext';
import { useReduceMotion } from '../useReduceMotion';

/** With "reduce motion", the air around the sun keeps this reach: half a breath. */
const STILL_FULLNESS = 0.5;
/**
 * The scene of a session, in grid cells: the sun above the bonsai, the
 * incense beside it. The incense has an empty twin on the other side, so
 * that the bonsai stays in the middle of the screen.
 */
const SCENE = {
  width: PLANT_GRID.width + 2 * INCENSE_TIMER_SIZE.width,
  height: SUN.height + PLANT_GRID.height,
} as const;
/** At the end, the seconds the sun takes to open fully, and the well done to appear. */
const END_OPEN = 1.5;
const END_WORDS = 0.8;

/** The grown bonsai of every session, already there (ADR 0020). */
const BONSAI = renderPlant({ ...MEDITATION_BONSAI, elapsedDays: MAX_GROWTH_DAYS, relapseDays: [] });

type Stage =
  | { kind: 'choose' }
  | { kind: 'session'; meditation: Meditation }
  | { kind: 'end'; meditation: Meditation };

/**
 * Screen 12: the meditation corner (docs/meditation.md, ADR 0017 to 0020).
 * Choose a length, then breathe with the sun, beside the grown bonsai and a
 * stick of incense that burns down with the session. The only words are
 * "inspire" and "expire"; the end says well done. Leaving (Terminer or
 * back) returns to the room. Nothing is saved.
 */
export function MeditationScreen({ navigation }: ScreenProps<'Meditation'>) {
  const colors = usePalette();
  const styles = useThemedStyles(makeStyles);
  const [stage, setStage] = useState<Stage>({ kind: 'choose' });
  const [vibrate, setVibrate] = useState(true);

  if (stage.kind === 'session') {
    return (
      <Session
        meditation={stage.meditation}
        vibrate={vibrate}
        onEnd={() => setStage({ kind: 'end', meditation: stage.meditation })}
        onQuit={navigation.goBack}
      />
    );
  }
  if (stage.kind === 'end') return <End meditation={stage.meditation} onBack={navigation.goBack} />;

  const start = (minutes: MeditationMinutes) =>
    setStage({ kind: 'session', meditation: MEDITATIONS[minutes] });

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

/** The scale of the session scene: most of the screen, in whole device pixels. */
function useSceneScale() {
  const { width, height } = useWindowDimensions();
  return pixelScale(SCENE, { width: width - 28, height: height * 0.62 }, PixelRatio.get());
}

/** The sun and the incense have the same colors whatever the hour. */
const dayColor = (pixel: ScenePixel) => sceneColor(pixel, 'day');

/** The sun, then the bonsai with the incense beside it; `over` is laid on the whole scene. */
function Scene({
  sun,
  incense,
  cellSize,
  over,
}: {
  sun: ReturnType<typeof drawSun>;
  incense: ReturnType<typeof drawIncenseTimer>;
  cellSize: number;
  over?: ReturnType<typeof drawSparkles>;
}) {
  // Lights off, the air around the sun fades into the dark, not into the cream.
  const colors = usePalette();
  const lights = useLights();
  const sunColor = useMemo(
    () => (lights.off ? sunOnDark(colors.background) : dayColor),
    [lights.off, colors.background],
  );
  const styles = useThemedStyles(makeStyles);
  return (
    <View>
      <View style={styles.sun}>
        <PixelCanvas grid={sun} colorOf={sunColor} cellSize={cellSize} />
      </View>
      <View style={styles.pot}>
        <View style={{ width: INCENSE_TIMER_SIZE.width * cellSize }} />
        <LivingPlant image={BONSAI} cellSize={cellSize} />
        <PixelCanvas grid={incense} colorOf={dayColor} cellSize={cellSize} />
      </View>
      {over && (
        <View style={styles.over} pointerEvents="none">
          <PixelCanvas grid={over} colorOf={sunColor} cellSize={cellSize} />
        </View>
      )}
    </View>
  );
}

interface SessionProps {
  meditation: Meditation;
  vibrate: boolean;
  onEnd: () => void;
  onQuit: () => void;
}

function Session({ meditation, vibrate, onEnd, onQuit }: SessionProps) {
  const styles = useThemedStyles(makeStyles);
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

  // The breath, for the hand, like the lungs: quick taps breathing in, taps
  // that slow down breathing out (only the last one due since the last beat).
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
        <Scene sun={sun} incense={incense} cellSize={scale.cellSize} />
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

/**
 * The end, a small well done: the sun opens fully, stars of light come one
 * after the other around it and the bonsai, the incense has burnt down, and
 * "Bravo" appears with the time one gave oneself.
 */
function End({ meditation, onBack }: { meditation: Meditation; onBack: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const scale = useSceneScale();
  const reduceMotion = useReduceMotion();
  const t = useSessionClock(true);
  const open = reduceMotion ? 1 : Math.min(1, t / END_OPEN);
  const sun = useMemo(
    () => drawSun(1 - (1 - open) * (1 - open), reduceMotion ? 0 : t),
    [open, reduceMotion, t],
  );
  const incense = useMemo(() => drawIncenseTimer(1, reduceMotion ? 0 : t), [reduceMotion, t]);
  const sparkles = useMemo(
    () => drawSparkles(SCENE.width, SCENE.height, reduceMotion ? 2 : t),
    [reduceMotion, t],
  );
  const words = reduceMotion ? 1 : Math.min(1, Math.max(0, (t - END_OPEN / 2) / END_WORDS));
  return (
    <Screen footer={<Button label="Revenir à la pièce" onPress={onBack} />}>
      <View style={styles.center}>
        <Scene sun={sun} incense={incense} cellSize={scale.cellSize} over={sparkles} />
        <View style={{ opacity: words }} accessibilityLiveRegion="polite">
          <Text style={styles.word}>Bravo</Text>
          <NumberText style={styles.given}>{`${meditation.minutes} minutes pour toi`}</NumberText>
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
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
    sun: { alignItems: 'center' },
    pot: { flexDirection: 'row', alignItems: 'flex-end' },
    over: { position: 'absolute', left: 0, top: 0 },
    given: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center' },
    word: {
      fontFamily: fonts.display,
      fontSize: 40,
      lineHeight: 48,
      color: colors.text,
      textAlign: 'center',
    },
    controls: { alignItems: 'center', paddingBottom: spacing.sm, minHeight: 64 },
    left: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  });
