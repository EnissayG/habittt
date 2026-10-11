# 0016. Les gestes des plantes

- **Statut :** accepté
- **Date :** 2026-10-11
- **Complète :** [0005](0005-generateur-v2.md) et
  [0013](0013-la-plante-meurt.md)

## Contexte

Les plantes étaient des images fixes. Un premier essai les faisait toutes
se balancer avec une même règle (chaque pixel décalé selon sa distance au
pot). Rejeté : trop de mouvement, et toutes les plantes faisaient la même
chose, comme une ondulation. Ce qui a été retenu : presque rien ne bouge,
et chaque espèce a son propre geste, selon ce qu'elle est et sa rigidité.

## Décisions

- **Une plante est immobile presque tout le temps.** À la fin de chaque
  repos, une seule partie fait un geste : elle se décale d'un pixel pendant
  une seconde (`GESTURE_SECONDS`), puis revient.
- **Le geste appartient à l'espèce.** En planifiant sa croissance, chaque
  espèce déclare ses parties (`plan.part({ dx, dy, tail?, hide? })`) et
  marque les traits qui les composent (`plan.mark`).

  | Espèce           | Geste                                                  | Repos |
  | ---------------- | ------------------------------------------------------ | ----- |
  | Fougère          | la pointe d'une fronde s'abaisse                       | 4 s   |
  | Pothos           | le bout d'une liane (ses trois dernières feuilles)     | 4 s   |
  | Chaîne de perles | les deux dernières perles d'un fil s'écartent          | 4 s   |
  | Plante araignée  | la pointe d'une feuille, ou un stolon avec son rejet   | 4 s   |
  | Monstera         | une grande feuille s'abaisse                           | 5 s   |
  | Calathea         | une feuille s'ouvre vers l'extérieur                   | 6 s   |
  | Ficus            | une feuille s'abaisse                                  | 6 s   |
  | Bonsaï           | le dessus d'un coussin de feuillage frémit             | 7 s   |
  | Bambou           | une brindille s'abaisse ; les cannes ne bougent jamais | 8 s   |
  | Jade             | un petit bouquet de feuilles tremble                   | 8 s   |
  | Aloe             | la pointe d'une feuille s'écarte                       | 10 s  |
  | Sansevieria      | la pointe d'une lame penche                            | 12 s  |
  | Cactus           | rien ne bouge ; fleuri, un pétale se referme           | 12 s  |

- **Le bois ne bouge jamais** (tronc et branches du bonsaï, du jade, du
  ficus), ni le pot, la terre et la tablette.
- **`tail`** : seul le bout de la partie bouge, c'est-à-dire ses traits de
  rang le plus élevé déjà poussés. Le bout d'une liane est donc toujours le
  bout actuel, à tout âge.
- **`hide`** : la partie n'est pas dessinée pendant son « geste » (le pétale
  du cactus).
- **Les traits ne sont pas modifiés.** Les parties sont notées à côté du
  plan (par jour et par cellule) et retrouvées après `settle`. Le dessin
  d'une plante immobile est identique à celui du prototype ; le test de
  parité et les références figées n'ont pas changé.
- **Le rendu redessine.** `renderPlant({ gesture })` repeint tous les
  traits dans l'ordre des jours, ceux de la partie décalés : ce qui était
  dessous apparaît, il n'y a pas de trou. Un trait qui sortirait de la
  grille ou couvrirait le pot reste à sa place.
- **Le moment et la partie sont calculés** (`gestureAt`) : un décalage
  propre à chaque plante, tiré de sa graine, pour que deux plantes ne
  bougent pas ensemble ; la partie de chaque cycle est tirée de la graine
  et du numéro du cycle. Aucun hasard à l'exécution.
- **`renderPlant` se souvient de la recette de chaque image** (une
  `WeakMap`) : `withGesture(image, partie)` peut la redessiner sans que
  l'UI connaisse la graine, les arrosages ou l'âge. Les images déplacées
  sont gardées en mémoire par image et par partie.
- **Pas de geste** pour une plante séchée, un pot vide, avec « Réduire les
  animations », ni quand l'écran n'est pas affiché.
- **Où** : l'écran d'une habitude (`LivingPlant`) et le Labo. Pas encore
  l'étagère, où tout un mur est un seul dessin (voir `idees.md`).

## Conséquences

- Ajouter une espèce : en plus de son fichier et de sa ligne du registre,
  lui donner un repos (`rest`) et, si elle doit bouger, désigner ses
  parties.
- Écrit sans téléphone : l'allure réelle des gestes est à juger dans Expo
  Go, espèce par espèce, dans le Labo.
