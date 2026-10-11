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
  BREATH_SECONDS,
  breathAt,
  breathLevel,
  isOver,
  MAX_GROWTH_DAYS,
  MEDITATION_END,
  MEDITATION_LENGTHS,
  MEDITATIONS,
  minutesLeft,
  phraseAt,
  PLANT_GRID,
  plantDaysAt,
  renderPlant,
  type Meditation,
  type MeditationMinutes,
  type SpeciesId,
} from '../../domain';
import { Button } from '../components/Button';
import { NumberText } from '../components/NumberText';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { tapBreathIn, tapEnd } from '../meditation/haptics';
import { useSessionClock } from '../meditation/useSessionClock';
import type { ScreenProps } from '../navigation/types';
import { plantName } from '../plant/labels';
import { PlantPixels } from '../plant/PlantCanvas';
import { pixelScale } from '../plant/pixelScale';
import { colors, fonts, spacing } from '../theme/tokens';
import { useTracker } from '../TrackerContext';
import { useReduceMotion } from '../useReduceMotion';

/** Cells of the breath bar: it fills and empties by these steps. */
const BAR_STEPS = 12;
/** Size of one step of the bar, in plant cells. */
const BAR_STEP = { width: 3, height: 2, gap: 1 } as const;
/** Room for two lines of a phrase, so that nothing moves when one appears. */
const PHRASE_LINES = 2;
const PHRASE_LINE = 23;

interface SessionPlant {
  species: SpeciesId;
  seed: number;
}

type Stage =
  | { kind: 'choose' }
  | { kind: 'session'; meditation: Meditation; plant: SessionPlant }
  | { kind: 'end'; plant: SessionPlant };

/**
 * Screen 12: the meditation corner (docs/meditation.md, ADR 0017). Choose a
 * length, then a plant grows in its pot while one breathes, from an empty
 * pot to a grown plant. Leaving (Terminer or back) returns to the room
 * without a word. Nothing is saved.
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
      <Text style={styles.body}>
        Une plante va pousser pendant que tu respires. Tu peux arrêter quand tu veux.
      </Text>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Vibrer à chaque inspiration</Text>
        <Switch
          value={vibrate}
          onValueChange={setVibrate}
          trackColor={{ false: colors.line, true: colors.accent }}
          thumbColor={colors.background}
          accessibilityLabel="Vibrer à chaque inspiration"
        />
      </View>
    </Screen>
  );
}

/** The plant of the session after `days` days: never dead, never moving, never watered. */
function sessionPlant(plant: SessionPlant, days: number) {
  return renderPlant({ ...plant, elapsedDays: days, relapseDays: [] });
}

/** The scale of the big pot: half the screen, in whole device pixels. */
function usePotScale() {
  const { width, height } = useWindowDimensions();
  return pixelScale(PLANT_GRID, { width: width - 28, height: height * 0.5 }, PixelRatio.get());
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
  const scale = usePotScale();
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
  const breath = breathAt(t);
  // A light tap at the start of each breath in, the first one included.
  useEffect(() => {
    if (vibrate && !isOver(meditation, breath.number * BREATH_SECONDS)) tapBreathIn();
  }, [vibrate, meditation, breath.number]);
  const phrase = phraseAt(meditation, t);
  const left = minutesLeft(meditation, t);

  return (
    <Pressable
      style={[styles.session, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      onPress={() => setControls((shown) => !shown)}
      accessible={false}
    >
      <View style={styles.center}>
        <PlantPixels image={image} cellSize={scale.cellSize} />
        <View style={styles.breath}>
          {reduceMotion ? (
            <Text style={styles.breathWord} accessibilityLiveRegion="polite">
              {breath.phase === 'inhale' ? 'inspire' : 'expire'}
            </Text>
          ) : (
            <BreathBar level={breathLevel(t, BAR_STEPS)} cell={scale.cellSize} />
          )}
        </View>
        <Text style={styles.phrase} accessibilityLiveRegion="polite">
          {phrase ?? ''}
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

/** A row of square steps, no rounded corner: full ones for the air breathed in. */
function BreathBar({ level, cell }: { level: number; cell: number }) {
  return (
    <View style={[styles.bar, { gap: BAR_STEP.gap * cell }]} accessible={false}>
      {Array.from({ length: BAR_STEPS }, (_, i) => (
        <View
          key={i}
          style={{
            width: BAR_STEP.width * cell,
            height: BAR_STEP.height * cell,
            backgroundColor: i < level ? colors.accent : colors.line,
          }}
        />
      ))}
    </View>
  );
}

function End({ plant, onBack }: { plant: SessionPlant; onBack: () => void }) {
  const scale = usePotScale();
  const image = useMemo(() => sessionPlant(plant, MAX_GROWTH_DAYS), [plant]);
  return (
    <Screen footer={<Button label="Revenir à la pièce" onPress={onBack} />}>
      <View style={styles.center}>
        <PlantPixels image={image} cellSize={scale.cellSize} />
        <Text style={styles.phrase} accessibilityLiveRegion="polite">
          {MEDITATION_END}
        </Text>
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
  body: { fontFamily: fonts.body, fontSize: 15, color: colors.text, lineHeight: 21 },
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
  breath: { minHeight: 28, justifyContent: 'center' },
  bar: { flexDirection: 'row' },
  breathWord: { fontFamily: fonts.display, fontSize: 17, color: colors.muted },
  phrase: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: PHRASE_LINE,
    minHeight: PHRASE_LINE * PHRASE_LINES,
    color: colors.text,
    textAlign: 'center',
  },
  name: { fontFamily: fonts.display, fontSize: 17, color: colors.text, textAlign: 'center' },
  controls: { alignItems: 'center', paddingBottom: spacing.sm, minHeight: 64 },
  left: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
