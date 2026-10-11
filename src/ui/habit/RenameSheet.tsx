import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { HABIT_NAME_MAX_LENGTH, type HabitId } from '../../domain';
import { Button } from '../components/Button';
import { Sheet } from '../components/Sheet';
import { renameErrorMessage } from '../messages';
import { colors, fonts } from '../theme/tokens';
import { useTracker } from '../TrackerContext';

interface RenameSheetProps {
  habitId: HabitId;
  name: string;
  onClose: () => void;
  onDone: () => void;
}

/** Renames a habit (from its menu). Mount it when it opens. */
export function RenameSheet({ habitId, name, onClose, onDone }: RenameSheetProps) {
  const tracker = useTracker();
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const result = await tracker.renameHabit(habitId, value);
      if (!result.ok) {
        setError(renameErrorMessage[result.error]);
        return;
      }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible onClose={onClose}>
      <Text style={styles.title}>Renommer</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        maxLength={HABIT_NAME_MAX_LENGTH * 2}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => void save()}
        style={styles.field}
        accessibilityLabel="Nom de l'habitude"
      />
      {error && <Text style={styles.body}>{error}</Text>}
      <Button label="Enregistrer" disabled={busy} onPress={() => void save()} />
      <Button label="Annuler" variant="quiet" onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
  field: {
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  body: { fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 18 },
});
