import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  MEDITATION_GOAL,
  MAX_GROWTH_DAYS,
  MEDITATION_BONSAI,
  MEDITATION_LENGTHS,
  MEDITATIONS,
  meditationMonth,
  minutesLeft,
  monthOf,
  nextMonth,
  previousMonth,
  PLANT_GRID,
  pulsesBetween,
  renderPlant,
  sessionShare,
  SUN,
  type Meditation,
  type MeditationMinutes,
  type MonthId,
  type ScenePixel,
} from '../../domain';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { NumberText } from '../components/NumberText';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { tapBreath, tapEnd } from '../meditation/haptics';
import { MeditationCalendar } from '../meditation/MeditationCalendar';
import {
  clearMeditationReminder,
  MEDITATION_TIMES,
  meditationReminder,
  setMeditationReminder,
  timeLabel,
  type ReminderTime,
} from '../meditation/reminder';
import { useSessionClock } from '../meditation/useSessionClock';
import type { ScreenProps } from '../navigation/types';
import { LivingPlant } from '../plant/LivingPlant';
import { PlantPixels } from '../plant/PlantCanvas';
import { PixelCanvas } from '../plant/PixelCanvas';
import { pixelScale } from '../plant/pixelScale';
import { sceneColor, sunOnDark } from '../theme/scenePalette';
import { fonts, spacing, type Palette } from '../theme/tokens';
import { useLights, usePalette, useThemedStyles } from '../theme/ThemeContext';
import { useTracker } from '../TrackerContext';
import { useLoader } from '../useLoader';
import { useReduceMotion } from '../useReduceMotion';
import { useSafeAction } from '../useSafeAction';

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
 * Screen 12: the meditation corner (docs/meditation.md, ADR 0017 to 0022).
 * Before a session: the meditation plant, this week against a gentle goal,
 * the calendar and the reminder. Choose a length, then breathe with the
 * sun, beside the grown bonsai and a stick of incense that burns down with
 * the session. The only words are "inspire" and "expire"; the end says well
 * done. From one whole minute, the day counts as meditated, finished or not.
 */
export function MeditationScreen({ navigation }: ScreenProps<'Meditation'>) {
  const tracker = useTracker();
  const safely = useSafeAction();
  const [stage, setStage] = useState<Stage>({ kind: 'choose' });
  const [vibrate, setVibrate] = useState(true);
  useEffect(() => {
    tracker.getSettings().then(
      (settings) => setVibrate(settings.meditationVibrate),
      () => undefined,
    );
  }, [tracker]);
  const changeVibrate = (on: boolean) => {
    setVibrate(on);
    void safely(() => tracker.saveSetting('meditationVibrate', on));
  };
  // The day counts from one whole minute; shorter, nothing is kept.
  const keep = useCallback(
    (seconds: number) =>
      void safely(
        () => tracker.recordMeditation(seconds),
        "Ta séance n'a pas pu être notée. Ce n'est pas grave : respire quand même.",
      ),
    [tracker, safely],
  );

  if (stage.kind === 'session') {
    const { meditation } = stage;
    return (
      <Session
        meditation={meditation}
        vibrate={vibrate}
        onEnd={() => {
          keep(meditation.seconds);
          setStage({ kind: 'end', meditation });
        }}
        onLeave={keep}
        onQuit={navigation.goBack}
      />
    );
  }
  if (stage.kind === 'end') return <End meditation={stage.meditation} onBack={navigation.goBack} />;

  return (
    <Choose
      vibrate={vibrate}
      onVibrate={changeVibrate}
      onStart={(minutes) => setStage({ kind: 'session', meditation: MEDITATIONS[minutes] })}
      onBack={navigation.goBack}
    />
  );
}

/**
 * Before a session (ADR 0022): the meditation plant, which grows one day
 * for every day meditated and never dies; this week against the goal; the
 * lengths; the calendar; the reminder.
 */
