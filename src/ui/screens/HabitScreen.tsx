import { useCallback, useEffect, useState } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { daysBetween, noteMonth, usedRows } from '../../domain';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { NumberText } from '../components/NumberText';
import { PixelIcon } from '../components/PixelIcon';
import { Screen } from '../components/Screen';
import { Sheet } from '../components/Sheet';
import { TopBar } from '../components/TopBar';
import { dayMonth, days, lowerFirst } from '../format';
import { FallingDrop } from '../habit/FallingDrop';
import { NoteSheet } from '../habit/NoteSheet';
import { RelapseSheet } from '../habit/RelapseSheet';
import { RenameSheet } from '../habit/RenameSheet';
import type { ScreenProps } from '../navigation/types';
import { MOOD_LABELS, replantErrorMessage } from '../messages';
import { describePlant } from '../plant/labels';
import { LivingPlant } from '../plant/LivingPlant';
import { pixelScale } from '../plant/pixelScale';
import { fonts, type Palette } from '../theme/tokens';
import { useThemedStyles } from '../theme/ThemeContext';
import { useTracker } from '../TrackerContext';
import { useScreenData } from '../useLoader';

/** Height the counter needs (big number and its label), in points. */
const COUNTER_HEIGHT = 84;

/** A day is a plant day number: 1 on the start day. */
type OpenSheet =
  | 'menu'
  | 'water'
  | 'relapse'
  | 'rename'
  | { kind: 'note'; day: number }
  | { kind: 'askNote'; day: number }
  | null;

/** The chevron says the chip opens something (the journal). */
const notesLabel = (count: number) => `${count} ${count > 1 ? 'notes' : 'note'} ›`;

/** How long a confirmation stays under the buttons. */
const NOTICE_MS = 3000;

