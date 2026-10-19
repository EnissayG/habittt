# 0024. Rien n'échoue en silence

- **Statut :** accepté
- **Date :** 2026-10-19

## Contexte

Quand on tapait trop de caractères, ou qu'une opération échouait (la base
de données, le téléphone), il ne se passait rien : pas de message, rien
d'enregistré, aucune explication.

## Décisions

- **Trois niveaux, du plus près au plus général** :
  1. **Les règles du domaine** (nom vide, date future, déjà replantée…)
     restent dites là où elles arrivent, sous le champ ou dans le panneau
     (`messages.ts`).
  2. **Une action qui lève une erreur** (enregistrer, renommer, rechute,
     arrosage, retirer, planter, replanter, méditation, réglages) passe par
     `useSafeAction` : le message « Ça n'a pas fonctionné. Réessaie dans un
     instant. » s'affiche dans un bandeau doux en bas de l'écran
     (`Notice`), qui s'efface seul ou au toucher, et que le lecteur d'écran
     annonce. Un chargement raté le dit aussi, une fois (`useLoader`), et se
     retente au retour sur l'écran.
  3. **Un écran qui plante en se dessinant** : `CrashBoundary` affiche
     « Quelque chose s'est mal passé. Tes plantes et tes notes sont bien
     gardées. » et un bouton « Reprendre ». Au démarrage, une base qui ne
     s'ouvre pas propose « Réessayer » au lieu d'un message technique.
- **Les champs de texte** (nom, renommer, note) s'arrêtent exactement à la
  limite du domaine ; sous le champ, `TextLimit` affiche « 42 / 50 » à
  partir de 80 %, puis « 50 caractères au maximum. » quand on l'atteint.
  Le message d'erreur d'un champ s'efface dès qu'on recommence à écrire.
- Jamais de rouge (ton de l'app) : le bandeau utilise les couleurs
  `strong` / `onStrong`, contrastes vérifiés dans les deux palettes.

## Conséquences

- Un nouvel appel au tracker depuis un écran passe par `useSafeAction`,
  sinon il peut échouer en silence.
- Les erreurs qui ne gênent pas (une vibration impossible, l'état de la
  lumière non enregistré) restent silencieuses : l'app continue normalement.
