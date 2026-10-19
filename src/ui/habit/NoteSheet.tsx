import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  MOODS,
  NOTE_MAX_LENGTH,
  type HabitId,
  type LocalDate,
  type Mood,
  type Note,
} from '../../domain';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { NumberText } from '../components/NumberText';
import { PixelIcon } from '../components/PixelIcon';
import { Sheet } from '../components/Sheet';
import { dayMonth } from '../format';
import { MOOD_LABELS, noteErrorMessage } from '../messages';
import { fonts, spacing, type Palette } from '../theme/tokens';
import { usePalette, useThemedStyles } from '../theme/ThemeContext';
import { useTracker } from '../TrackerContext';

export type NoteSheetDone = 'watered' | 'saved';

interface NoteSheetProps {
  habitId: HabitId;
  date: LocalDate;
  /** Day number in the plant: 1 on the start day. */
  dayNumber: number;
  /** The day's note, to edit it. */
  initial: Note | null;
  /**
   * water: today's panel (screen 6), the note is optional and watering is
   * the action. edit: a past day's note, nothing is watered.
   */
  mode: 'water' | 'edit';
  /** Today was already watered: the action only saves the note. */
  alreadyWatered?: boolean;
  onClose: () => void;
  onDone: (done: NoteSheetDone) => void;
}

/**
 * Screen 6: water and write a note. Writing is always optional. Mount it
 * when it opens (its fields start from `initial`).
 */
export function NoteSheet({
  habitId,
  date,
  dayNumber,
  initial,
  mode,
  alreadyWatered = false,
  onClose,
  onDone,
}: NoteSheetProps) {
  const colors = usePalette();
  const styles = useThemedStyles(makeStyles);
  const tracker = useTracker();
  const [text, setText] = useState(initial?.text ?? '');
  const [mood, setMood] = useState<Mood | null>(initial?.mood ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(
    action: () => Promise<{ ok: true } | { ok: false; error: keyof typeof noteErrorMessage }>,
    done: NoteSheetDone,
  ) {
    setBusy(true);
    try {
      const result = await action();
      if (!result.ok) {
        setError(noteErrorMessage[result.error]);
        return;
      }
      onDone(done);
    } finally {
      setBusy(false);
    }
  }

  const note = { text, mood };
  const water = mode === 'water' && !alreadyWatered;

  return (
    <Sheet visible onClose={onClose}>
      <View style={styles.title}>
        <PixelIcon name="drop" size={19} />
        <NumberText style={styles.titleText}>
          {`Jour ${dayNumber} · ${dayMonth(date, tracker.today())}`}
        </NumberText>
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        maxLength={NOTE_MAX_LENGTH}
        placeholder="Écris ce que tu veux, ou rien."
        placeholderTextColor={colors.muted}
        style={styles.area}
        accessibilityLabel="Note du jour"
      />
      <View style={styles.chips}>
        {MOODS.map((value) => (
          <Chip
            key={value}
            label={MOOD_LABELS[value]}
            selected={mood === value}
            onPress={() => setMood(mood === value ? null : value)}
          />
        ))}
      </View>
      {error && <Text style={styles.body}>{error}</Text>}
      {water ? (
        <>
          <Button
            label="Arroser"
            disabled={busy}
            onPress={() => void run(() => tracker.waterToday(habitId, note), 'watered')}
          />
          <Button
            label="Arroser sans rien écrire"
            variant="quiet"
            disabled={busy}
            onPress={() => void run(() => tracker.waterToday(habitId), 'watered')}
          />
        </>
      ) : (
        <>
          <Button
            label="Enregistrer"
            disabled={busy}
            onPress={() => void run(() => tracker.saveNote(habitId, date, note), 'saved')}
          />
          <Button label="Annuler" variant="quiet" onPress={onClose} />
        </>
      )}
    </Sheet>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    title: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    titleText: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
    area: {
      minHeight: 96,
      maxHeight: 180,
      backgroundColor: colors.field,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 10,
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 19,
      color: colors.text,
      textAlignVertical: 'top',
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    body: { fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 18 },
  });