/** Screen 5: one habit. The plant is the main element. */
export function HabitScreen({ navigation, route }: ScreenProps<'Habit'>) {
  const styles = useThemedStyles(makeStyles);
  const { id } = route.params;
  const tracker = useTracker();
  const { width, height } = useWindowDimensions();
  const load = useCallback(() => tracker.getHabit(id), [tracker, id]);
  const { data: detail, reload } = useScreenData(load);
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** Counts waterings in this visit: each one lets a drop fall. */
  const [drops, setDrops] = useState(0);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!detail) return <Screen>{null}</Screen>;

  async function replantPlant() {
    const result = await tracker.replantHabit(id);
    setNotice(result.ok ? 'Une nouvelle plante est en terre.' : replantErrorMessage[result.error]);
    await reload();
  }

  const { habit, stats, plant, life } = detail;
  // A relapse ended the current life (ADR 0013): no running counter, replant it.
  const dead = life.dead;
  const entryOf = (day: number) => detail.days[day - 1];
  const dayOpen = typeof sheet === 'object' && sheet !== null ? sheet : null;
  const openEntry = dayOpen ? entryOf(dayOpen.day) : undefined;
  const sceneWidth = width - 28;
  const scale = pixelScale(plant, { width: sceneWidth, height: height * 0.5 }, PixelRatio.get());

  // The counter sits in the empty space above the plant when there is room,
  // otherwise above the image.
  const freeAbove = usedRows(plant).top * scale.cellSize;
  const counterInside = freeAbove >= COUNTER_HEIGHT;
  const counter = (
    <View
      style={counterInside ? styles.counterOverlay : undefined}
      pointerEvents={counterInside ? 'none' : 'auto'}
    >
      <Text style={[styles.count, dead && styles.deadCount]}>{life.days}</Text>
      <Text style={[styles.countLabel, dead && styles.deadLabel]}>
        {dead
          ? `${life.days > 1 ? 'jours tenus' : 'jour tenu'} cette fois`
          : `${life.days > 1 ? 'jours' : 'jour'} sans ${lowerFirst(habit.name)}`}
      </Text>
    </View>
  );

  return (
    <Screen
      scroll
      footer={
        <>
          {dead ? (
            <>
              <Text style={styles.deadMessage}>
                Elle n&apos;a pas tenu cette fois. Tu peux replanter.
              </Text>
              <Button label="Replanter" onPress={() => void replantPlant()} />
            </>
          ) : (
            <>
              <Button label="Arroser et écrire une note" onPress={() => setSheet('water')} />
              <Button label="J'ai rechuté" variant="quiet" onPress={() => setSheet('relapse')} />
            </>
          )}
          {notice && (
            <Text style={styles.notice} accessibilityLiveRegion="polite">
              {notice}
            </Text>
          )}
        </>
      }
      overlay={
        <>
          <Sheet visible={sheet === 'menu'} onClose={() => setSheet(null)}>
            <Button
              label="Journal"
              variant="alt"
              onPress={() => {
                setSheet(null);
                navigation.navigate('Journal', { id });
              }}
            />
            <Button label="Renommer" variant="alt" onPress={() => setSheet('rename')} />
            <Button
              label="Retirer"
              variant="alt"
              onPress={() => {
                setSheet(null);
                navigation.navigate('Retire', { id });
              }}
            />
            <Button label="Fermer" variant="quiet" onPress={() => setSheet(null)} />
          </Sheet>

          {sheet === 'rename' && (
            <RenameSheet
              habitId={id}
              name={habit.name}
              onClose={() => setSheet(null)}
              onDone={() => {
                setSheet(null);
                setNotice('Le nom a changé.');
                void reload();
              }}
            />
          )}

          {sheet === 'water' && (
            <NoteSheet
              habitId={id}
              date={tracker.today()}
              dayNumber={detail.days.length}
              initial={detail.todayNote}
              mode="water"
              alreadyWatered={detail.wateredToday}
              onClose={() => setSheet(null)}
              onDone={(done) => {
                setSheet(null);
                if (done === 'watered') {
                  setNotice('Ta plante est arrosée.');
                  setDrops((n) => n + 1);
                } else setNotice("C'est noté.");
                void reload();
              }}
            />
          )}

          {dayOpen?.kind === 'askNote' && (
            <Sheet visible onClose={() => setSheet(null)}>
              <Text style={styles.sheetTitle}>{"Elle n'a pas tenu cette fois."}</Text>
              <Text style={styles.body}>
                {"Tu peux replanter. Veux-tu écrire quelques mots sur ce jour ? C'est facultatif."}
              </Text>
              <Button
                label="Écrire un mot"
                variant="alt"
                onPress={() => setSheet({ kind: 'note', day: dayOpen.day })}
              />
              <Button label="Plus tard" variant="quiet" onPress={() => setSheet(null)} />
            </Sheet>
          )}

          {dayOpen?.kind === 'note' && openEntry && (
            <NoteSheet
              habitId={id}
              date={openEntry.date}
              dayNumber={dayOpen.day}
              initial={openEntry.note}
              mode="edit"
              onClose={() => setSheet(null)}
              onDone={() => {
                setSheet(null);
                setNotice("C'est noté.");
                void reload();
              }}
            />
          )}

          <RelapseSheet
            habitId={id}
            startDate={habit.startDate}
            visible={sheet === 'relapse'}
            onClose={() => setSheet(null)}
            onChanged={(change, date) => {
              void reload();
              if (change === 'cancelled') {
                setNotice('Rechute annulée.');
                return;
              }
              // Screen 8: once noted, offer to write a few words about that day.
              setSheet({ kind: 'askNote', day: daysBetween(habit.startDate, date) + 1 });
            }}
          />
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="La plante : ouvrir son journal"
          onPress={() => navigation.navigate('Journal', { id })}
        >
          <LivingPlant image={plant} cellSize={scale.cellSize} />
        </Pressable>
        {counterInside && counter}
        <FallingDrop drop={drops} distance={freeAbove} />
      </View>
      <Text style={styles.hint}>Touche la plante pour ouvrir son journal.</Text>
      {detail.todayNote && (
        // Today's note stays in view under the plant; touching it edits it.
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Modifier la note du jour"
          onPress={() => setSheet({ kind: 'note', day: detail.days.length })}
          style={styles.note}
        >
          <Text style={styles.noteTitle}>Aujourd&apos;hui</Text>
          {detail.todayNote.mood && (
            <Text style={styles.noteMood}>{MOOD_LABELS[detail.todayNote.mood]}</Text>
          )}
          {detail.todayNote.text !== '' && (
            <Text style={styles.noteText}>{detail.todayNote.text}</Text>
          )}
        </Pressable>
      )}

      <View>
        <Text style={styles.name}>{habit.name}</Text>
        <Text style={styles.traits}>{describePlant(plant)}</Text>
      </View>
      <View style={styles.facts}>
        <Fact label="record" value={days(stats.longestStreak)} />
        <Fact label="depuis le" value={dayMonth(habit.startDate, tracker.today())} />
      </View>
      {detail.notes.length > 0 && (
        <View style={styles.chips}>
          <Chip
            label={notesLabel(detail.notes.length)}
            onPress={() =>
              navigation.navigate('Journal', { id, month: noteMonth(detail.days) ?? undefined })
            }
          />
        </View>
      )}
    </Screen>
  );
}

/** A fact about the habit: a quiet label above a value in the text color. */
function Fact({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View accessible accessibilityLabel={`${label} ${value}`}>
      <Text style={styles.factLabel}>{label}</Text>
      <NumberText style={styles.factValue}>{value}</NumberText>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    scene: { alignItems: 'center' },
    counterOverlay: { position: 'absolute', left: 0, top: 0 },
    count: { fontFamily: fonts.numeric, fontSize: 64, color: colors.text, lineHeight: 64 },
    countLabel: { fontFamily: fonts.display, fontSize: 14, color: colors.text },
    // A dead plant's days are kept, quieter: they no longer run.
    deadCount: { color: colors.muted },
    deadLabel: { color: colors.muted },
    deadMessage: {
      fontFamily: fonts.display,
      fontSize: 14,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 19,
    },
    name: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
    traits: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
    hint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    facts: { flexDirection: 'row', gap: 32 },
    factLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
    factValue: { fontFamily: fonts.display, fontSize: 18, lineHeight: 26, color: colors.text },
    note: {
      borderLeftWidth: 3,
      borderLeftColor: colors.note,
      backgroundColor: colors.surface,
      paddingVertical: 8,
      paddingHorizontal: 10,
      gap: 2,
    },
    // Only text goes on the surface color (TEXT_PAIRS).
    noteTitle: { fontFamily: fonts.display, fontSize: 13, color: colors.text },
    noteMood: { fontFamily: fonts.display, fontSize: 12, color: colors.text },
    noteText: { fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 18 },
    notice: { fontFamily: fonts.display, fontSize: 13, color: colors.muted, textAlign: 'center' },
    sheetTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
    body: { fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 18 },
  });
