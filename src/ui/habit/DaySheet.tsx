import { StyleSheet, Text } from 'react-native';

import type { DayEntry, LocalDate } from '../../domain';
import { Button } from '../components/Button';
import { NumberText } from '../components/NumberText';
import { Sheet } from '../components/Sheet';
import { dayMonth } from '../format';
import { MOOD_LABELS } from '../messages';
import { colors, fonts } from '../theme/tokens';

interface DaySheetProps {
  day: DayEntry;
  today: LocalDate;
  /** Write or edit the day's note; absent when the plant is read only. */
  onWrite?: () => void;
  /** Note a relapse that day, or cancel it; absent when the plant is read only. */
  onToggleRelapse?: () => void;
  /** Why the last change was refused. */
  error?: string | null;
  onClose: () => void;
}

/** A day of the journal: what happened, its note, and what can be changed. */
export function DaySheet({ day, today, onWrite, onToggleRelapse, error, onClose }: DaySheetProps) {
  const { note } = day;
  const facts = [
    day.relapsed ? 'Une rechute ce jour-là.' : null,
    day.watered ? 'Arrosée ce jour-là.' : null,
  ].filter((fact): fact is string => fact !== null);

  return (
    <Sheet visible onClose={onClose}>
      <NumberText style={styles.title}>
        {`Jour ${day.index + 1} · ${dayMonth(day.date, today)}`}
      </NumberText>
      {facts.length > 0 && <Text style={styles.muted}>{facts.join(' ')}</Text>}
      {note ? (
        <>
          {note.mood && <Text style={styles.mood}>{MOOD_LABELS[note.mood]}</Text>}
          {note.text !== '' && <Text style={styles.body}>{note.text}</Text>}
        </>
      ) : (
        <Text style={styles.muted}>Pas de note ce jour-là.</Text>
      )}
      {error && <Text style={styles.body}>{error}</Text>}
      {onWrite && (
        <Button
          label={note ? 'Modifier la note' : 'Écrire une note'}
          variant="alt"
          onPress={onWrite}
        />
      )}
      {onToggleRelapse && (
        <Button
          label={day.relapsed ? 'Annuler la rechute' : 'Noter une rechute ce jour-là'}
          variant="quiet"
          onPress={onToggleRelapse}
        />
      )}
      <Button label="Fermer" variant="quiet" onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
  mood: { fontFamily: fonts.display, fontSize: 14, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 20 },
  muted: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, lineHeight: 18 },
});
