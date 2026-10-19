# 0021. Toute l'app dans le noir

- **Statut :** accepté
- **Date :** 2026-10-12
- **Modifie :** [0020](0020-bonsai-souffle-et-lumiere-eteinte.md) (la
  lumière éteinte ne touchait que la pièce)

## Contexte

La lumière éteinte assombrit la pièce, mais dès qu'on touche une plante ou
qu'on va méditer, l'écran redevient crème. On veut que tout soit sombre :
chaque écran, chaque panneau.

## Décisions

- **Deux palettes, les mêmes rôles** (`ui/theme/tokens.ts`) : `colors`
  (la lumière allumée) et `darkColors` (éteinte), réunies dans `PALETTES`.
  La palette sombre reprend le mur de la pièce dans le noir pour le fond,
  les tons sombres de Solarized pour le texte. Un rôle garde son sens
  (`text` reste le texte, `muted` le texte discret) : aucun écran n'a de
  cas particulier.
- **L'état de la lumière est partagé** (`ui/theme/ThemeContext.tsx`) :
  `LightsProvider` enveloppe la navigation, `useLights()` donne l'état et
  l'interrupteur (l'ampoule de la pièce), `usePalette()` les couleurs du
  moment. Gardé tant que l'app est ouverte, pas enregistré.
- **Chaque écran écrit ses styles une fois pour les deux palettes** :
  `const makeStyles = (colors: Palette) => StyleSheet.create({...})`, puis
  `useThemedStyles(makeStyles)` dans le composant ; les styles ne sont
  refaits que quand la lumière change. La navigation (fond des écrans) et
  la barre d'état suivent.
- **La pièce ne change pas de méthode** : elle est toujours dessinée
  allumée puis assombrie selon l'heure (ADR 0020) ; ses rôles à elle
  (voiles, `onWood`...) sont identiques dans les deux palettes.
- **Le soleil de la méditation** : dans le noir, ses anneaux d'air se
  fondent dans le fond sombre (`sunOnDark`) au lieu de pâlir vers le
  crème.
- **Contrastes** : chaque paire de `TEXT_PAIRS` est vérifiée dans les deux
  palettes ; les textes de la pièce (`ROOM_TEXT_PAIRS`) dans la palette
  claire, puisque la pièce est dessinée allumée.

## Conséquences

- Un nouvel écran doit suivre le modèle `makeStyles` / `useThemedStyles`,
  sinon il restera clair dans le noir.
- Les plantes et les dessins gardent leurs couleurs : seuls les fonds, les
  textes et les commandes changent.
