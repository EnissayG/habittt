# 0017. Le coin méditation

- **Statut :** accepté
- **Date :** 2026-10-11
- **Spécification :** [meditation.md](../meditation.md)
- **Complète :** [0010](0010-la-piece-en-entier.md) et
  [0016](0016-gestes-des-plantes.md)

## Contexte

Le fauteuil du mur de décor n'était qu'un dessin. La spécification
([meditation.md](../meditation.md)) en fait une place où s'asseoir : on
choisit une durée, et une plante pousse dans un pot vide à chaque
respiration, jusqu'à être adulte à la fin de la séance. Ce sont les mêmes
120 jours que pour une habitude, mais en quelques minutes.

## Décisions

- **Le domaine** (`src/domain/meditation.ts`) calcule tout à partir d'un seul
  nombre : les secondes passées dans la séance, fournies par l'UI.
  - `MEDITATIONS` : les trois séances (5, 10 et 30 minutes), leurs phrases
    et leurs moments, et leur rythme de pousse (`growth`). Un test vérifie
    que les phrases sont **exactement** celles des tableaux de
    `meditation.md`.
  - Le souffle (`breathAt`) dure 10 s : 4 s d'inspiration, 6 s d'expiration.
    `breathLevel` donne le nombre de cases pleines de la barre.
  - La plante (`plantDaysAfter`, `plantDaysAt`) grandit à la fin de chaque
    expiration : 4 jours par souffle en 5 minutes, 2 en 10 minutes, 2 tous
    les trois souffles en 30 minutes. Elle a 0 jour au début et 120
    exactement au dernier souffle, et ne diminue jamais.
  - `phraseAt` : la phrase reste affichée 14 s (`PHRASE_SECONDS`), puis plus
    rien jusqu'à la suivante. `minutesLeft` arrondit à la minute supérieure.
  - Le tirage de la plante (`drawMeditationPlant`) prend l'espèce parmi les
    treize, puis une graine, avec le générateur injecté. Le tracker
    l'expose (`tracker.drawMeditationPlant()`), ce qui évite que l'UI
    importe `data/`.
- **Rien n'est enregistré** : pas de table, pas de migration, rien dans
  l'export. La plante de la séance est oubliée en quittant l'écran.
- **L'entrée** : chaque élément de décor du plan de la pièce porte son nom
  (`PlacedContent.piece` : `armchair`, `lamp` ou `painting`). L'étagère
  pose une zone tactile transparente sur le fauteuil, avec le libellé
  « Le fauteuil : méditer ». Le dessin, le reflet et les gestes n'utilisent
  que l'image : ils ne changent pas.
- **L'écran 12** (`MeditationScreen`) est une seule route, en trois temps :
  - **choisir** : la durée, et l'interrupteur « Vibrer à chaque
    inspiration ». L'app n'a pas d'endroit où ranger des réglages (l'état
    du rappel du soir, c'est la notification programmée elle-même) :
    l'interrupteur est donc activé à chaque séance ;
  - **la séance** : la plante est dessinée par `renderPlant` et affichée
    avec `PlantPixels`, pas avec `LivingPlant`. Elle ne fait donc **aucun
    geste**, ne meurt pas et n'a pas de jours arrosés. Sous la plante, la
    barre : 12 cases carrées aux couleurs du thème, sans coin arrondi. Avec
    « Réduire les animations », les mots « inspire » et « expire » la
    remplacent. Toucher l'écran masque ou montre « encore N min » et
    « Terminer ». Quitter (« Terminer » ou retour) ramène à la pièce sans
    rien dire ;
  - **la fin** : la plante adulte, « Elle a poussé pendant que tu
    respirais. », puis son nom, et « Revenir à la pièce ».
- **Le nom de la plante** (`plantName`, `labels.ts`) : les libellés
  existants de l'espèce et de la variété, précédés d'un article propre à
  l'espèce (`SPECIES_ARTICLES`), par exemple « Une fougère de Boston
  (retombante). ». Le feuillage et le trait n'y figurent pas.
- **L'horloge de la séance** (`useSessionClock`) mesure le temps réel
  écoulé (`performance.now()`) dix fois par seconde. Elle ne tourne que
  lorsque l'app est au premier plan : en arrière-plan, la séance est en
  pause, et elle reprend où elle en était.
- **Modules** : `expo-keep-awake` garde l'écran allumé pendant la séance
  seulement ; `expo-haptics` donne un coup léger au début de chaque
  inspiration (si l'interrupteur est activé) et une vibration de réussite,
  plus longue, à la fin. La doc du SDK 57 indique que les deux sont inclus
  dans Expo Go.
- **`useReduceMotion`** : le réglage « Réduire les animations », sorti dans
  son propre hook, partagé par l'horloge de la fenêtre et par la séance.

## Conséquences

- Une seconde façon de faire pousser une plante, sans rien stocker et sans
  toucher au modèle de données.
- La vibration de fin a lieu même si l'interrupteur est désactivé :
  l'interrupteur ne concerne que les inspirations. À revoir si c'est gênant.
- Garder la dernière plante près du fauteuil jusqu'au lendemain demanderait
  de l'enregistrer : l'idée est notée dans [idees.md](../idees.md).
