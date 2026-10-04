# 0003. Générateur de plantes

- **Statut :** accepté
- **Date :** 2026-10-04
- **Complète :** [0002](0002-rechutes-et-croissance.md)

## Contexte

Chaque habitude est une plante en pixel art, calculée et jamais stockée
(ADR 0001), qui pousse par ajout et où une rechute ne change que l'apparence
de son jour (ADR 0002). Un prototype JavaScript (`docs/prototypes/plants.js`)
valide l'approche. Il fallait le porter dans le domaine, en TypeScript, sous
une forme qui accueille beaucoup d'espèces et qui reste identique sur tous les
appareils.

## Décision

- **Plan de croissance fixe.** Chaque espèce planifie ses 120 jours d'un coup,
  à partir du seed seulement. Le rendu peint les jours 1 à N dans l'ordre. La
  croissance par ajout en découle directement.
- **Couleurs symboliques** (`tone`) et drapeau `relapse` sur chaque pixel, au
  lieu de couleurs hexadécimales et d'une palette « malade ». Le thème de l'UI
  choisit les couleurs ; il pourra y ajouter la vitalité.
- **Une espèce = un fichier** implémentant `Species`, plus une ligne dans le
  registre. Les tests parcourent le registre.
- **Taille de grille définie à un seul endroit** (`PLANT_GRID`) ; les espèces
  reçoivent un point d'ancrage et ne connaissent pas la taille.
- **Hasard** : `mulberry32` initialisé par `fnv1a(espèce) ^ seed`, uniquement
  des opérations entières 32 bits.
- **Trigonométrie en table** de 64 angles, écrite en dur, pour l'arbre de jade.
- **Espèce inconnue** : plante de remplacement au dessin, valeur brute
  conservée dans `Habit.species`.
- **`Habit.species`** stocké en base ; migration n°2 qui répartit les
  habitudes existantes selon `seed % 4`.

## Alternatives considérées

- **Stocker la plante comme image** : déjà rejeté par l'ADR 0001.
- **Couleurs hexadécimales dans le domaine** (comme le prototype) : le domaine
  dépendrait de l'apparence, et la vitalité exigerait de recalculer la plante.
  Rejeté.
- **Calculer chaque jour en fonction des jours écoulés** : plus souple, mais la
  croissance par ajout ne serait plus garantie par construction. Rejeté.
- **`Math.sin` et `Math.cos`** : plus simple, mais leurs résultats ne sont pas
  garantis identiques au bit près entre moteurs JavaScript ; une plante
  pourrait différer entre deux appareils synchronisés. Rejeté.
- **Lever une erreur sur une espèce inconnue** : bloquerait l'écran d'un
  appareil pas à jour. Rejeté.
- **Remplacer l'espèce inconnue à la lecture** : la prochaine sauvegarde
  écraserait la vraie espèce. Rejeté.
- **Une grande fonction avec un `switch` par espèce** : chaque ajout
  modifierait un fichier commun. Rejeté.

## Conséquences

- Le générateur est entièrement testé sans appareil, par 7 propriétés vérifiées
  pour chaque espèce, et une référence figée par espèce.
- Redessiner une espèce change toutes les plantes existantes de cette espèce.
  Le dessin des quatre espèces sera retravaillé avant la publication ; les
  références figées seront mises à jour volontairement à ce moment-là. Après
  la publication, on versionnera plutôt les espèces.
- Le portage conserve une limite du prototype : des jours finissent
  entièrement recouverts au jour 120 (jusqu'à 39 sur 120 pour le pothos). Le
  redessin devra garantir que chaque jour reste visible.
- La couche de vitalité pourra être ajoutée sans toucher au générateur.
