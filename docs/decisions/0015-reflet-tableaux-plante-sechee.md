# 0015. Reflet animé, nouveaux tableaux et plante séchée

- **Statut :** accepté
- **Date :** 2026-10-11
- **Complète :** [0008](0008-retours-du-premier-test.md),
  [0010](0010-la-piece-en-entier.md) et [0013](0013-la-plante-meurt.md)

## Contexte

Trois dessins attendus après la phase 3 : le reflet du plancher tel que la
maquette le montre (`drawPano`, façon Kingdom Two Crowns), des tableaux plus
beaux que ceux de `drawDecor.ts`, et l'allure d'une plante morte, que le
domaine signalait par `PlantImage.dead` sans encore la dessiner.

## Décisions

### Le reflet

- **Un vrai miroir** : une ligne de plancher par ligne de mur, à partir de
  la plus basse ligne dessinée de la pièce. L'ancien reflet gardait une
  ligne sur deux.
- **L'onde** (`mirrorRows`, `REFLECTION`) reprend les nombres de la
  maquette : décalage = arrondi(sin(ligne × 0,85 + t × 1,8) × (0,3 +
  ligne × 0,045)), t en secondes, soit 0,3 radian par image à 6 images par
  seconde. Le sinus est celui de `trig.ts`.
- **Opacité** : 0,62 pour ce qui est au mur, 0,10 pour le mur nu (ton
  `wall`), multipliée par (1 − ligne / hauteur)^1,3.
- **Le reflet passe sur les joints** des planches, comme dans la maquette
  (avant, les joints passaient dessus). Le tapis reste par-dessus.
- **Aux bords de la pièce**, une ligne décalée répète la dernière colonne.
- **Dans l'étagère, le reflet est une image que l'on fait glisser.**
  Redessiner tout le plancher 6 fois par seconde (une couleur calculée par
  pixel, un chemin Skia par couleur) coûterait trop cher. `floorMirror`
  calcule donc une fois les pixels du miroir, avec leur opacité ;
  `mirrorImage` en fait une image Skia ; à chaque image de l'animation,
  `reflectionPicture` redessine seulement des bandes de lignes décalées.
  Les planches et le tapis sont deux dessins fixes, dessous et dessus.
- **`drawFloor` reste la référence** : le plancher entier à un instant t,
  utilisé par le Labo et par les tests. Un test compose le chemin rapide à
  la main et le compare à `drawFloor` (écart d'arrondi de 2 niveaux sur
  255 au plus).
- **Une seule horloge** (`SceneClock`) pour la fenêtre et le plancher de
  tous les murs : l'onde est la même d'un mur au suivant.
- **Repli** : si Skia ne peut pas créer l'image, le plancher est dessiné
  entier et immobile, comme avant.

### Les tableaux

- Trois tableaux, même cadre doré, même taille (40 × 30) : `peaks`
  (montagnes à l'aube, mur de décor), `sea` (la mer au crépuscule) et
  `bonsai` (une estampe de la plante emblème), ces deux-là en alternance
  sur les murs de tablettes. Ils remplacent `day`, `sunset` et `leaf`.
- Le choix du tableau n'est pas stocké : aucune migration.

### La plante séchée

- **Le domaine change la forme, le thème change les couleurs.**
  `renderPlant` appelle `wither` quand la vie est finie :
  - chaque pixel de la plante, et la terre, porte le drapeau `dry` ;
  - environ un pixel sur trois du contour des feuilles est tombé. Jamais
    le bois ni les épines, jamais une ligne fine (tige, liane), jamais
    l'intérieur d'une feuille ;
  - jusqu'à cinq feuilles sont posées sur la tablette, à côté du pot.
- Le pot et la tablette ne changent pas : on reconnaît l'habitude.
- `plantColor` donne aux pixels `dry` des tons de paille et de bois mort
  (`DRIED`), les mêmes quelle que soit la teinte du feuillage. Jamais de
  rouge. La petite fleur d'un jour arrosé disparaît.
- Tout est tiré du sel de la plante : une plante morte est la même chaque
  jour et sur chaque téléphone. Annuler la rechute la ranime telle quelle,
  puisque rien n'est stocké.
- Le drapeau voyage avec le pixel : le reflet du plancher montre la plante
  séchée sans code en plus.
- Une plante morte le jour même de son début est un pot vide, dont seule
  la terre change.

## Conséquences

- Le test « une plante morte garde ses pixels » de l'ADR 0013 est remplacé
  par `wither.test.ts`.
- Écrit sans téléphone : à vérifier dans Expo Go (voir `etat.md`), en
  particulier la fluidité du reflet.
