# 0004. Rendu des plantes et thème

- **Statut :** accepté
- **Date :** 2026-10-04
- **Complète :** [0003](0003-generateur-de-plantes.md)

## Contexte

Le générateur (ADR 0003) produit une grille de pixels à couleurs symboliques.
Il faut la dessiner dans l'app, dans Expo Go, en pixels nets à toutes les
tailles d'écran, avec de vraies couleurs choisies par l'interface. Il faut
aussi pouvoir régler les espèces sans passer par la base de données.

## Décision

- **Dessin avec `@shopify/react-native-skia`** (2.6.2, inclus dans Expo Go
  SDK 57). Un chemin (`Path`) par couleur, fait de rectangles fusionnés par
  ligne ; antialiasing désactivé.
- **Échelle entière en pixels physiques** : chaque pixel de plante fait
  exactement k × k pixels de l'écran, `k = floor(place disponible ×
PixelRatio / taille de la grille)`. La plante grandit par paliers et se
  centre dans l'espace restant.
- **Thème de l'interface en Solarized Light**, dans `src/ui/theme/` :
  `tokens.ts` (couleurs sémantiques, polices, espacements) et
  `plantPalette.ts` (couleurs des tons de plante, palette jaunie des jours de
  rechute, couleurs des pots). Aucun écran n'écrit de couleur en dur.
- **Deux rôles typographiques** : `display` (police pixel pour le nom de
  l'app, les titres et les compteurs) et `body` (police système lisible).
- **Paramètre de vitalité** (`thirst`, `fatigue`) déjà présent dans
  `plantColor`, sans effet pour l'instant.
- **La plante d'une habitude est calculée par le cas d'usage `getHabit`** ;
  l'écran l'affiche seulement.
- **Écran « Labo »** réservé au mode développement (`__DEV__`) : il appelle
  directement le générateur, sans base de données.

## Alternatives considérées

- **react-native-svg** : inclus dans Expo Go, mais un nœud par élément, et
  `shapeRendering="crispEdges"` n'est pas garanti partout. Moins adapté à une
  étagère de nombreuses plantes. Rejeté.
- **Une vue React Native par segment de pixels** : aucune dépendance, mais 300
  à 600 vues natives par plante. Rejeté.
- **Une image PNG agrandie** : le composant `Image` lisse en agrandissant
  (flou), sans option « plus proche voisin ». Rejeté.
- **Une échelle fractionnaire qui remplit exactement la place** : des pixels
  de largeurs inégales et des liserés entre eux. Rejeté.
- **Garder la palette crème d'origine** : deux palettes cohabiteraient avec
  celle des plantes. Rejeté au profit de Solarized Light partout.

## Conséquences

- **Aucun texte sous 4,5:1** (WCAG AA). Le thème déclare les seules paires
  texte/fond autorisées (`TEXT_PAIRS`) ; `contrast.test.ts` vérifie chaque
  paire et interdit aux écrans de colorer un texte avec un autre rôle.
  Conséquences sur la maquette : texte foncé sur le bouton vert (4,69:1),
  petits textes en `#586E75` (4,99:1), cartes sans fond coloré, champs sur
  `#FFF9E9`, bouton de rechute neutre, erreurs dans la couleur du texte. Le
  vert et le rouge Solarized ne servent jamais à écrire (2,97:1 et 4,29:1).
- **Police pixel** : Pixelify Sans (SIL OFL, accents français vérifiés), en
  Medium pour `fonts.display` et SemiBold pour `fonts.displayBold`. Seules
  ces deux graisses sont embarquées.
- Le script d'installation de Skia (copie des bibliothèques natives) est
  bloqué par npm. Il est inutile dans Expo Go, qui embarque Skia, mais **il
  faudra l'autoriser** (`npm install-scripts approve @shopify/react-native-skia`)
  avant le premier build natif (development build ou EAS Build).
- Skia déclare `react-native-reanimated` comme dépendance facultative, mais
  l'exige au démarrage dans Expo Go (« react-native-reanimated is not
  installed! »). `react-native-reanimated` 4.5.1 et `react-native-worklets`
  0.10.1 sont donc installés ; `babel-preset-expo` ajoute le plugin Babel
  nécessaire automatiquement.
- Skia n'est pas chargé dans Jest : seules les fonctions pures de rendu
  (palette, regroupement par couleur, échelle) sont testées. L'affichage réel
  se vérifie sur téléphone, notamment avec le Labo.
