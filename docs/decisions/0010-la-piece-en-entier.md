# 0010. La pièce existe toujours en entier

- **Statut :** accepté
- **Date :** 2026-10-06
- **Complète :** [0007](0007-etagere-en-murs.md) et
  [0008](0008-retours-du-premier-test.md)

## Contexte

Jusqu'ici, un mur n'existait que s'il portait des plantes. Avec cinq
habitudes, la pièce n'avait qu'un mur : rien à faire glisser, et la pièce
de la maquette (section « La pièce en entier ») ne se découvrait jamais. Le
glissement se faisait aussi page par page, par sauts.

Le décor (fauteuil, lampe sur pied, tapis, trois tableaux) est dessiné par
`src/domain/scene/drawDecor.ts`, à l'échelle des plantes.

## Décision

### Les murs (`arrangeShelf`)

- **Au moins trois murs** : le mur 1 (fenêtre et tablettes), un mur 2 de
  tablettes (`MIN_PLANT_WALLS = 2`) et, **toujours en dernier**, le mur de
  décor (`kind: 'decor'`).
- S'il y a plus de plantes que de places, des murs de tablettes s'ajoutent
  **avant** le mur de décor. Rien ne bouge : les deux familles (debout,
  retombantes) se rangent toujours indépendamment, par date de création.
- Les tablettes vides sont dessinées, sans pot ni étiquette. Le pot en
  pointillé reste à la première place debout libre.
- **Un tableau** est accroché dans la bande du haut de chaque mur de
  tablettes autre que le premier, tant qu'aucune plante retombante n'y
  pend : coucher de soleil sur le mur 2, puis une feuille, en alternance.
  Il disparaît dès qu'une plante retombante arrive sur ce mur. Nous avons
  étendu la règle du mur 2 aux murs suivants pour qu'aucun mur nu ne reste
  sans rien en haut.

### Le mur de décor (`planRoom`)

Disposition reprise du mur 3 de la maquette (`drawPano`), en cellules
depuis le bord gauche du mur :

- le **fauteuil** (x = 22) et la **lampe sur pied** (x = 104) posés sur la
  ligne du sol ;
- un **tableau** (vue de jour, x = 78) dont le haut est à 130 lignes
  au-dessus du sol, comme dans la maquette ; dans une pièce basse, il
  descend jusqu'au haut du mur plutôt que d'être coupé ;
- pas de tablettes ;
- la pièce est toujours au moins aussi haute que la lampe (80 lignes).

Le décor est un nouveau contenu placé, `{ kind: 'decor', image }`, opaque,
sans étiquette ni zone tactile. `composeRoom` l'inclut : **le plancher
miroir reflète le décor** comme le reste, sans cas particulier.

### Le tapis (`RoomPlan.floorItems`, `drawFloor`)

Le tapis est **posé sur le plancher**, devant le fauteuil (x = 8, deux
lignes sous la plinthe). Il n'est pas sur le mur : il ne se reflète pas.
`drawFloor` reçoit les objets posés au sol et les dessine en dernier,
opaques, par-dessus les planches, le reflet et les joints.

### Le glissement

- **Continu** : `ScrollView` horizontal avec `snapToInterval` égal à la
  largeur de l'écran et une décélération normale, au lieu de
  `pagingEnabled`. On fait défiler librement ; quand on lâche, l'élan
  continue et la pièce se cale en douceur sur le mur le plus proche du point
  d'arrivée. Un geste fort peut traverser plusieurs murs.
- Les points suivent le défilement (le mur qui occupe le plus l'écran).
- Les murs sont mémorisés (`memo`) : faire avancer les points ne les
  redessine pas. Pendant le glissement, rien n'est calculé en JavaScript ;
  le défilement est natif et chaque mur est une image Skia déjà
  enregistrée.

## Mesures

Calcul de la pièce (plan, composition, plancher), une seule fois au
chargement de l'étagère, mesuré sous Node : 20 ms pour la démo (17
plantes, 4 murs), 40 ms pour 40 plantes (7 murs). Le téléphone sera plus
lent, mais ce calcul ne se refait pas pendant le glissement.

## Conséquences

- Même sans plante, la pièce a trois murs ; la première ouverture montre
  donc des points et invite à glisser.
- Le Labo ne dessine que le premier mur.
- Les futurs meubles à débloquer pourront s'ajouter au mur de décor, ou
  devenir de nouveaux murs de décor, avec le même contenu `decor`.
