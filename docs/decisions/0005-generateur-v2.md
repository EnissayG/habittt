# 0005. Générateur v2 : 13 espèces, sinus calculé, settle, génome

- **Statut :** accepté
- **Date :** 2026-10-04
- **Complète :** [0003](0003-generateur-de-plantes.md)

## Contexte

Le prototype de référence (`docs/prototypes/plants.js`) a été remplacé par une
version plus riche : 13 espèces avec des variétés, un génome (pot, teinte,
miroir, trait rare) et une fonction `settle()` qui garde chaque jour visible.
L'app doit dessiner **exactement** les mêmes plantes que ce fichier. Trois
problèmes : le prototype utilise `Math.sin` et `Math.cos` sur des angles
continus, que la table de 64 angles de l'ADR 0003 ne peut pas reproduire ; des
jours entiers finissaient invisibles au jour 120 ; et le domaine ne doit
contenir ni couleurs ni textes affichés.

## Décision

### Sinus et cosinus calculés (`trig.ts`)

Au lieu d'une table, une fonction qui n'utilise que +, −, × et ÷ ; IEEE 754
définit ces opérations exactement, donc tous les moteurs JavaScript
calculent les mêmes bits.

```
sin(x) :
  1. réduction : k = round(x / 2π) ; r = x − k·2π     (r ∈ [−π, π])
  2. repli     : si r > π/2, r = π − r ; si r < −π/2, r = −π − r
                 (sin(π − r) = sin(r), donc r ∈ [−π/2, π/2])
  3. série de Taylor jusqu'à r²¹, évaluée par le schéma de Horner :
       sin(r) ≈ r · (1 + r²·(c₁ + r²·(c₂ + … + r²·c₁₀)))
       avec cₙ = (−1)ⁿ / (2n+1)!   (coefficients calculés une fois)
cos(x) = sin(x + π/2)
```

Sur [−π/2, π/2], le premier terme omis vaut moins de 3·10⁻¹⁶. Écart mesuré
avec `Math.sin` sur les angles des plantes : moins de 10⁻¹³. Résultat : aucune
différence de pixel avec le prototype (qui, lui, utilise `Math.sin`).

### `settle()` : chaque jour reste visible

Le plan brut est réécrit une seule fois, avant tout rendu :

1. chaque jour devient une table case → ton (sans les cases hors grille ni
   derrière le pot ; dans un même jour, le dernier coup l'emporte) ;
2. chaque case appartient au **dernier** jour qui la peint ; on compte les
   cases de chaque jour ;
3. du jour le plus ancien au plus récent, tant qu'un jour possède moins de
   `KEEP = 2` cases, il reprend une de ses cases au jour plus récent qui en a
   le plus, sans le faire descendre sous 1 (ou 2), et sans vider un jour
   intermédiaire qui peint aussi cette case ; la case est retirée de tous les
   jours suivants ;
4. un jour qui n'a toujours rien pousse d'un pixel dans la case libre la plus
   proche (distance de Manhattan ≤ 9), hors pot, terre et étagère.

L'ordre de parcours (ordre d'insertion des `Map`) est celui du prototype, ce
qui donne exactement le même résultat. Comme le plan est réécrit avant le
rendu et indépendamment de l'âge, la croissance par ajout est conservée. Une
8e propriété le vérifie : au jour 120, chaque jour a au moins un pixel visible.

### Génome et variétés

- Le génome est tiré d'un générateur séparé, initialisé par
  `fnv1a(espèce + "#genome") ^ seed·40503` : couleur, forme et motif du pot,
  miroir, teinte du feuillage (pondérée), trait rare (pondéré : 80 % aucun,
  14 % panaché, 5 % rosé, 1 % doré) et un sel pour placer les taches du trait.
- Chaque espèce choisit sa variété avec son propre générateur.
- **Le domaine ne renvoie que des identifiants** (`moyogi`, `forest`, `pink`,
  `terracotta`…). Les couleurs (`plantPalette.ts`) et les libellés français
  (`labels.ts`) sont dans l'UI.

### Parité vérifiée en permanence

`prototypeParity.test.ts` exécute le prototype tel quel et compare, pour
chaque espèce, la couleur et le jour de chaque pixel, ainsi que les libellés
des traits. Des graines choisies garantissent que chaque variété, chaque
trait et chaque forme de pot est comparé.

## Alternatives considérées

- **Garder la table de 64 angles** : impossible de reproduire le prototype au
  pixel près. Rejeté.
- **Utiliser `Math.sin` directement** : identique au prototype dans Jest,
  mais rien ne garantit le même résultat sur Hermes ou entre deux téléphones
  synchronisés. Rejeté.
- **Corriger les jours invisibles en redessinant chaque espèce** : long, et à
  refaire pour chaque nouvelle espèce. `settle()` le règle une fois pour
  toutes. Rejeté.
- **Couleurs et libellés dans le domaine** (comme le prototype) : rejeté,
  comme dans l'ADR 0003.

## Conséquences

- Les plantes des habitudes existantes ont changé (nouveau dessin des
  4 espèces d'origine, génome). C'est attendu avant la publication.
- `settle()` peut coûter plusieurs dizaines de millisecondes (plante
  araignée, aloès) : `planPlant` garde en mémoire les 64 derniers plans.
- Toute modification du prototype ou d'une espèce fait échouer le test de
  parité : les deux doivent évoluer ensemble.
- Le prototype est exclu de Prettier pour rester identique à l'original.
