# 0006. Écrans, navigation et étagère

- **Statut :** accepté
- **Date :** 2026-10-05
- **Complète :** [0004](0004-rendu-des-plantes.md)

## Contexte

La maquette (`docs/prototypes/maquette-habittt.html`) décrit 11 écrans et des
« Règles communes ». La phase 2 construit l'ouverture, l'étagère, la création
d'une habitude, l'écran d'une habitude, l'historique et la rechute. L'étagère
est un lieu (mur, tablettes, fenêtre, plancher), pas une liste. Il fallait
aussi choisir une navigation, et adapter les choix de la maquette qui ne
tenaient pas avec des plantes adultes ou avec la règle de contraste.

## Décision

### Navigation

**React Navigation, pile native** (`@react-navigation/native-stack` 7, sur
`react-native-screens` 4.26, inclus dans Expo Go). Vraies transitions
natives, glisser-retour sur iOS, bouton retour sur Android. Chaque écran
dessine sa propre barre du haut (style de la maquette). Les panneaux (menu,
rechute, arrosage) sont des `Modal` qui montent du bas.

### L'étagère comme scène

- **Une seule échelle entière pour toute la scène** : trois plantes (144
  pixels de grille) sur la largeur de l'écran. Plantes, fenêtre et plancher
  ont des pixels de même taille.
- **Disposition** (`arrangeShelf`, domaine) : la place à côté de la fenêtre
  revient à la plus ancienne plante retombante, sinon à la plus ancienne
  plante ; les autres plantes retombantes ont leurs propres rangées sous la
  fenêtre, pot en haut (leurs lianes tomberaient sinon sur les noms et
  compteurs) ; puis les tablettes ordinaires, trois par tablette, terminées
  par le pot en pointillé qui crée une habitude.
- **Hauteur des rangées** : chaque rangée prend la hauteur réellement occupée
  par sa plante la plus haute (`usedRows`). La maquette coupait les plantes à
  40 lignes, ce qui tronquait les plantes adultes.
- **Fenêtre et plancher dessinés par le domaine** (`drawWindow`, `drawRoom`,
  portés de la maquette), avec des tons symboliques et des **calques
  translucides** (reflets, lumière, plantes reflétées). Le thème donne les
  couleurs par vue et fait le mélange comme un canvas avec `globalAlpha`.
- **La fenêtre est prête à être animée** : son dessin est une pile de couches
  qui reçoivent `(vue, t)` ; aujourd'hui `t` vaut toujours 0.
- **La vue** (jour, soir, nuit, hiver) est choisie par une fonction pure du
  domaine (`windowView`) à partir de l'heure locale et du mois, avec l'horloge
  injectée (`Clock.hour()`). Le Labo force chaque vue.
- **Le plancher reste en bas** pendant que le mur défile ; il reflète la
  fenêtre et la tablette du bas.

### Écrans

- **Ouverture** : la plante de l'habitude la plus ancienne, ou un bonsaï
  adulte, pendant 1,5 s, puis l'étagère.
- **Création** en deux étapes : nom et date (Aujourd'hui, Hier, ou une date
  du sélecteur natif, jamais dans le futur), puis choix de la plante parmi
  toutes les espèces adultes, ou Surprise.
- **Une habitude** : la plante sur toute la largeur ; le compteur se pose
  dans le vide au-dessus d'elle s'il y a la place, sinon au-dessus de
  l'image. « Arroser et écrire une note » ouvre un panneau « Bientôt » en
  attendant la phase 3. « J'ai rechuté » reste discret.
- **Une rechute** : un panneau calme, bouton neutre, jamais de rouge.
- **Historique** : la grille de jours, 15 par ligne ; aujourd'hui est
  encadré dans la couleur du texte (la maquette utilisait le rose, couleur
  des notes).

### Thème

Les « Règles communes » : Pixelify Sans pour les titres, compteurs, boutons
et noms ; police système pour les textes longs ; aucun coin arrondi, aucune
ombre ; boutons avec un bord bas de 4 px plus foncé ; icônes dessinées en
pixels. Les couleurs de texte respectent toujours 4,5:1 (ADR 0004).

## Alternatives considérées

- **Garder le routeur maison** : pas de transitions natives ni de
  glisser-retour, et ingérable à 11 écrans. Rejeté.
- **Expo Router** : imposait de déplacer les écrans dans `src/app/`. Rejeté.
- **Recadrer les plantes à une hauteur fixe** (maquette) : coupe les plantes
  adultes. Rejeté.
- **Mettre les plantes retombantes sur les tablettes ordinaires** : leurs
  lianes couvriraient les noms. Rejeté.
- **Dessiner la fenêtre et le plancher en couleurs réelles dans l'UI** : on
  perdrait la séparation domaine / thème et la possibilité de tester la
  scène sans écran. Rejeté.

## Conséquences

- `getShelf` renvoie tout ce que l'étagère affiche, y compris la fenêtre et
  le plancher dessinés pour la vue du moment.
- Les reflets du plancher multiplient les couleurs (un mélange par opacité) :
  quelques centaines de chemins Skia au lieu d'une douzaine. Acceptable pour
  un seul plancher à l'écran.
- La vue d'hiver suppose l'hémisphère nord (décembre à février).
- Renommer et retirer une habitude, les notes et l'arrosage arrivent en
  phase 3.