function Choose({
  vibrate,
  onVibrate,
  onStart,
  onBack,
}: {
  vibrate: boolean;
  onVibrate: (on: boolean) => void;
  onStart: (minutes: MeditationMinutes) => void;
  onBack: () => void;
}) {
  const colors = usePalette();
  const styles = useThemedStyles(makeStyles);
  const tracker = useTracker();
  const safely = useSafeAction();
  const { width } = useWindowDimensions();
  const load = useCallback(() => tracker.getMeditation(), [tracker]);
  const { data, reload } = useLoader(load);
  const [month, setMonth] = useState<MonthId | null>(null);
  const [reminder, setReminder] = useState<ReminderTime | null | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    meditationReminder().then(setReminder, () => setReminder(null));
  }, []);

  const plantScale = pixelScale(PLANT_GRID, { width: width * 0.42, height: 150 }, PixelRatio.get());
  const contentWidth = width - 28;

  async function changeGoal(goal: number) {
    await safely(() => tracker.saveSetting('meditationGoal', goal));
    await safely(reload);
  }

  async function changeReminder(time: ReminderTime | null) {
    try {
      if (!time) {
        await clearMeditationReminder();
        setReminder(null);
        setNotice(null);
        return;
      }
      const result = await setMeditationReminder(time);
      setReminder(result === 'on' ? time : null);
      setNotice(
        result === 'on'
          ? `Un rappel doux chaque jour à ${timeLabel(time)}.`
          : 'Les notifications sont refusées : tu peux les autoriser dans les réglages du téléphone.',
      );
    } catch {
      setNotice("Le rappel n'a pas pu être réglé.");
    }
  }

  if (!data) {
    return (
      <Screen>
        <TopBar backLabel="étagère" onBack={onBack} />
      </Screen>
    );
  }

  const { summary, days, today, plant } = data;
  const shown = month ?? monthOf(today);
  const first = days[0] ? monthOf(days[0].date) : monthOf(today);
  const goal = summary.week.goal;

  return (
    <Screen scroll>
      <TopBar backLabel="étagère" onBack={onBack} />

      <View style={styles.plant}>
        <PlantPixels image={plant} cellSize={plantScale.cellSize} />
        <NumberText style={styles.count}>
          {summary.days === 0
            ? 'Pas encore de jour médité'
            : `${summary.days} ${summary.days > 1 ? 'jours médités' : 'jour médité'}`}
        </NumberText>
        {summary.run >= 2 && (
          <NumberText style={styles.fact}>{`${summary.run} jours d'affilée`}</NumberText>
        )}
      </View>

      <Text style={styles.title}>Combien de temps ?</Text>
      <View style={styles.lengths}>
        {MEDITATION_LENGTHS.map((minutes) => (
          <Pressable
            key={minutes}
            accessibilityRole="button"
            onPress={() => onStart(minutes)}
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
          onValueChange={onVibrate}
          trackColor={{ false: colors.line, true: colors.accent }}
          thumbColor={colors.background}
          accessibilityLabel="Vibrer au rythme du souffle"
        />
      </View>

      <Text style={styles.title}>Cette semaine</Text>
      <View
        style={styles.week}
        accessible
        accessibilityLabel={`${summary.week.done} jours sur ${goal} cette semaine`}
      >
        {summary.week.meditated.map((done, i) => (
          <View key={i} style={[styles.weekDay, done && styles.weekDone]}>
            <Text style={[styles.weekLetter, done && styles.weekLetterDone]}>
              {WEEK_LETTERS[i]}
            </Text>
          </View>
        ))}
      </View>
      <NumberText style={styles.fact}>
        {summary.week.done >= goal
          ? `${summary.week.done} jours sur ${goal} : objectif atteint`
          : `${summary.week.done} ${summary.week.done > 1 ? 'jours' : 'jour'} sur ${goal}`}
      </NumberText>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Objectif par semaine</Text>
        <View style={styles.stepper}>
          <Chip
            big
            label="−"
            disabled={goal <= MEDITATION_GOAL.min}
            onPress={() => void changeGoal(goal - 1)}
          />
          <NumberText style={styles.goal}>{`${goal} ${goal > 1 ? 'jours' : 'jour'}`}</NumberText>
          <Chip
            big
            label="+"
            disabled={goal >= MEDITATION_GOAL.max}
            onPress={() => void changeGoal(goal + 1)}
          />
        </View>
      </View>

      <MeditationCalendar
        month={shown}
        weeks={meditationMonth(shown, days, today)}
        width={contentWidth}
        onPrevious={shown > first ? () => setMonth(previousMonth(shown)) : null}
        onNext={shown < monthOf(today) ? () => setMonth(nextMonth(shown)) : null}
      />

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Rappel pour méditer</Text>
        <Switch
          value={!!reminder}
          disabled={reminder === undefined}
          onValueChange={(on) => void changeReminder(on ? MEDITATION_TIMES[2] : null)}
          trackColor={{ false: colors.line, true: colors.accent }}
          thumbColor={colors.background}
          accessibilityLabel="Rappel pour méditer, une fois par jour"
        />
      </View>
      {reminder && (
        <View style={styles.times}>
          {MEDITATION_TIMES.map((time) => (
            <Chip
              key={timeLabel(time)}
              big
              label={timeLabel(time)}
              selected={time.hour === reminder.hour && time.minute === reminder.minute}
              onPress={() => void changeReminder(time)}
            />
          ))}
        </View>
      )}
      {notice && <Text style={styles.notice}>{notice}</Text>}
    </Screen>
  );
}

const WEEK_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

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
  /** Left before the end (Terminer, back): the seconds spent. */
  onLeave: (seconds: number) => void;
  onQuit: () => void;
}

function Session({ meditation, vibrate, onEnd, onLeave, onQuit }: SessionProps) {
  const styles = useThemedStyles(makeStyles);
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const scale = useSceneScale();
  const [controls, setControls] = useState(true);
  const t = useSessionClock(true);
  const over = isOver(meditation, t);

  const ended = useRef(false);
  // Leaving before the end, whatever the way (Terminer, swipe back, the
  // back button): the time spent is kept when the session goes away.
  const spent = useRef({ t: 0, onLeave });
  useEffect(() => {
    spent.current = { t, onLeave };
  }, [t, onLeave]);
  useEffect(
    () => () => {
      if (!ended.current) spent.current.onLeave(spent.current.t);
    },
    [],
  );
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
    plant: { alignItems: 'center', gap: 4, paddingVertical: spacing.sm },
    count: { fontFamily: fonts.display, fontSize: 17, color: colors.text, textAlign: 'center' },
    fact: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center' },
    week: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
    weekDay: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    weekDone: { backgroundColor: colors.clean },
    weekLetter: { fontFamily: fonts.display, fontSize: 13, color: colors.text },
    weekLetterDone: { color: colors.onAccent },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    goal: {
      fontFamily: fonts.display,
      fontSize: 15,
      color: colors.text,
      minWidth: 64,
      textAlign: 'center',
    },
    times: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    notice: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
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
