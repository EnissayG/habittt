import { useCallback, useMemo, useState } from 'react';
import { PixelRatio, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import {
  arrangeShelf,
  composeRoom,
  drawFloor,
  drawWindow,
  FLOOR_ROWS,
  planRoom,
  PLANT_GRID,
  MAX_GROWTH_DAYS,
  renderPlant,
  SPECIES_IDS,
  WINDOW_VIEWS,
  type ScenePixel,
  type SpeciesId,
  type WindowView,
} from '../../domain';
import { Chip } from '../components/Chip';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import type { ScreenProps } from '../navigation/types';
import { describePlant, isRare, potLabel, SPECIES_LABELS } from '../plant/labels';
import { PixelCanvas } from '../plant/PixelCanvas';
import { PlantCanvas } from '../plant/PlantCanvas';
import { sceneColor } from '../theme/scenePalette';
import { colors, fonts, spacing } from '../theme/tokens';

const clampDays = (value: number) => Math.min(MAX_GROWTH_DAYS, Math.max(1, value));
const parseNumber = (text: string) => Number.parseInt(text, 10) || 0;

const VIEW_LABELS: Record<WindowView, string> = {
  day: 'jour',
  evening: 'soir',
  night: 'nuit',
  winter: 'hiver',
};

/**
 * Development-only playground: draws a plant straight from the generator,
 * without the database, and the window and floor in any view.
 */
export function LabScreen({ navigation }: ScreenProps<'Lab'>) {
  const { width } = useWindowDimensions();
  const [species, setSpecies] = useState<SpeciesId>(SPECIES_IDS[0] ?? 'monstera');
  const [seedText, setSeedText] = useState('42');
  const [days, setDays] = useState(30);
  const [relapseA, setRelapseA] = useState('');
  const [relapseB, setRelapseB] = useState('');
  const [view, setView] = useState<WindowView>('day');

  const seed = parseNumber(seedText);
  const relapseDays = [parseNumber(relapseA), parseNumber(relapseB)].filter((d) => d > 0);

  const image = useMemo(
    () => renderPlant({ species, seed, elapsedDays: days, relapseDays }),
    // relapseDays is rebuilt each render; depend on its inputs instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [species, seed, days, relapseA, relapseB],
  );
  const windowImage = useMemo(() => drawWindow(view), [view]);
  // The floor under a wall holding this plant beside the window or on its shelf.
  const room = useMemo(() => {
    const layout = arrangeShelf([{ id: 'lab', species, createdAt: '' }]);
    const plan = planRoom({
      layout,
      plants: { lab: image },
      window: windowImage,
      pageWidth: PLANT_GRID.width * 3,
      labelRows: 0,
    });
    return drawFloor({ room: composeRoom(plan), rows: FLOOR_ROWS.max });
  }, [species, image, windowImage]);
  const sceneColorOf = useCallback((pixel: ScenePixel) => sceneColor(pixel, view), [view]);

  const ratio = PixelRatio.get();
  const sceneCell =
    Math.max(1, Math.floor(((width - 28) * ratio) / (PLANT_GRID.width * 3))) / ratio;

  return (
    <Screen scroll>
      <TopBar backLabel="étagère" onBack={navigation.goBack} right="Labo" />

      <PlantCanvas image={image} maxWidth={width - 28} maxHeight={360} />
      <Text style={styles.description}>
        {describePlant(image)}
        {isRare(image) ? ' · rare' : ''}
      </Text>
      <Text style={styles.caption}>
        {potLabel(image.genome)}
        {image.genome.mirrored ? ' · en miroir' : ''} · graine {seed} · jour {days}
        {relapseDays.length > 0 ? ` · rechutes ${relapseDays.join(', ')}` : ''}
      </Text>

      <Text style={styles.label}>Espèce</Text>
      <View style={styles.row}>
        {SPECIES_IDS.map((id) => (
          <Chip
            key={id}
            big
            label={SPECIES_LABELS[id]}
            selected={id === species}
            onPress={() => setSpecies(id)}
          />
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
          big
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
            big
            label={step > 0 ? `+${step}` : String(step)}
            onPress={() => setDays((d) => clampDays(d + step))}
          />
        ))}
        <Chip big label="1" onPress={() => setDays(1)} />
        <Chip big label={String(MAX_GROWTH_DAYS)} onPress={() => setDays(MAX_GROWTH_DAYS)} />
      </View>

      <Text style={styles.label}>Jours de rechute (vide = aucun)</Text>
      <View style={styles.row}>
        <DayInput value={relapseA} onChange={setRelapseA} />
        <DayInput value={relapseB} onChange={setRelapseB} />
      </View>

      <Text style={styles.label}>Vue de la fenêtre</Text>
      <View style={styles.row}>
        {WINDOW_VIEWS.map((v) => (
          <Chip
            key={v}
            big
            label={VIEW_LABELS[v]}
            selected={v === view}
            onPress={() => setView(v)}
          />
        ))}
      </View>
      <View style={styles.scene}>
        <PixelCanvas grid={windowImage} colorOf={sceneColorOf} cellSize={sceneCell} />
        <PixelCanvas grid={room} colorOf={sceneColorOf} cellSize={sceneCell} />
      </View>
    </Screen>
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

const styles = StyleSheet.create({
  description: { fontFamily: fonts.display, fontSize: 15, color: colors.text, textAlign: 'center' },
  caption: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center' },
  label: { fontFamily: fonts.display, fontSize: 13, color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  grow: { flex: 1 },
  input: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.field,
    borderWidth: 2,
    borderColor: colors.strong,
    padding: spacing.sm,
  },
  scene: { alignItems: 'center', gap: spacing.sm },
});
