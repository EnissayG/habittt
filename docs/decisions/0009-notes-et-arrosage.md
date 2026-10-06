# 0009. Notes et arrosage

- **Statut :** accepté
- **Date :** 2026-10-06
- **Complète :** [0002](0002-rechutes-et-croissance.md) et
  [0008](0008-retours-du-premier-test.md)

## Contexte

La phase 3 commence par les écrans 6 (arroser et écrire une note) et 7
(historique) de la maquette, et par deux comportements de l'écran 5 :
toucher la plante affiche le jour et sa note ; après une rechute, l'app
propose d'écrire. Les principes s'appliquent : écrire est toujours
facultatif, arroser n'est jamais un devoir.

## Décision

### Les données

- **`Note { id, habitId, date, text, mood, deletedAt, updatedAt }`** : une
  note par habitude et par jour, identifiant déterministe tiré de
  `(habitId, date)` comme les rechutes. Une seule humeur, dans la liste
  fixe de la maquette (fier, envie forte, stress, facile). Une note a un
  texte ou une humeur ; la vider la supprime logiquement (`deletedAt`), la
  réécrire la fait revenir. Texte nettoyé, au plus 1 000 caractères.
- **`Watering { id, habitId, date, updatedAt }`** : un arrosage par
  habitude et par jour, sans suppression. Arroser deux fois le même jour
  ne fait rien.
- **Migration SQLite n°3** : tables `notes` et `waterings`, unicité sur
  `(habit_id, date)`. Une humeur inconnue (écrite par une version plus
  récente) est lue comme « pas d'humeur ».

### Les cas d'usage

- `saveNote(habitId, date, { text, mood })` écrit, modifie ou supprime la
  note de n'importe quel jour entre le début et aujourd'hui.
- `waterToday(habitId, note?)` arrose **aujourd'hui seulement**, avec ou
  sans note. Tout est vérifié avant d'enregistrer : une note refusée
  n'arrose rien.
- `getHabit` renvoie aussi les notes (de la plus récente à la plus
  ancienne), la note du jour et l'arrosage du jour ; chaque jour de la
  frise porte sa note et son arrosage.

### La petite fleur

Le prototype `plants.js` n'en a pas : c'est un ajout du domaine. Le
générateur reçoit `wateredDays`, comme `relapseDays`. Pour chaque jour
arrosé, il marque **un seul pixel** de ce jour, le plus haut parmi les
visibles (le plus à gauche en cas d'égalité), d'un drapeau `bloom` ; le
thème le colore en rose tendre (`BLOOM`). La forme ne change jamais, et
sans arrosage la plante est identique pixel pour pixel : la parité avec le
prototype et les références figées sont intactes. Propriété testée pour
chaque espèce : un arrosage n'ajoute que ce drapeau, sur un pixel de son
jour.

**Limite :** un jour au-delà du 120ᵉ ne pousse plus, donc ne fleurit pas.
Une habitude de plus de 120 jours arrosée aujourd'hui ne montre pas de
fleur. À traiter avec les « marques après 120 jours » (voir
[idees.md](../idees.md)).

### Les écrans

- **Écran 6** : « Arroser et écrire une note » ouvre un panneau « Jour N ·
  date » avec une zone de texte, les humeurs, « Arroser » et « Arroser sans
  rien écrire ». La note du jour est préremplie. Si la plante est déjà
  arrosée, le panneau ne fait qu'enregistrer la note. Après l'arrosage,
  une goutte en pixels tombe sur la plante (pas avec « Réduire les
  animations ») et l'écran dit « Ta plante est arrosée. ».
- **Écran 5** : une puce « N notes ». Toucher la plante cherche le pixel
  poussé le plus proche du doigt (`dayAt`, rayon de 3 cellules ; le pot et
  la tablette ne répondent pas) et ouvre le jour : rechute, arrosage, note
  ou « Pas de note ce jour-là », et « Écrire une note » ou « Modifier la
  note ». Pour un jour passé, on enregistre sans arroser.
- **Écran 7** : les jours avec une note sont encadrés en rose (le cadre
  rose l'emporte sur celui d'aujourd'hui) ; les notes sont listées sous la
  grille, bord orange pour un jour de rechute ; toucher une note la
  modifie.
- **Écran 8** : après « Noter la rechute », le panneau devient « C'est
  noté. Veux-tu écrire quelques mots sur ce jour ? » avec « Écrire un mot »
  et « Plus tard ».
- Le panneau monte au-dessus du clavier (`KeyboardAvoidingView` sur iOS).

### L'en-tête de l'étagère

Le total est la somme des séries en cours, les nombres affichés sous les
plantes : « 6 plantes · 386 jours d'affilée ».

## Conséquences

- `HabitTrackerDeps` reçoit deux repositories de plus.
- La démo du Labo contient quelques notes et des plantes arrosées
  aujourd'hui.
