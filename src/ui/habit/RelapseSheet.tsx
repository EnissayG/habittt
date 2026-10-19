import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { addDays, daysBetween, type HabitId, type LocalDate } from '../../domain';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { NumberText } from '../components/NumberText';
import { Sheet } from '../components/Sheet';
import { dayMonth, fromPickerDate, toPickerDate } from '../format';
import { toggleRelapseErrorMessage } from '../messages';
import { fonts, type Palette } from '../theme/tokens';
import { useThemedStyles } from '../theme/ThemeContext';
import { useTracker } from '../TrackerContext';
import { useSafeAction } from '../useSafeAction';

interface RelapseSheetProps {
  habitId: HabitId;
  startDate: LocalDate;
  visible: boolean;
  onClose: () => void;
  /** After a change: the relapse was noted, or the existing one cancelled. */
  onChanged: (change: 'recorded' | 'cancelled', date: LocalDate) => void;
}

type When = 'today' | 'yesterday' | 'other';

/** Screen 8: a relapse, said calmly. No red, no exclamation mark. */
export function RelapseSheet({
  habitId,
  startDate,
  visible,
  onClose,
  onChanged,
}: RelapseSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const tracker = useTracker();
  const safely = useSafeAction();
  const today = tracker.today();
  const yesterday = addDays(today, -1);
  const [when, setWhen] = useState<When>('today');
  const [otherDate, setOtherDate] = useState<LocalDate | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The chosen day already has a relapse: offer to cancel it. */
  const [exists, setExists] = useState(false);

  const canYesterday = daysBetween(startDate, yesterday) >= 0;
  const date = when === 'today' ? today : when === 'yesterday' ? yesterday : (otherDate ?? today);

  function close() {
    setWhen('today');
    setOtherDate(null);
    setPickerOpen(false);
    setError(null);
    setExists(false);
    onClose();
  }

  async function record() {
    const result = await safely(() => tracker.recordRelapse(habitId, date));
    if (!result) return;
    if (!result.ok) {
      setError(toggleRelapseErrorMessage[result.error]);
      return;
    }
    if (result.value === 'unchanged') {
      setExists(true);
      return;
    }
    close();
    onChanged('recorded', date);
  }

  async function cancelExisting() {
    const result = await safely(() => tracker.toggleRelapse(habitId, date));
    if (!result) return;
    if (!result.ok) {
      setError(toggleRelapseErrorMessage[result.error]);
      return;
    }
    close();
    onChanged('cancelled', date);
  }

  if (exists) {
    return (
      <Sheet visible={visible} onClose={close}>
        <Text style={styles.title}>Une rechute est déjà notée ce jour-là.</Text>
        <NumberText style={styles.body}>
          {`${date === today ? "C'est aujourd'hui." : `C'est le ${dayMonth(date, today)}.`} Une seule rechute compte par jour.`}
        </NumberText>
        {error && <Text style={styles.body}>{error}</Text>}
        <Button label="L'annuler" variant="alt" onPress={cancelExisting} />
        <Button label="Fermer" variant="quiet" onPress={close} />
      </Sheet>
    );
  }

  return (
    <Sheet visible={visible} onClose={close}>
      <Text style={styles.title}>Ça arrive.</Text>
      <Text style={styles.body}>
        Cette fois, ta plante n&apos;aura pas tenu. Tu pourras en replanter une nouvelle ; ses jours
        restent dans l&apos;herbier.
      </Text>
      <View style={styles.chips}>
        <Chip
          big
          label="Aujourd'hui"
          selected={when === 'today'}
          onPress={() => setWhen('today')}
        />
        <Chip
          big
          label="Hier"
          selected={when === 'yesterday'}
          disabled={!canYesterday}
          onPress={() => setWhen('yesterday')}
        />
        <Chip
          big
          label={
            when === 'other' && otherDate ? `Le ${dayMonth(otherDate, today)}` : 'Un autre jour'
          }
          selected={when === 'other'}
          onPress={() => setPickerOpen(true)}
        />
      </View>
      {pickerOpen && (
        <DateTimePicker
          value={toPickerDate(otherDate ?? today)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={toPickerDate(startDate)}
          maximumDate={toPickerDate(today)}
          onChange={(event, picked) => {
            if (Platform.OS !== 'ios') setPickerOpen(false);
            if (event.type === 'set' && picked) {
              setOtherDate(fromPickerDate(picked) as LocalDate);
              setWhen('other');
            }
          }}
        />
      )}
      {error && <Text style={styles.body}>{error}</Text>}
      <Button label="Noter la rechute" variant="alt" onPress={record} />
      <Button label="Annuler" variant="quiet" onPress={close} />
    </Sheet>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    title: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
    body: { fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 18 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  });
