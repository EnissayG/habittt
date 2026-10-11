import { useCallback, useState } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, View } from 'react-native';

import { usedRows, type HabitStatus, type PlantImage } from '../../domain';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { Sheet } from '../components/Sheet';
import { TopBar } from '../components/TopBar';
import type { ScreenProps } from '../navigation/types';
import { PlantPixels } from '../plant/PlantCanvas';
import { colors, fonts, spacing } from '../theme/tokens';
import { useTracker } from '../TrackerContext';
import { useScreenData } from '../useLoader';

type Exit = Exclude<HabitStatus, 'shelf'>;

const EXITS: { exit: Exit; title: string; text: string }[] = [
  {
    exit: 'garden',
    title: "Elle rejoint l'herbier",
    text: "Je n'ai plus besoin de la suivre. Ses vies restent visibles, avec ses notes.",
  },
  {
    exit: 'given',
    title: 'Je la donne',
    text: "J'arrête de la suivre pour l'instant. Elle quitte l'étagère.",
  },
];

/**
 * Screen 9: what becomes of a plant taken off the shelf. Reached by a long
 * press on the shelf or from the habit's menu, never by a swipe. Confirming
 * is the confirmation; erasing everything asks a second time.
 */
export function RetireScreen({ navigation, route }: ScreenProps<'Retire'>) {
  const { id } = route.params;
  const tracker = useTracker();
  const load = useCallback(() => tracker.getHabit(id), [tracker, id]);
  const { data: detail } = useScreenData(load);
  const [exit, setExit] = useState<Exit>('garden');
  const [confirmErase, setConfirmErase] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!detail) return <Screen>{null}</Screen>;

  async function run(action: () => Promise<{ ok: boolean }>) {
    setBusy(true);
    try {
      const result = await action();
      if (!result.ok) {
        setConfirmErase(false);
        setError("Ce n'est plus possible : cette plante a déjà quitté l'étagère.");
        return;
      }
      navigation.navigate('Shelf');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      scroll
      footer={
        <>
          <Button
            label="Confirmer"
            disabled={busy}
            onPress={() => void run(() => tracker.retireHabit(id, exit))}
          />
          <Button
            label="Tout effacer définitivement"
            variant="quiet"
            disabled={busy}
            onPress={() => setConfirmErase(true)}
          />
        </>
      }
      overlay={
        <Sheet visible={confirmErase} onClose={() => setConfirmErase(false)}>
          <Text style={styles.sheetTitle}>Tout effacer ?</Text>
          <Text style={styles.body}>
            {`« ${detail.habit.name} », sa plante, ses notes et son histoire seront effacés de ce téléphone. On ne pourra pas revenir en arrière.`}
          </Text>
          <Button
            label="Effacer définitivement"
            variant="alt"
            disabled={busy}
            onPress={() => void run(() => tracker.eraseHabit(id))}
          />
          <Button label="Garder" variant="quiet" onPress={() => setConfirmErase(false)} />
        </Sheet>
      }
    >
      <TopBar backLabel={detail.habit.name} onBack={navigation.goBack} />
      <Text style={styles.title}>Que devient ta plante ?</Text>
      {EXITS.map((option) => (
        <ExitCard
          key={option.exit}
          plant={detail.plant}
          title={option.title}
          text={option.text}
          selected={exit === option.exit}
          onPress={() => setExit(option.exit)}
        />
      ))}
      {error && <Text style={styles.body}>{error}</Text>}
    </Screen>
  );
}

interface ExitCardProps {
  plant: PlantImage;
  title: string;
  text: string;
  selected: boolean;
  onPress: () => void;
}

function ExitCard({ plant, title, text, selected, onPress }: ExitCardProps) {
  const ratio = PixelRatio.get();
  const cellSize = Math.max(1, Math.round(ratio * 1.4)) / ratio;
  const { top } = usedRows(plant);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, selected && styles.selected]}
    >
      <PlantPixels image={plant} cellSize={cellSize} rows={{ from: top, to: plant.height }} />
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBody}>{text}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.field,
    borderWidth: 2,
    borderColor: colors.line,
  },
  selected: { borderColor: colors.strong },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.text },
  cardBody: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, lineHeight: 17 },
  sheetTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 18 },
});
