# 0008. Retours du premier test sur iPhone

- **Statut :** accepté
- **Date :** 2026-10-06
- **Remplace en partie :** [0006](0006-ecrans-et-etagere.md) (panneaux en
  `Modal`) et [0007](0007-etagere-en-murs.md) (miroir du mur entier, écarts,
  un canevas par place)

## Contexte

Premier essai de l'étagère en murs sur iPhone. Les pixels sont nets et la
structure en murs fonctionne, mais plusieurs comportements étaient faux :
panneaux bloqués, coupure d'un pixel entre deux places, grand vide sous
l'en-tête, reflet illisible, chiffres difficiles à lire.

## Décision

### Les panneaux sont dessinés dans l'écran

Les panneaux (menu, arrosage, rechute) ne sont plus des `Modal` React Native
mais une couche de l'écran (`Sheet`, passé en `overlay` à `Screen`) : fond
assombri, panneau qui monte du bas, bouton retour Android géré. iOS ne
présente qu'un contrôleur à la fois. Un `Modal` qui n'arrivait pas à se
fermer laissait le panneau de rechute ouvert et empêchait le panneau
d'arrosage de s'ouvrir.

Après une rechute, le panneau se ferme, l'écran se recharge et affiche
« C'est noté. ». Si le jour a déjà une rechute, le panneau le dit et propose
« L'annuler » ou « Fermer ».

### Un seul canevas par mur

Chaque page dessine dans un seul canevas Skia : sa part du plancher et tout
le mur, enregistré en une `Picture`, avec des positions calculées en pixels
de l'appareil. Des zones tactiles transparentes et les noms sont posés
par-dessus. Avec un canevas par place, une largeur comme
`48 × (8 / 3) = 127,99999999999999` pt pouvait laisser une colonne vide
entre deux places. La fenêtre a son propre petit canevas, pour être la
seule à se redessiner pendant l'animation.

### Mise en page

- La fenêtre est juste sous l'en-tête.
- Les rangées sont alignées d'un mur à l'autre (chaque rangée prend la
  hauteur de son contenu le plus haut, tous murs confondus) : les tablettes
  se prolongent pendant le glissement.
- La hauteur libre, au-delà des 28 lignes minimales du plancher, est
  partagée : la moitié au plancher (jusqu'à 72 lignes), le reste en deux
  écarts égaux entre les rangées. Rien entre la dernière tablette et le
  sol : le reste va au plancher, qui descend jusqu'au bord de l'écran.

### Le reflet : le bas du mur seulement

Comprimer tout le mur rendait les plantes illisibles. Nouvelle règle, toujours
une seule fonction générale (`drawFloor`) :

- le reflet part de la **plus basse ligne dessinée** du mur (sous la
  dernière tablette, il n'y a que les noms, qui sont du texte) ;
- **une ligne sur deux**, pour que pots et plantes restent reconnaissables ;
- ce qui ne tient pas dans le plancher n'est pas reflété (en pratique, la
  fenêtre) ;
- opacité 0,5 juste sous la plinthe, puis **12 paliers** jusqu'à presque
  rien ;
- les joints des planches passent par-dessus.

### L'animation de la fenêtre

`drawWindow(vue, t)`, avec `t` en secondes : les nuages glissent (0,25 à
0,4 pixel par seconde) et reviennent par la gauche, une étoile ou deux se
reposent à chaque battement, la neige tombe (3 pixels par seconde) en
oscillant d'un pixel. Seule la vue derrière la vitre bouge ; `t = 0` est la
fenêtre immobile. Côté écran, `useWindowClock` fait avancer `t` 4 fois par
seconde, seulement quand l'écran est affiché, l'app au premier plan et
« Réduire les animations » désactivé (`t` reste alors à 0). Le plancher ne
suit pas : la fenêtre n'y est plus reflétée.

### Outils de développement (Labo)

- Une planche compare les chiffres dans cinq polices pixel (Pixelify Sans,
  Silkscreen, VT323, Press Start 2P, Jersey 10), à la taille du compteur et
  des étiquettes. La police choisie deviendra un rôle du thème, les autres
  seront désinstallées.
- « Remplir la démo » remplit une **seconde base SQLite**
  (`habittt-demo.db`) avec 17 habitudes de 3 à 400 jours, par les cas
  d'usage et avec des graines fixes ; « Revenir à mes données » reprend la
  vraie base, jamais touchée. Le choix est fait dans `App.tsx` ; au
  redémarrage, l'app revient aux vraies données.

### Dates

L'année s'affiche quand elle n'est pas celle du jour (« depuis le 28 février
2024 »). Le calcul des jours était juste (952 jours lus 982 : le 5 et le 8
se confondent dans Pixelify Sans) ; des tests couvrent minuit, le passage
d'année et le 29 février.

## Conséquences

- `Screen` a une prop `overlay` ; tout nouveau panneau doit y être placé.
- Une page de l'étagère a deux canevas (le mur et la fenêtre) au lieu d'un
  par élément.
- Les polices candidates alourdissent le bundle de développement jusqu'au
  choix.
