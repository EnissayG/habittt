# 0025. Le chat de la pièce

- **Statut :** accepté
- **Date :** 2026-10-19

## Décisions

- **Un chat en pixels vit le long du plancher**, d'un mur à l'autre
  (`scene/cat.ts`). Cinq pelages (`CAT_BREEDS`) : roux tigré, noir, gris
  au ventre blanc, calico (taches orange et noires), siamois (extrémités
  foncées, yeux bleus). Les pelages clairs ont un fin contour pour ne pas
  se fondre dans le mur crème.
- **Ses gestes** (`drawCat`, 26 × 16 cellules) : marcher (quatre images,
  les pattes et la queue), s'asseoir (la queue bat, il cligne des yeux),
  faire sa toilette (la patte et la langue), dormir en boule (il respire,
  des « z » montent), s'étirer au réveil.
- **Sa journée** (`catAt`), fonction pure du temps et d'une graine : il
  commence endormi ; au réveil il s'étire, puis marche (souvent jusqu'à un
  autre mur, à 7 cellules par seconde, tourné du côté où il va) ; ensuite
  il s'assoit ou fait sa toilette, repart, ou se rendort. Une nouvelle
  graine à chaque ouverture de la pièce.
- **Dans la pièce** (`ui/shelf/CatView.tsx`) : posé par-dessus tous les
  murs à la fois, dans le défilement ; les pieds sur le plancher, son
  reflet dessous ; il ne prend jamais un toucher ; lumière éteinte, il
  s'assombrit avec la pièce ; avec « Réduire les animations », il dort.
- **Le choix** : dans les réglages, « Le chat de la pièce », chaque pelage
  assis, ou « Pas de chat » ; gardé (`settings.ts`, clé `cat`, roux par
  défaut).

## Conséquences

- Le chat ne monte pas encore sur les étagères : il reste au sol. Idée pour
  plus tard (sauter sur une étagère, dormir près d'une plante, réagir au
  toucher).
