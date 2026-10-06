// Composition root: the only place allowed to wire ui/, domain/ and data/ together.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { openHabitDatabase } from './src/data/database';
import { SqliteHabitRepository, SqliteRelapseRepository } from './src/data/sqliteRepositories';
import { generateId, generateSeed, systemClock } from './src/data/system';
import { createHabitTracker, type HabitTracker } from './src/domain';
import { AppNavigator } from './src/ui/navigation/AppNavigator';
import { colors, fonts } from './src/ui/theme/tokens';
import { TrackerProvider } from './src/ui/TrackerContext';
import { useAppFonts } from './src/ui/theme/useAppFonts';

async function createTracker(): Promise<HabitTracker> {
  const db = await openHabitDatabase();
  return createHabitTracker({
    habits: new SqliteHabitRepository(db),
    relapses: new SqliteRelapseRepository(db),
    clock: systemClock,
    generateId,
    generateSeed,
  });
}

export default function App() {
  const fontsReady = useAppFonts();
  const [tracker, setTracker] = useState<HabitTracker | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    createTracker()
      .then(setTracker)
      .catch((e: unknown) => setFailure(String(e)));
  }, []);

  if (failure) {
    return (
      <View style={styles.splash}>
        <Text style={styles.error}>{`Erreur au démarrage :\n${failure}`}</Text>
      </View>
    );
  }

  if (!tracker || !fontsReady) {
    // The name needs the pixel font: show it only once the font is ready.
    return (
      <View style={styles.splash}>{fontsReady && <Text style={styles.text}>habittt</Text>}</View>
    );
  }

  return (
    <TrackerProvider tracker={tracker}>
      <AppNavigator />
    </TrackerProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: { fontFamily: fonts.displayBold, fontSize: 44, color: colors.text, textAlign: 'center' },
  error: { fontFamily: fonts.body, fontSize: 16, color: colors.text, textAlign: 'center' },
});
