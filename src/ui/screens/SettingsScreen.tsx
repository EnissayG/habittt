import Constants from 'expo-constants';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { NumberText } from '../components/NumberText';
import { Screen } from '../components/Screen';
import { Sheet } from '../components/Sheet';
import { TopBar } from '../components/TopBar';
import type { ScreenProps } from '../navigation/types';
import { CAT_NAMES, CatChoice } from '../settings/CatChoice';
import { isReminderOn, turnReminderOff, turnReminderOn } from '../settings/reminder';
import { shareExport } from '../settings/shareExport';
import { fonts, spacing, type Palette } from '../theme/tokens';
import { usePalette, useThemedStyles } from '../theme/ThemeContext';
import { useTracker } from '../TrackerContext';
import { useScreenData } from '../useLoader';
import { useSafeAction } from '../useSafeAction';
import type { CatBreed } from '../../domain';

/**
 * Screen 11: the settings. Music and accounts are announced, not built yet;
 * the evening reminder is off by default and never reproaches anything.
 */
export function SettingsScreen({ navigation }: ScreenProps<'Settings'>) {
  const colors = usePalette();
  const styles = useThemedStyles(makeStyles);
  const tracker = useTracker();
  const load = useCallback(() => tracker.herbariumCount(), [tracker]);
  const { data: lives } = useScreenData(load);
  const [reminder, setReminder] = useState<boolean | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [about, setAbout] = useState(false);
  const safely = useSafeAction();
  const loadSettings = useCallback(() => tracker.getSettings(), [tracker]);
  const { data: settings, reload: reloadSettings } = useScreenData(loadSettings);

  async function chooseCat(cat: CatBreed | 'none') {
    await safely(() => tracker.saveSetting('cat', cat));
    await safely(reloadSettings);
  }

  useEffect(() => {
    isReminderOn().then(setReminder, () => setReminder(false));
  }, []);

  async function toggleReminder(on: boolean) {
    try {
      if (!on) {
        await turnReminderOff();
        setReminder(false);
        setNotice('Rappel désactivé.');
        return;
      }
      const result = await turnReminderOn();
      setReminder(result === 'on');
      setNotice(
        result === 'on'
          ? 'Un rappel doux chaque soir à 20 h.'
          : 'Les notifications sont refusées : tu peux les autoriser dans les réglages du téléphone.',
      );
    } catch {
      setNotice("Le rappel n'a pas pu être réglé.");
    }
  }

  async function exportData() {
    try {
      const shared = await shareExport(await tracker.exportData(), tracker.today());
      if (!shared) setNotice('Ce téléphone ne permet pas de partager un fichier.');
    } catch {
      setNotice("L'export n'a pas abouti.");
    }
  }

  return (
    <Screen
      scroll
      overlay={
        <Sheet visible={about} onClose={() => setAbout(false)}>
          <Text style={styles.sheetTitle}>À propos de habittt</Text>
          <NumberText style={styles.body}>
            {`Version ${Constants.expoConfig?.version ?? '?'}. Un compagnon de poche pour arrêter une habitude, une plante à la fois.`}
          </NumberText>
          <Text style={styles.body}>
            Polices : Pixelify Sans et Jersey 10, sous licence SIL Open Font License 1.1.
          </Text>
          <Text style={styles.body}>
            Construit avec Expo, React Native, React Navigation et React Native Skia, sous licence
            MIT. Plantes, pièce et fenêtre dessinées par l&apos;app, pixel par pixel.
          </Text>
          <Button label="Fermer" variant="quiet" onPress={() => setAbout(false)} />
        </Sheet>
      }
    >
      <TopBar backLabel="étagère" onBack={navigation.goBack} />
      <Text style={styles.title}>Réglages</Text>
      <View>
        <Row label="Musique" value="bientôt" />
        <Row label="Barre de musique visible" value="bientôt" />
        <Row
          label="Rappel doux le soir"
          value={
            <Switch
              value={reminder ?? false}
              disabled={reminder === null}
              onValueChange={(on) => void toggleReminder(on)}
              trackColor={{ false: colors.line, true: colors.accent }}
              thumbColor={colors.background}
              accessibilityLabel="Rappel doux le soir, à 20 heures"
            />
          }
        />
        <Row label="Le chat de la pièce" value={settings ? CAT_NAMES[settings.cat] : ''} />
        {settings && <CatChoice value={settings.cat} onChange={(cat) => void chooseCat(cat)} />}
        <Row
          label="L'herbier"
          value={lives === undefined ? '' : `${lives} ${lives > 1 ? 'vies' : 'vie'} ›`}
          onPress={() => navigation.navigate('Herbarium')}
        />
        <Row label="Compte et synchronisation" value="bientôt" />
        <Row label="Exporter mes données" value="›" onPress={() => void exportData()} />
        <Row label="À propos de habittt" value="›" onPress={() => setAbout(true)} last />
      </View>
      {notice && (
        <Text style={styles.notice} accessibilityLiveRegion="polite">
          {notice}
        </Text>
      )}
    </Screen>
  );
}

interface RowProps {
  label: string;
  value: ReactNode;
  onPress?: () => void;
  last?: boolean;
}

/** One line of the settings: a label, and a value or a control on the right. */
function Row({ label, value, onPress, last = false }: RowProps) {
  const styles = useThemedStyles(makeStyles);
  const content = (
    <>
      <Text style={styles.label}>{label}</Text>
      {typeof value === 'string' ? <NumberText style={styles.value}>{value}</NumberText> : value}
    </>
  );
  const style = [styles.row, last && styles.lastRow];
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={style}>
      {content}
    </Pressable>
  ) : (
    <View style={style}>{content}</View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 48,
      gap: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    lastRow: { borderBottomWidth: 0 },
    label: { flex: 1, fontFamily: fonts.display, fontSize: 15, color: colors.text },
    value: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
    notice: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, lineHeight: 18 },
    sheetTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.text },
    body: { fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 18 },
  });
