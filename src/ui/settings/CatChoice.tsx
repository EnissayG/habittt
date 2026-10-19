import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CAT_BREEDS,
  CAT_FEET,
  CAT_FRAMES,
  drawCat,
  type CatBreed,
  type CatTone,
} from '../../domain';
import { PixelCanvas } from '../plant/PixelCanvas';
import { CAT_COLORS } from '../theme/scenePalette';
import { useThemedStyles } from '../theme/ThemeContext';
import { fonts, spacing, type Palette } from '../theme/tokens';

export const CAT_NAMES: Record<CatBreed | 'none', string> = {
  tabby: 'Roux',
  black: 'Noir',
  grey: 'Gris',
  calico: 'Calico',
  siamese: 'Siamois',
  none: 'Pas de chat',
};

/** The cat of the room, chosen in the settings (ADR 0025): each coat, sitting. */
export function CatChoice({
  value,
  onChange,
}: {
  value: CatBreed | 'none';
  onChange: (cat: CatBreed | 'none') => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.grid}>
      {[...CAT_BREEDS, 'none' as const].map((cat) => (
        <Pressable
          key={cat}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === cat }}
          accessibilityLabel={CAT_NAMES[cat]}
          onPress={() => onChange(cat)}
          style={({ pressed }) => [
            styles.tile,
            value === cat && styles.selected,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.picture}>{cat !== 'none' && <SittingCat breed={cat} />}</View>
          <Text style={[styles.label, value === cat && styles.selectedLabel]}>
            {CAT_NAMES[cat]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const SITTING: Record<CatBreed, ReturnType<typeof drawCat>> = Object.fromEntries(
  CAT_BREEDS.map((breed) => [breed, drawCat(breed, CAT_FRAMES.sit[0])]),
) as Record<CatBreed, ReturnType<typeof drawCat>>;

function SittingCat({ breed }: { breed: CatBreed }) {
  const colorOf = useCallback((tone: CatTone) => CAT_COLORS[breed][tone], [breed]);
  // Down to its paws: the rows below are for a tail lying on the floor.
  return (
    <PixelCanvas
      grid={SITTING[breed]}
      colorOf={colorOf}
      cellSize={2}
      rows={{ from: 0, to: CAT_FEET + 1 }}
    />
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.sm },
    tile: {
      width: 96,
      alignItems: 'center',
      gap: 4,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 4,
      borderBottomColor: colors.line,
    },
    selected: { backgroundColor: colors.strong, borderBottomColor: colors.text },
    pressed: { opacity: 0.6 },
    picture: { height: 36, justifyContent: 'flex-end' },
    label: { fontFamily: fonts.display, fontSize: 13, color: colors.text },
    selectedLabel: { color: colors.onStrong },
  });
