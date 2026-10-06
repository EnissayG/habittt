import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { PlantImage } from '../../domain';
import type { ScreenProps } from '../navigation/types';
import { PlantCanvas } from '../plant/PlantCanvas';
import { colors, fonts } from '../theme/tokens';
import { useTracker } from '../TrackerContext';
import { useLoader } from '../useLoader';

/** How long the opening screen stays (mockup: one to two seconds). */
const OPENING_MS = 1500;

/** Screen 1: the oldest habit's plant (or a grown bonsai) and the name. */
export function OpeningScreen({ navigation }: ScreenProps<'Opening'>) {
  const tracker = useTracker();
  const load = useCallback(() => tracker.openingPlant(), [tracker]);
  const { data: plant } = useLoader<PlantImage>(load);
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setElapsed(true), OPENING_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (elapsed) navigation.replace('Shelf');
  }, [elapsed, navigation]);

  return (
    <View style={styles.screen}>
      {plant && <PlantCanvas image={plant} maxWidth={200} maxHeight={267} />}
      <Text style={styles.logo}>habittt</Text>
      <Text style={styles.tagline}>une plante par habitude</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logo: { fontFamily: fonts.displayBold, fontSize: 44, color: colors.text },
  tagline: { fontFamily: fonts.display, fontSize: 14, color: colors.muted },
});
