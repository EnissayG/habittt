# 0011. Retirer et effacer une habitude

- **Statut :** accepté
- **Date :** 2026-10-06
- **Complète :** [0002](0002-rechutes-et-croissance.md) et
  [0009](0009-notes-et-arrosage.md)

## Contexte

On ne pouvait ni retirer ni supprimer une plante. L'écran 9 de la maquette
propose deux sorties, « Elle rejoint le jardin » et « Je la donne », et un
lien « Tout effacer définitivement ». On y arrive par un appui long sur
l'étagère ou par le menu de l'habitude, jamais par un glissement, réservé
au déplacement dans la pièce (ADR 0010).

## Décision

### Le modèle

`Habit` gagne quatre champs :

- `status` : `'shelf' | 'garden' | 'given'` ;
- `retiredOn` : le jour où la plante a quitté l'étagère, ou `null` ;
- `updatedAt` : l'instant de la dernière modification (la future
  synchronisation garde la version la plus récente) ;
- `deletedAt` : l'instant de l'effacement, ou `null`.

Règles (`retirement.ts`) :

- **Retirer** (`retireHabit`) n'est possible que depuis l'étagère. C'est
  une suppression logique : toutes les données restent.
- **Une plante retirée cesse de pousser** : statistiques, jours et plante
  sont calculés jusqu'à `retiredOn` (`growthEnd`), plus jusqu'à
  aujourd'hui.
- **Plus rien ne s'écrit sur une plante retirée** : rechute, note et
  arrosage répondent `HABIT_RETIRED`.
- **« Je la donne »** : la plante disparaît de l'app. Ses données restent
  et figureront dans l'export.
- **Effacer** (`eraseHabit`) est possible depuis l'étagère et depuis le
  jardin. Il ne reste qu'une **trace** : l'identifiant, la date
  d'effacement et les données de la plante (graine, espèce, dates). Le
  nom, seule donnée écrite par la personne, est vidé.

### Le seul vrai effacement

`HabitRepository.erase(trace)` enregistre la trace et **supprime
vraiment**, dans la même transaction, les rechutes, notes et arrosages de
l'habitude. C'est la seule suppression réelle de l'app :

- ce que la personne a écrit ne doit pas survivre à « Tout effacer » ;
- la trace suffit pour que la synchronisation ne fasse pas revenir
  l'habitude : un appareil qui reçoit la trace ignore ce qui appartenait à
  cette habitude.

### Les données

**Migration SQLite n° 4** : colonnes `status` (par défaut `'shelf'`),
`retired_on`, `updated_at` (initialisée à `created_at`) et `deleted_at` sur
`habits`. Un statut inconnu, écrit par une version plus récente, est lu
comme « jardin » : la plante reste visible, en lecture seule, et rien ne
l'écrase.

### Les écrans

- **Écran 9** (`RetireScreen`) : les deux cartes, avec la plante, dont une
  seule est choisie (« Elle rejoint le jardin » par défaut). « Confirmer »
  applique le choix et ramène à l'étagère : l'écran lui-même sert de
  confirmation. « Tout effacer définitivement » demande une seconde
  confirmation dans un panneau qui dit que c'est irréversible.
- On y arrive par un **appui long** sur une plante de l'étagère (aussi
  proposé comme action d'accessibilité) ou par **« Retirer »** dans le menu
  de l'habitude.

## Conséquences

- L'étagère et son total ne comptent que les plantes de l'étagère.
- Le jardin (écran 10) lira les plantes `garden`, figées, en lecture seule.
- Pas de retour du jardin vers l'étagère pour l'instant (noté dans
  `idees.md`).
