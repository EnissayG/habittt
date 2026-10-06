# 0012. Le journal de la plante

- **Statut :** accepté
- **Date :** 2026-10-06
- **Remplace en partie :** [0009](0009-notes-et-arrosage.md) (toucher la
  plante pour trouver un jour, l'historique en grille)

## Contexte

Le premier test sur téléphone a montré deux problèmes :

- **La grille de l'historique** (un carré par jour) devient illisible sur
  une longue durée : 952 carrés pour une habitude de deux ans et demi.
- **Toucher un pixel précis** de la plante pour trouver un jour n'est pas
  utilisable. La plante ne couvre d'ailleurs que les 120 premiers jours.

Les notes étaient aussi difficiles à trouver : il fallait passer par le
menu, puis par l'historique.

## Décision

### L'écran Journal remplace l'Historique

- **En haut, un calendrier d'un mois à la fois**, semaines commençant le
  lundi, ouvert sur le mois en cours. On glisse à l'horizontale pour
  changer de mois, entre le mois de début et le mois en cours (ou le mois
  du retrait pour une plante retirée).
- **Code de couleur** :
  - vert pour un jour tenu ;
  - orange pour une rechute ;
  - un point rose pour un jour avec une note ;
  - aujourd'hui encadré avec la couleur du texte ;
  - les jours hors de la période restent vides.
- **Le numéro du jour** est écrit sur le carré. Sur le vert, il prend la
  couleur `onAccent`, sombre. Sur l'orange, le sombre n'atteint que
  3,26:1 : un nouveau rôle, `onRelapse` (blanc, 4,61:1), est testé comme
  les autres paires.
- **En dessous**, les notes et les rechutes du mois affiché, de la plus
  récente à la plus ancienne.
- **Toucher un jour ou une note** ouvre le panneau du jour. Ce panneau
  permet aussi de noter ou d'annuler une rechute ce jour-là, ce que faisait
  la grille. Pour une plante retirée, il est en lecture seule.

### Le calcul (domaine, `calendar.ts`)

- `journalMonths(début, fin)` donne les mois à parcourir.
- `monthCalendar(mois, jours, aujourd'hui)` donne les semaines du mois. Le
  jour de la semaine est compté à partir d'un lundi connu, sans `Date`.
- `monthEntries(mois, jours)` donne les notes et rechutes du mois.
- `noteMonth(jours)` donne le mois de la note la plus récente.

### Les accès depuis l'écran d'une habitude

- **Toucher la plante, n'importe où**, ouvre le journal. Un indice est
  affiché dessous : « Touche la plante pour ouvrir son journal. »
- **La pastille « N notes ›»** ouvre le journal sur le mois de la note la
  plus récente.
- Dans le menu, « Historique » devient **« Journal »**.
- **La note du jour** reste visible sous la plante, et on la touche pour la
  modifier.
- Les fleurs des arrosages restent dessinées sur la plante, comme décor.

### Ce qui disparaît

La grande grille de jours (`DayGrid`), l'écran `HistoryScreen` et la
recherche du jour sous le doigt (`dayAt`).

## Conséquences

- Le journal reste lisible quelle que soit la durée : un mois fait au plus
  six semaines.
- Corriger une rechute ancienne demande de glisser jusqu'à son mois. C'est
  rare, et le panneau de rechute de l'écran 8 permet déjà de choisir « Un
  autre jour ».
