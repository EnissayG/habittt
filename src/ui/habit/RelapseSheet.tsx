import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { addDays, daysBetween, type HabitId, type LocalDate } from '../../domain';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Sheet } from '../components/Sheet';
import { dayMonth, fromPickerDate, toPickerDate } from '../format';
import { toggleRelapseErrorMessage } from '../messages';
import { colors, fonts } from '../theme/tokens';
import { useTracker } from '../TrackerContext';

interface RelapseSheetProps {
  habitId: HabitId;
  startDate: LocalDate;
  visible: boolean;
  onClose: () => void;
  onRecorded: () => void;
}

type When = 'today' | 'yesterday' | 'other';

/** Screen 8: a relapse, said calmly. No red, no exclamation mark. */
export function RelapseSheet({
  habitId,
  startDate,
  visible,
  onClose,
  onRecorded,
}: RelapseSheetProps) {
  const tracker = useTracker();
  const today = tracker.today();
  const yesterday = addDays(today, -1);
  const [when, setWhen] = useState<When>('today');
  const [otherDate, setOtherDate] = useState<LocalDate | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canYesterday = daysBetween(startDate, yesterday) >= 0;
  const date = when === 'today' ? today : when === 'yesterday' ? yesterday : (otherDate ?? today);

  function close() {
    setWhen('today');
    setOtherDate(null);
    setPickerOpen(false);
    setError(null);
    onClose();
  }

  async function record() {
    const result = await tracker.recordRelapse(habitId, date);
    if (!result.ok) {
      setError(toggleRelapseErrorMessage[result.error]);
      return;
    }
    close();
    onRecorded();
  }

  return (
    <Sheet visible={visible} onClose={close}>
      <Text style={styles.title}>Ça arrive.</Text>
      <Text style={styles.body}>
        Ta plante garde une trace de ce jour et continue de pousser. Ton compteur repart, pas ta
        plante.
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
          label={when === 'other' && otherDate ? `Le ${dayMonth(otherDate)}` : 'Un autre jour'}
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

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
