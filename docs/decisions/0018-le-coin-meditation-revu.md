# 0018. Le coin méditation revu : décor, entrée, souffle

- **Statut :** accepté
- **Date :** 2026-10-11
- **Modifie :** [0017](0017-le-coin-meditation.md) (l'entrée, la barre du
  souffle, la vibration) et [0010](0010-la-piece-en-entier.md) (le mur de
  décor)

## Contexte

Premier essai de l'écran 12 sur téléphone. Quatre retours :

- rien ne dit qu'il faut toucher le fauteuil ;
- la barre de petites cases « qui charge » ne représente pas une
  respiration ;
- la vibration ne marque que le début de l'inspiration, on ne sent pas le
  souffle ;
- le fauteuil seul n'évoque pas la méditation, et le mur paraît vide.

## Décisions

### Le dernier mur est le coin méditation

- De gauche à droite, posés sur la ligne du sol : le fauteuil sur son
  tapis, une **table basse** (`drawAltar`) qui porte une bougie, une
  **statue assise** en pierre, trois galets empilés et un bâton d'encens
  dont la fumée monte le long du mur, puis la lampe sur pied.
- Au mur : le tableau des montagnes au-dessus du fauteuil, un **rouleau**
  (`drawScroll`) au-dessus de la table, avec un cercle tracé d'un seul
  geste (ensō), ouvert, plus épais là où le pinceau appuie.
- Au plafond, entre les deux : une **lanterne de papier** (`drawLantern`)
  dont le cordon prend la hauteur qui reste. Plus la pièce est haute, plus
  il est long : le haut du mur n'est jamais nu.
- **Pièce basse** (peu de plantes, petit écran) : ce qui est accroché n'est
  jamais coupé ni posé sur un meuble. Le tableau garde 18 rangées de mur
  libre au-dessus du fauteuil, pour le bouton ; ce qui ne tient pas sous le
  plafond n'est pas placé (rouleau, lanterne, puis tableau). Les meubles
  sont toujours là.
- Tout est du décor ordinaire : il se reflète dans le plancher sans code en
  plus.

### L'entrée se voit

- Un **bouton « Méditer »** est posé sur le mur au-dessus du fauteuil, dans
  le style des boutons de l'app. C'est lui que trouve un lecteur d'écran.
- Toucher le fauteuil, la table ou le rouleau (`MEDITATION_PIECES`) ouvre
  aussi l'écran 12.

### Le souffle est une lumière

- La barre est supprimée. Derrière la plante, un **disque de lumière**
  (`drawHalo`) grandit pendant l'inspiration et se retire pendant
  l'expiration : un cœur clair, un corps, un bord d'une cellule sur deux
  qui se fond dans le mur. Il est dessiné sur la grille de la plante, qui
  se pose exactement dessus.
- Sa taille suit `breathFullness` : le remplissage du souffle, de 0 à 1,
  adouci au départ et à l'arrivée (un souffle ne démarre pas d'un coup).
  Le rayon va de 6 à 22 cellules, une cellule à la fois.
- Le mot « inspire » ou « expire » est toujours écrit sous la plante. Avec
  « Réduire les animations », la lumière garde une taille fixe.
- La phrase d'introduction devient « Inspire quand la lumière grandit.
  Expire quand elle se retire. »

### Le souffle se sent dans la main

- `BREATH_PULSES` : treize petits coups par souffle. Pendant
  l'inspiration, ils se rapprochent et se renforcent (doux, léger,
  moyen) ; une pause en haut ; pendant l'expiration, ils s'espacent et
  s'adoucissent ; puis deux secondes de silence.
- `pulsesBetween` donne les coups dus entre deux battements de l'horloge de
  la séance : chacun est donné une fois, aucun n'est rattrapé après une
  pause, aucun après la fin.
- L'interrupteur s'appelle « Vibrer au rythme du souffle ».
- `expo-haptics` ne sait donner que des coups séparés, de quelques forces :
  il n'y a pas de vibration continue dont on réglerait l'intensité.

## Conséquences

- Les phrases, les durées, la pousse de la plante et le fait que rien
  n'est enregistré ne changent pas (ADR 0017).
- Écrit sans téléphone. À juger sur l'appareil : la force réelle des trois
  vibrations, la lisibilité de la plante devant la lumière, la place du
  bouton.
- Les murs de tablettes n'ont pas changé : s'ils paraissent encore vides
  avec peu de plantes, c'est un sujet à part.
