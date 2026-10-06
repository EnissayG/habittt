import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { addDays, HABIT_NAME_MAX_LENGTH, type HabitId } from '../../domain';
import { Button } from '../components/Button';
import { createHabitErrorMessage, days } from '../messages';
import { colors, fonts, spacing } from '../theme/tokens';
import { useTracker } from '../TrackerContext';

interface NewHabitScreenProps {
  onCreated: (id: HabitId) => void;
  onCancel: () => void;
}

export function NewHabitScreen({ onCreated, onCancel }: NewHabitScreenProps) {
  const tracker = useTracker();
  const [name, setName] = useState('');
  const [daysAgoText, setDaysAgoText] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const daysAgo = Number.parseInt(daysAgoText, 10) || 0;
  const setDaysAgo = (value: number) => setDaysAgoText(String(Math.max(0, value)));

  async function submit() {
    setSaving(true);
    const result = await tracker.addHabit({ name, startDate: addDays(tracker.today(), -daysAgo) });
    setSaving(false);
    if (result.ok) onCreated(result.value.id);
    else setError(createHabitErrorMessage[result.error]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pressable onPress={onCancel} accessibilityRole="button">
        <Text style={styles.back}>‹ Annuler</Text>
      </Pressable>

      <Text style={styles.title}>Nouvelle habitude</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Ce que tu arrêtes</Text>
        <TextInput
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(null);
          }}
          placeholder="ex. fumer, le sucre…"
          placeholderTextColor={colors.muted}
          maxLength={HABIT_NAME_MAX_LENGTH + 10}
          autoFocus
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Arrêté depuis</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.stepButton} onPress={() => setDaysAgo(daysAgo - 1)}>
            <Text style={styles.stepLabel}>−</Text>
          </Pressable>
          <TextInput
            value={daysAgoText}
            onChangeText={(text) => setDaysAgoText(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            style={[styles.input, styles.stepInput]}
          />
          <Pressable style={styles.stepButton} onPress={() => setDaysAgo(daysAgo + 1)}>
            <Text style={styles.stepLabel}>+</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>
          {daysAgo === 0 ? "Je commence aujourd'hui." : `J'ai arrêté il y a ${days(daysAgo)}.`}
        </Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Button label="Commencer" onPress={submit} disabled={saving} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  back: { fontFamily: fonts.body, fontSize: 16, color: colors.muted },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  field: { gap: spacing.sm },
  label: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  input: {
    fontFamily: fonts.body,
    fontSize: 18,
    color: colors.text,
    backgroundColor: colors.field,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.md,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepButton: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderColor: colors.text,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  stepInput: { flex: 1, textAlign: 'center' },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  error: { fontFamily: fonts.body, fontSize: 14, color: colors.text },
});
