import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { addDays, checkHabitName, HABIT_NAME_MAX_LENGTH, type LocalDate } from '../../domain';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { dayMonth, fromPickerDate, toPickerDate } from '../format';
import { createHabitErrorMessage } from '../messages';
import type { ScreenProps } from '../navigation/types';
import { colors, fonts } from '../theme/tokens';
import { useTracker } from '../TrackerContext';

type When = 'today' | 'yesterday' | 'other';

/** Screen 3: what the user quits, and since when. */
export function NewHabitNameScreen({ navigation }: ScreenProps<'NewHabitName'>) {
  const tracker = useTracker();
  const today = tracker.today();
  const [name, setName] = useState('');
  const [when, setWhen] = useState<When>('today');
  const [otherDate, setOtherDate] = useState<LocalDate | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDate: LocalDate =
    when === 'today' ? today : when === 'yesterday' ? addDays(today, -1) : (otherDate ?? today);

  function next() {
    const nameError = checkHabitName(name);
    if (nameError) {
      setError(createHabitErrorMessage[nameError]);
      return;
    }
    navigation.navigate('PlantChoice', { name, startDate });
  }

  return (
    <Screen scroll footer={<Button label="Choisir ma plante" onPress={next} />}>
      <TopBar backLabel="étagère" onBack={navigation.goBack} right="1 / 2" />
      <Text style={styles.title}>Qu&apos;est-ce que tu arrêtes ?</Text>
      <TextInput
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholder="ex. Fumer"
        placeholderTextColor={colors.muted}
        maxLength={HABIT_NAME_MAX_LENGTH + 10}
        autoFocus
        returnKeyType="next"
        onSubmitEditing={next}
        style={styles.field}
      />
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.label}>Depuis quand ?</Text>
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
          onPress={() => setWhen('yesterday')}
        />
        <Chip
          big
          label={when === 'other' && otherDate ? `Le ${dayMonth(otherDate)}` : 'Une autre date'}
          selected={when === 'other'}
          onPress={() => setPickerOpen(true)}
        />
      </View>
      {pickerOpen && (
        <DateTimePicker
          value={toPickerDate(otherDate ?? addDays(today, -7))}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={toPickerDate(today)}
          onChange={(event, date) => {
            if (Platform.OS !== 'ios') setPickerOpen(false);
            if (event.type === 'set' && date) {
              setOtherDate(fromPickerDate(date) as LocalDate);
              setWhen('other');
            }
          }}
        />
      )}
      {pickerOpen && Platform.OS === 'ios' && (
        <Button label="Valider la date" variant="alt" onPress={() => setPickerOpen(false)} />
      )}
      <Text style={styles.help}>
        Si tu as déjà arrêté depuis un moment, ta plante commencera à la bonne taille.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text, lineHeight: 26 },
  field: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.field,
    borderWidth: 2,
    borderColor: colors.strong,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  label: { fontFamily: fonts.display, fontSize: 13, color: colors.text, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  help: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
});
