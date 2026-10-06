# 0007. L'étagère en murs, en plein écran, et le plancher miroir

- **Statut :** accepté
- **Date :** 2026-10-06
- **Remplace en partie :** [0006](0006-ecrans-et-etagere.md) (disposition de
  l'étagère, défilement vertical, plancher fixe et ses reflets)

## Contexte

La maquette a une nouvelle section, « La pièce en entier » : l'étagère n'est
plus une colonne de tablettes qui défile à la verticale, mais une pièce
qu'on parcourt mur par mur, en glissant à l'horizontale. Le glissement sert
désormais à changer de mur : on ne retire plus une habitude en la glissant.
Trois points de la maquette ont été tranchés avec l'utilisateur : la règle de
remplissage des murs, la place qui manque en hauteur avec des plantes
adultes, et les reflets du plancher.

## Décision

### Les murs (`arrangeShelf`, domaine)

- Chaque mur a une **bande du haut**, réservée aux plantes retombantes (pot
  en haut), et **deux tablettes de trois**, réservées aux plantes debout.
- Mur 1 : la bande du haut contient la fenêtre et une place. Murs suivants :
  trois places.
- Les deux familles se rangent **indépendamment**, chacune par date de
  création : ajouter une retombante ne déplace jamais une plante debout, et
  inversement. Si une retombante est retirée, les suivantes se tassent.
- La place à côté de la fenêtre reste vide s'il n'y a aucune retombante (la
  règle « sinon la plus ancienne plante » est abandonnée). Une bande du haut
  sans plante reste un mur nu : on y mettra un tableau plus tard. Dans une
  bande en partie remplie, les places libres montrent une tablette nue.
- Le nombre de murs est le plus grand des deux besoins. Le pot en pointillé
  occupe la première place debout libre.
- `Wall` a un `kind: 'plants'` : un mur de décor, des meubles ou des tableaux
  seront un nouveau `kind` ou de nouveaux champs.

Cette règle remplace la phrase « au plus six plantes » de la maquette.

### Le plan de la pièce (`planRoom`, `composeRoom`, domaine)

- Le plan place chaque élément en cellules, tous murs côte à côte. Chaque mur
  est centré dans sa page (une largeur d'écran) et calé sur la grille de
  cellules de toute la pièce : plancher et murs se raccordent d'une page à
  l'autre.
- Chaque bande prend la hauteur de sa plante la plus haute (`usedRows`),
  suivie de lignes réservées aux noms et compteurs (texte de l'UI). Tous les
  murs reposent sur la même ligne de sol, fixée par le mur le plus haut.
- `composeRoom` fait du plan une seule image : tout ce qui se trouve
  au-dessus du sol. Les tablettes vides et le pot en pointillé sont dessinés
  par le domaine (`drawSlot`) pour en faire partie.

### Le plancher miroir (`drawFloor`, domaine)

Une seule fonction générale, sans cas particulier par élément :

- l'image composée est **retournée** à la ligne du sol ;
- **compressée** en ne gardant qu'une ligne sur `pas`, avec
  `pas = ceil(hauteur du mur / lignes de plancher)` : le mur entier tient,
  en pixels entiers, sans rééchantillonnage ;
- **estompée** en s'éloignant du mur, en 4 paliers seulement ;
- les **joints des planches** passent par-dessus.

Les pixels de scène y entrent par leur ton de base (sans leurs reflets
translucides). Les noms et compteurs, qui sont du texte, ne sont pas
reflétés. La tache de lumière sous la fenêtre et la copie de la tablette du
bas disparaissent.

### Plein écran et échelle (`fitRoom`, UI)

- La pièce remplit tout l'écran, bord à bord. Le mur passe sous la barre
  d'état (icônes sombres), le logo et les réglages se placent juste dessous.
  Le plancher descend jusqu'au bord physique, sous la barre d'accueil ; les
  points indicateurs se posent sur le plancher, au-dessus de cette zone.
- **Une seule échelle entière** pour toute la pièce : au plus trois plantes
  sur la largeur. Quand la place manque, on raccourcit d'abord le plancher,
  de 52 jusqu'à 28 lignes, et on ne baisse l'échelle qu'ensuite. Le mur et
  le plancher continuent dans les marges.
- Un `ScrollView` horizontal paginé, sans rebond ni défilement vertical : le
  seul geste est le passage d'un mur à l'autre.
- Les noms tiennent sur une ligne. Les grandes tailles de texte
  d'accessibilité sont suivies jusqu'à ×1,3, pour que la pièce puisse être
  planifiée en cellules entières.

## Alternatives considérées

- **Rangées retombantes mélangées aux tablettes** : ajouter une retombante
  aurait poussé des plantes debout sur le mur suivant. Rejeté.
- **Défilement vertical dans chaque mur** : deux défilements imbriqués et un
  plancher pas toujours visible. Rejeté.
- **Reflets dessinés élément par élément** (maquette) : chaque nouvel objet
  aurait demandé son propre reflet. Rejeté pour un vrai miroir.
- **Miroir dessiné par Skia** (image retournée et mise à l'échelle par le
  GPU) : moins cher, mais ni testable sans écran ni garanti en pixels
  entiers. Rejeté.
- **Un seul canevas Skia pour tout le plancher** : sa largeur grandit avec le
  nombre de murs et peut dépasser la taille maximale d'une texture. Chaque
  page dessine donc sa part d'une même `Picture`, enregistrée une fois.

## Conséquences

- `getShelf` ne renvoie plus le plancher, qui dépend de la taille de
  l'écran : l'UI appelle `planRoom`, `composeRoom` et `drawFloor`
  (mémoïsés).
- Coût mesuré sous Node : environ 27 ms pour le plancher de trois murs. Il
  faut s'attendre à quelques fois plus sous Hermes, refait seulement quand
  les données, l'écran ou la vue changent. À vérifier sur téléphone.
- Les reflets multiplient les couleurs : la `Picture` les dessine en un seul
  appel par page.
- Retirer une habitude (phase 3) passera par un appui long ou par le menu,
  jamais par un glissement.
