# 0020. Le bonsaï de la séance, le souffle façon poumon, la lumière éteinte

- **Statut :** accepté
- **Date :** 2026-10-12
- **Modifie :** [0019](0019-la-piece-refaite-et-la-seance-sans-mots.md) (la
  plante de la séance, la fin), [0018](0018-le-coin-meditation-revu.md) (la
  vibration) et [0017](0017-le-coin-meditation.md) (la plante qui pousse)

## Contexte

Essai sur téléphone de la phase 4c. Retours :

- la plante qui pousse pendant la séance ne plaît pas ; le soleil suffit ;
- la vibration ne ressemble pas à un souffle : on voudrait sentir l'air
  entrer vite, puis sortir en ralentissant, comme les poumons ;
- rien ne marque la fin d'une séance réussie ;
- on voudrait pouvoir éteindre la lumière de la pièce ;
- la guirlande passe derrière un tableau et derrière le pot d'une plante
  retombante ; le libellé « Méditer » est coupé.

## Décisions

### La séance

- **Un bonsaï adulte, déjà là** (`MEDITATION_BONSAI`, le bonsaï de
  l'écran d'ouverture), avec ses petits gestes (ADR 0016). La pousse
  (`growth`, `plantDaysAt`) et le tirage d'une plante (`drawMeditationPlant`)
  sont supprimés.
- **La vibration, comme les poumons** (`BREATH_PULSES`) : pendant
  l'inspiration, des coups rapides et réguliers (toutes les 0,13 s), de
  plus en plus forts ; une courte pause en haut ; pendant l'expiration, les
  coups partent aussi vite puis chaque intervalle s'allonge de 18 %, de
  plus en plus doux, comme l'air qui finit de sortir ; un court silence.
  Environ 43 coups par souffle.
- **La fin félicite** : le soleil s'ouvre en entier, de petites étoiles de
  lumière s'allument une à une autour du soleil et du bonsaï
  (`drawSparkles`), l'encens est consumé, puis « Bravo » apparaît avec
  « N minutes pour toi ». La longue vibration de fin est gardée.

### La lumière éteinte

- Un **interrupteur** (une ampoule en pixels) dans l'en-tête de la pièce,
  à côté des réglages. Son état est gardé tant que l'app est ouverte, pas
  enregistré.
- Éteinte : un voile sombre couvre toute la pièce ; ce
  qui donne de la lumière reste vif par-dessus (`roomLights` : les ampoules
  de la guirlande, la lanterne, la braise de l'encens), la flamme de la
  bougie aussi. La fenêtre : son cadre, ses rideaux et son appui
  s'assombrissent avec la pièce ; seule la vitre que les rideaux laissent
  libre (`DAYLIGHT`) garde la lumière de l'heure, un peu atténuée. La
  fumée n'est plus qu'une trace pâle.
- **Le reflet garde les lumières** (`reflectLights`) : ce qui brille près
  du sol (la bougie, la braise, ce qui est assez bas) se voit dans le
  plancher poli, à sa place exacte de miroir, et s'efface vers l'avant
  comme le reste du reflet ; les halos aussi, plus faibles, sans
  déborder sur le mur.
- **Le noir dépend de l'heure** (`lightsOffLook`, la vue de la fenêtre) :
  le jour (et en hiver), la lumière du dehors remplit encore la pièce, qui
  ne fait que s'assombrir (voile à 40 %, fenêtre presque intacte, textes
  restés foncés) ; le soir, la pénombre (65 %) ; la nuit, le noir (86 %),
  où seules les lumières brillent. Chaque couple texte-mur est vérifié en
  contraste.
- **Chaque source a son halo, vivant à sa façon** (`lightLevel`) : les
  ampoules scintillent chacune à son rythme, la lanterne respire lentement,
  la bougie vacille vite, la braise rougeoie et s'éteint, la fenêtre laisse
  passer la lumière du moment (presque rien la nuit). Les halos sont des
  dégradés doux dessinés dans leur propre canevas, 15 images par seconde,
  pour le seul mur affiché ; immobiles avec « Réduire les animations ».
- Le soir et la nuit, en-tête, libellés et icônes passent en clair
  (`textInDark`, `mutedInDark`), la barre d'état aussi.

### La pièce

- **Le plafond est réservé** (`CEILING_ROWS`) : la moulure et la guirlande
  occupent les premières rangées de chaque mur, rien n'y est accroché.
  La guirlande pend un peu moins bas (affaissement de 4 rangées au lieu
  de 6). Seul le cordon de la lanterne la traverse.
- **Le bouton « Méditer » devient une enseigne** (`drawSign`) : une
  petite planche de bois pendue à un clou de laiton par une ficelle, au-
  dessus du coussin ; le mot est écrit dessus (`onWood` sur `wood`). Elle
  fait partie du décor : elle s'assombrit avec la pièce et se voit dans le
  reflet. C'est elle que trouve le lecteur d'écran (« Méditer »).
- **Les noms sous les plantes retombantes** se placent juste sous leur
  plus basse tige, et non plus au bas de la bande (souvent bien plus bas, à
  cause de la fenêtre).

## Conséquences

- Les tables de pousse et leurs tests sont supprimés ; la séance ne dessine
  plus qu'une seule plante.
- À juger sur l'appareil : la force réelle des coups rapides (le téléphone
  peut les lisser), la lisibilité des plantes dans le noir, le coût des
  halos pendant le glissement entre les murs.
