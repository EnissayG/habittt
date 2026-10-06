# habittt

Application mobile pour **arrêter** des habitudes (« jours sans fumer »). Le
compteur avance avec le temps ; le seul événement saisi est une rechute.
Chaque habitude est une plante en pixel art, calculée par une fonction pure,
jamais stockée comme image.

Expo SDK 57, React Native, TypeScript strict, Jest. Doit rester compatible
avec Expo Go.

## Commandes

```bash
npm start            # serveur de dev, scanner le QR code avec Expo Go
npm test             # Jest
npm run lint         # ESLint (vérifie aussi la règle de dépendance)
npm run typecheck    # tsc --noEmit
npm run format       # Prettier
npx expo install <p> # TOUJOURS pour ajouter une dépendance (versions compatibles SDK)
npx expo-doctor      # diagnostic des versions
```

Avant de déclarer une tâche terminée : `typecheck`, `lint` et `test` passent.

## Architecture

Voir `docs/architecture.md`, `docs/decisions/` et **`docs/etat.md`** (où on en est).

- `src/domain/` : TypeScript pur. Entités, règles, générateur de plante,
  interfaces de repository. Aucun import de React, Expo, SQLite, Skia, Zustand.
  Tout y est testé.
- `src/data/` : implémentations des repositories (SQLite ; Supabase plus tard).
- `src/ui/` : écrans (React Navigation, pile native) et composants. Affichent et
  délèguent, ne calculent pas. Cible visuelle : `docs/prototypes/maquette-habittt.html`.
- `App.tsx` : racine de composition, seul endroit qui relie les trois couches.
- Règle : `ui -> domain <- data`. Le domaine n'importe jamais les deux autres.
  Appliquée par ESLint, ne pas la contourner.
- Modèle : `Habit { id, name, seed, species, startDate, createdAt }`,
  `Relapse { id, habitId, date, deletedAt, updatedAt }`. UUID, dates `YYYY-MM-DD` locales.
  Rechute : une max par jour, `startDate <= date <= aujourd'hui`, suppression logique.
- `plante = f(seed, startDate, rechutes, aujourd'hui)`. Date du jour et aléatoire
  injectés : jamais de `Date.now()` ni `Math.random()` dans `domain/`.
- Plante (`src/domain/plant/`) : port exact de `docs/prototypes/plants.js` (test de
  parité). Une espèce = un fichier + une ligne du registre. Trigo : `trig.ts` seulement.

## Expo Go

Seuls les modules natifs inclus dans Expo Go sont utilisables. Vérifier avant
d'ajouter une bibliothèque native. Ne jamais créer `ios/` ou `android/` à la main.
L'API Expo change à chaque SDK : consulter https://docs.expo.dev/versions/v57.0.0/

## Conventions

- Code, identifiants et commits en anglais ; documentation en français.
- Couleurs et polices : uniquement les rôles de `src/ui/theme/`, jamais en dur.
- Commits atomiques : un changement logique par commit.
- Décision d'architecture importante : nouvel ADR `docs/decisions/NNNN-titre.md`.
- Ne rien installer pour Supabase, les comptes ou les stores avant la
  fonctionnalité correspondante.
