// Composition root: the only place allowed to wire ui/, domain/ and data/ together.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { openHabitDatabase } from './src/data/database';
import { SqliteHabitRepository, SqliteRelapseRepository } from './src/data/sqliteRepositories';
import { generateId, generateSeed, systemClock } from './src/data/system';
import { createHabitTracker, type HabitTracker } from './src/domain';
import { Root } from './src/ui/Root';
import { colors, fonts } from './src/ui/theme/tokens';
import { TrackerProvider } from './src/ui/TrackerContext';

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
  const [tracker, setTracker] = useState<HabitTracker | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    createTracker()
      .then(setTracker)
      .catch((e: unknown) => setFailure(String(e)));
  }, []);

  if (!tracker) {
    return (
      <View style={styles.splash}>
        <Text style={styles.text}>{failure ? `Erreur au démarrage :\n${failure}` : 'habittt'}</Text>
      </View>
    );
  }

  return (
    <TrackerProvider tracker={tracker}>
      <Root />
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
  text: { fontFamily: fonts.mono, fontSize: 20, color: colors.text, textAlign: 'center' },
});
