import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { MAX_GROWTH_DAYS, renderPlant, SPECIES_IDS, type SpeciesId } from '../../domain';
import { PlantCanvas } from '../plant/PlantCanvas';
import { colors, fonts, spacing } from '../theme/tokens';

interface LabScreenProps {
  onBack: () => void;
}

const clampDays = (value: number) => Math.min(MAX_GROWTH_DAYS, Math.max(1, value));
const parseNumber = (text: string) => Number.parseInt(text, 10) || 0;

/**
 * Development-only playground: draws a plant straight from the generator,
 * without the database, to tune species and check the rendering.
 */
export function LabScreen({ onBack }: LabScreenProps) {
  const { width } = useWindowDimensions();
  const [species, setSpecies] = useState<SpeciesId>(SPECIES_IDS[0] ?? 'monstera');
  const [seedText, setSeedText] = useState('42');
  const [days, setDays] = useState(30);
  const [relapseA, setRelapseA] = useState('');
  const [relapseB, setRelapseB] = useState('');

  const seed = parseNumber(seedText);
  const relapseDays = [parseNumber(relapseA), parseNumber(relapseB)].filter((d) => d > 0);

  const image = useMemo(
    () => renderPlant({ species, seed, elapsedDays: days, relapseDays }),
    // relapseDays is rebuilt each render; depend on its inputs instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [species, seed, days, relapseA, relapseB],
  );

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>‹ Retour</Text>
      </Pressable>
      <Text style={styles.title}>Labo</Text>

      <PlantCanvas image={image} maxWidth={width - spacing.lg * 2} maxHeight={360} />
      <Text style={styles.caption}>
        {species} · graine {seed} · jour {days} · pot {image.potStyle}
        {relapseDays.length > 0 ? ` · rechutes ${relapseDays.join(', ')}` : ''}
      </Text>

      <Text style={styles.label}>Espèce</Text>
      <View style={styles.row}>
        {SPECIES_IDS.map((id) => (
          <Chip key={id} label={id} selected={id === species} onPress={() => setSpecies(id)} />
        ))}
      </View>

      <Text style={styles.label}>Graine</Text>
      <View style={styles.row}>
        <TextInput
          value={seedText}
          onChangeText={(text) => setSeedText(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          style={[styles.input, styles.grow]}
        />
        <Chip
          label="Au hasard"
          onPress={() => setSeedText(String(Math.floor(Math.random() * 2 ** 32)))}
        />
      </View>

      <Text style={styles.label}>
        Jours : {days} / {MAX_GROWTH_DAYS}
      </Text>
      <View style={styles.row}>
        {[-10, -1, 1, 10].map((step) => (
          <Chip
            key={step}
            label={step > 0 ? `+${step}` : String(step)}
            onPress={() => setDays((d) => clampDays(d + step))}
          />
        ))}
        <Chip label="1" onPress={() => setDays(1)} />
        <Chip label={String(MAX_GROWTH_DAYS)} onPress={() => setDays(MAX_GROWTH_DAYS)} />
      </View>

      <Text style={styles.label}>Jours de rechute (vide = aucun)</Text>
      <View style={styles.row}>
        <DayInput value={relapseA} onChange={setRelapseA} />
        <DayInput value={relapseB} onChange={setRelapseB} />
      </View>
    </ScrollView>
  );
}

function DayInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
      keyboardType="number-pad"
      placeholder="jour"
      placeholderTextColor={colors.muted}
      style={[styles.input, styles.grow]}
    />
  );
}

function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  back: { fontFamily: fonts.body, fontSize: 16, color: colors.muted },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  caption: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center' },
  label: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  grow: { flex: 1 },
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.sm,
  },
  chip: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.text },
  chipLabelSelected: { color: colors.onAccent },
});
