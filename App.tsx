// Composition root: the only place allowed to wire ui/, domain/ and data/ together.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { openFreshDemoDatabase, openHabitDatabase } from './src/data/database';
import {
  SqliteHabitRepository,
  SqliteNoteRepository,
  SqliteRelapseRepository,
  SqliteReplantingRepository,
  SqliteWateringRepository,
} from './src/data/sqliteRepositories';
import { generateId, generateSeed, systemClock } from './src/data/system';
import { createHabitTracker, type HabitTracker } from './src/domain';
import { demoSeeds, seedDemo } from './src/ui/dev/demoData';
import { DevDataProvider, type DataSource, type DevData } from './src/ui/dev/DevData';
import { AppNavigator } from './src/ui/navigation/AppNavigator';
import { colors, fonts } from './src/ui/theme/tokens';
import { TrackerProvider } from './src/ui/TrackerContext';
import { useAppFonts } from './src/ui/theme/useAppFonts';

type Database = Awaited<ReturnType<typeof openHabitDatabase>>;

function trackerOn(db: Database, seeds: () => number = generateSeed): HabitTracker {
  return createHabitTracker({
    habits: new SqliteHabitRepository(db),
    relapses: new SqliteRelapseRepository(db),
    notes: new SqliteNoteRepository(db),
    waterings: new SqliteWateringRepository(db),
    replantings: new SqliteReplantingRepository(db),
    clock: systemClock,
    generateId,
    generateSeed: seeds,
  });
}

async function createTracker(): Promise<HabitTracker> {
  return trackerOn(await openHabitDatabase());
}

export default function App() {
  const fontsReady = useAppFonts();
  const [realTracker, setRealTracker] = useState<HabitTracker | null>(null);
  const [demo, setDemo] = useState<{ db: Database; tracker: HabitTracker } | null>(null);
  const [source, setSource] = useState<DataSource>('real');
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    createTracker()
      .then(setRealTracker)
      .catch((e: unknown) => setFailure(String(e)));
  }, []);

  // Development only: a demo database to test several walls.
  const devData: DevData = {
    source,
    fillDemo: async () => {
      await demo?.db.closeAsync();
      const db = await openFreshDemoDatabase();
      const tracker = trackerOn(db, demoSeeds());
      await seedDemo(tracker, new SqliteReplantingRepository(db));
      setDemo({ db, tracker });
      setSource('demo');
    },
    showRealData: () => setSource('real'),
  };
  const tracker = source === 'demo' && demo ? demo.tracker : realTracker;

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
      {__DEV__ ? (
        <DevDataProvider value={devData}>
          <AppNavigator />
        </DevDataProvider>
      ) : (
        <AppNavigator />
      )}
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
