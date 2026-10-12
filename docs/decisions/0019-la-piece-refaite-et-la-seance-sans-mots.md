# 0019. La pièce refaite, la séance sans phrases

- **Statut :** accepté
- **Date :** 2026-10-12
- **Modifie :** [0018](0018-le-coin-meditation-revu.md) (le décor du
  dernier mur, la lumière, les phrases), [0017](0017-le-coin-meditation.md)
  (les textes des séances) et [0010](0010-la-piece-en-entier.md) (le style
  de la pièce)

## Contexte

Deuxième essai sur téléphone. Retours :

- le fauteuil et la lampe ne vont pas avec l'idée de la méditation ; la
  pièce entière est à revoir, et le mur paraît vide ;
- la fumée de l'encens est figée ;
- la lumière derrière la plante grandit en entier ; on voudrait un cœur
  fixe et de l'air autour qui s'étend et revient, fluide, en vagues ;
- les phrases de la séance sont de trop : seuls « inspire » et « expire »
  restent, écrits en gros ;
- rien ne montre le temps qui passe.

## Décisions

### La pièce

- **Le mur** : un papier peint clair à fins brins (`drawWallpaper`), une
  moulure sous le plafond et une guirlande d'ampoules qui pend en
  festons. Il est dessiné une fois, derrière tout le reste.
- **Les tablettes** sont en bois (`SCENERY.shelf`, `shelfShade`). La table
  de traduction du test de parité garde les plans d'origine intacts.
- **Le coin méditation** (dernier mur), de gauche à droite sur la ligne
  du sol : un **coussin** indigo sur une **natte** tressée, une **table
  basse** (bougie, statue de pierre, galets, porte-encens), un **vase**
  d'herbes sèches. Au mur : une **étagère murale** (livres, bol chantant),
  le tableau, le **rouleau** à l'ensō, la lanterne de papier. Le fauteuil,
  la lampe et le tapis sont supprimés.
- **Accrochage** : chaque pièce murale a une hauteur préférée (`above`) et
  des rangées à garder libres en dessous (`clear`) ; si elle ne tient pas
  sous le plafond, elle est omise, jamais posée sur un meuble.
- **Ce qui bouge** : la flamme de la bougie vacille et la fumée de
  l'encens monte en ondulant (`drawFlame`, `drawSmoke`). Le plan les
  donne à part (`RoomPlan.animated`) : ils sont dessinés dans de petits
  canevas au-dessus du mur enregistré, qui ne se redessine pas.
- Le bouton « Méditer » est au-dessus du coussin ; toucher le coussin, la
  table ou le rouleau ouvre aussi la séance.

### La séance

- **Le soleil** (`drawSun`), au-dessus de la plante : un cœur de taille
  fixe, entouré d'anneaux d'air dont la portée suit le souffle
  (`breathFullness`, de 9 à 20 cellules). Leurs bords ondulent lentement
  et les anneaux glissent vers l'extérieur : de l'air, pas des rayons.
- **Le temps qui passe** : un bâton d'encens à côté du pot
  (`drawIncenseTimer`), neuf au début, consumé jusqu'au porte-encens à la
  fin (`sessionShare`), avec sa braise et sa fumée.
- **Plus aucune phrase** : ni pendant la séance, ni sur l'écran de choix,
  ni à la fin (la fin montre la plante et son nom). Le seul texte est
  « inspire » ou « expire », en gros, qui apparaît et s'efface avec chaque
  moitié du souffle (`breathWord`, fondu de 0,8 s adouci aux deux bouts).
- Avec « Réduire les animations » : le soleil reste à mi-souffle, l'encens
  sans fumée mouvante, le mot sans fondu.
- L'horloge de la séance bat 20 fois par seconde, pour que le fondu et
  l'air soient fluides.

## Conséquences

- La vibration, les durées, la pousse de la plante et le fait que rien
  n'est enregistré ne changent pas.
- Les tables de phrases de `docs/meditation.md` et leur code
  (`phraseAt`, `MEDITATION_END`) sont supprimés.
- À juger sur l'appareil : la lisibilité du mur avec le papier peint, le
  coût des petits canevas animés sur l'étagère, la fluidité du soleil à
  20 images par seconde.
