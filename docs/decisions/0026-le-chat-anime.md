# 0026. Le chat, un petit sprite « chibi » qui avance par bonds

- **Statut :** remplacé par [0027](0027-le-chat-de-la-reference.md) (le dessin et les gestes)
- **Date :** 2026-10-19
- **Modifie :** [0025](0025-le-chat.md) (le dessin et les gestes du chat)

## Contexte

Le premier chat était trop simple : des blocs sans contour, une marche en
deux temps, peu de vie. Une deuxième version, de profil, plus détaillée
(référence : Habbo), marchait bizarrement. Yassine a montré la référence
visée : un chat « chibi », la grosse tête tournée vers nous.

## Décisions

- **Le dessin chibi** (`scene/cat.ts`, boîte de 24 × 18 cellules, le chat
  debout en fait environ 17 × 13) : une grosse tête ronde presque aussi
  grande que le corps, le visage tourné vers nous (de trois quarts : le
  visage une cellule en avant du milieu ; de face quand il nous regarde),
  deux yeux de deux cellules (un clair au-dessus d'un foncé), un nez rose
  sur un museau clair, les oreilles posées au-dessus de la tête. Un petit
  corps aux coins arrondis, quatre pattes courtes de deux cellules,
  séparées par le contour, celles du côté éloigné dans l'ombre. Une queue
  fine dressée. La tête est dessinée en lettres (`stamp`), le reste en
  blocs.
- **Le rendu** : des aplats, un contour sombre presque noir tout autour
  (teinté par pelage), une seule ombre (sous le corps et sur le côté du
  visage), pas de reflet de lumière. Rayures sur le front, le dos et la
  queue ; taches orange et noires de la calico ; masque, oreilles, pattes
  et queue foncés du siamois ; yeux verts du chat noir.
- **Il se déplace par petits bonds** (huit images, 0,8 s par bond, 6
  cellules) : debout, il se ramasse, pousse sur ses pattes arrière, vole
  étiré, les oreilles couchées, replie ses pattes, tend les pattes avant vers le sol, s'y reçoit,
  puis repose l'arrière. Il n'avance qu'en l'air : au sol, ses pattes ne
  bougent pas, donc rien ne glisse ni ne traîne. Le saut est une hauteur
  (`rise`, jusqu'à 2 cellules) que `catAt` donne avec la position ; la vue
  monte le chat d'autant et descend son reflet d'autant, comme un vrai
  miroir. Chaque trajet compte un nombre entier de bonds. (Avant : une
  marche en paires diagonales qui faisait glisser les pattes, puis de petits
  pas où une patte restait derrière, comme un pixel qui traîne. Les bonds
  se lisent mieux à cette taille.)
- **Assis** (12 images) : droit, les pattes avant serrées ; il respire,
  le bout de la queue se plie, une oreille frémit, il cligne des yeux, et
  de temps en temps il **tourne le visage vers toi**.
- **La toilette** : la patte monte à la bouche, la langue, la patte
  redescend sur la joue, les oreilles en arrière.
- **Le sommeil** : en boule, la tête posée sur les pattes, il respire, deux
  petits « z » montent et s'effacent.
- **Le réveil** (8 images, 3,2 s) : étirement de l'avant (l'arrière en
  l'air), bâillement, étirement de l'arrière, puis debout.
- Le chat suit une horloge à 12 images par seconde (`CatView`).

## Conséquences

- `CAT_FRAMES` donne le nombre d'images de chaque geste ; `catAt` choisit
  l'image selon le temps.
