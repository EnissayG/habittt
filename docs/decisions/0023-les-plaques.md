# 0023. Les plaques sous les plantes

- **Statut :** accepté
- **Date :** 2026-10-19

## Contexte

Les jours et le nom de chaque habitude étaient écrits à même le mur, sous la
plante. On veut un objet : une plaque en bois cerclée de métal, dont le métal
s'embellit avec les jours, et qui vit un peu.

## Décisions

- **La plaque** (`scene/plaque.ts`, `drawPlaque`) : une planche de bois
  sombre aux coins arrondis, enfoncée dans un cadre de deux cellules de
  métal (le bois est dans l'ombre sous le métal en haut et à gauche, il
  prend la lumière en bas et à droite ; le métal est éclairé en haut et à
  gauche, ombré en bas et à droite), une équerre et un rivet à chaque coin.
  Sous une étagère, elle pend à **deux courtes chaînes** du même métal (en
  fer pour une place libre).
- **Où elle pend** (`PlacedItem.label`, calculé par `planRoom`) : sous
  l'étagère pour les plantes posées ; pour les plantes suspendues, toutes
  sur **une seule rangée**, juste sous la tige la plus longue de la pièce
  (jamais devant les tiges, jamais à des hauteurs différentes). Une cellule
  libre au-dessus et au-dessous : une grande plante de la rangée suivante
  ne touche jamais la plaque.
  Les jours et le nom sont écrits dessus, en crème (`onWood` sur
  `plaqueWood`, contraste vérifié).
- **Le métal suit les jours de la vie en cours** (`plaqueTier`) : bronze
  (dès le premier jour), argent (30 jours), or (90), platine (180), opale
  (365). Une plante qui n'a pas tenu garde une plaque **ternie** (patine
  verdâtre, texte plus discret) ; une place libre a une planche de bois sans
  métal. Replanter repart du bronze, comme la plante repart de la graine.
- **Chaque métal brille à sa façon** (`plaqueShine`), jamais beaucoup :
  le bronze réchauffe seulement un rivet ; l'argent laisse passer une fine
  ligne froide ; l'or une bande chaude au cœur blanc, avec une petite
  étoile sur un rivet ; le platine une bande blanche plus large et plus
  lente, avec l'étoile ; l'opale une lente vague de ses couleurs. Le bronze
  ne brille qu'un tour sur trois, l'argent un sur deux.
- **Les plaques d'un mur prennent leur tour** (`glintAt`) : des tours de
  4 secondes, un sur deux reste calme, au moins quatre tours par ronde.
  Jamais deux plaques à la fois, et un mur plein ne brille pas plus d'une
  fois toutes les 8 secondes, quel que soit le nombre d'habitudes.
- **Rendu** (`ui/shelf/Plaque.tsx`) : chaque plaque a son petit canevas,
  enregistré une fois ; le reflet n'est dessiné que sur le mur affiché, et
  jamais avec « Réduire les animations ». Lumière éteinte, la plaque
  s'assombrit comme la pièce ; le texte reste crème.
- **Lecteur d'écran** : le métal est dit avec les jours (« Fumer, 122
  jours, plaque d'or »).
- Le texte est plus grand (17 et 13 points) et les plaques plus hautes
  (marges de 14 et 12 points) : les plantes rapetissent un peu sur les
  petits écrans.

## Conséquences

- Les plaques ne se reflètent pas dans le plancher (comme les étiquettes
  avant elles).
- À juger sur l'appareil : la lisibilité du nom sur le bois, la taille des
  plaques sur un petit écran, le coût des petits canevas pendant le
  glissement.
