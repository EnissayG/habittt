# 0001. Stack et architecture

- **Statut :** accepté
- **Date :** 2026-10-03

## Contexte

habittt est une application mobile pour arrêter des habitudes (« jours sans
fumer »). Le compteur avance avec le temps ; l'utilisateur ne saisit que ses
rechutes. Chaque habitude est une plante en pixel art, unique, qui pousse par
ajout et garde la trace des rechutes.

Contraintes :

- un développeur, étudiant, qui veut comprendre l'architecture ;
- tester sur son propre téléphone avec **Expo Go**, sans compte développeur
  Apple ni build natif ;
- plus tard : comptes, synchronisation entre appareils, publication sur les stores ;
- la plante ne doit jamais être stockée comme image.

## Décision

### Stack

| Choix                                                | Raison                                                                                                                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Expo (SDK 57) + React Native**                     | Une base de code pour iOS et Android, test immédiat avec Expo Go, build et publication via EAS le moment venu.                                                                    |
| **TypeScript strict** (+ `noUncheckedIndexedAccess`) | Les erreurs de type sont détectées avant l'exécution. `noUncheckedIndexedAccess` oblige à gérer le cas « élément absent » sur les tableaux, fréquent avec un historique de dates. |
| **expo-sqlite**                                      | Stockage local relationnel, inclus dans Expo Go. L'app fonctionne hors ligne ; la source de vérité est sur l'appareil.                                                            |
| **Zustand**                                          | État d'interface minimal, sans boilerplate ni Provider. Reste dans `ui/`.                                                                                                         |
| **react-native-skia**                                | Dessin 2D performant pour le pixel art, inclus dans Expo Go.                                                                                                                      |
| **Jest** (preset `jest-expo`)                        | Le préréglage officiel d'Expo. Exécute aussi les tests du domaine.                                                                                                                |
| **ESLint** (`eslint-config-expo`) + **Prettier**     | Configuration recommandée par Expo ; Prettier gère le format, ESLint le reste.                                                                                                    |

Seuls Expo, TypeScript, Jest, ESLint et Prettier sont installés à ce stade.
expo-sqlite, Zustand et react-native-skia seront ajoutés avec
`npx expo install` par la première fonctionnalité qui en a besoin, pour
garantir des versions compatibles avec Expo Go.

### Architecture

Trois couches dans `src/` : `domain/`, `data/`, `ui/`, avec la règle de
dépendance `ui -> domain <- data`, vérifiée par ESLint. `App.tsx` est la racine
de composition. Détails dans [architecture.md](../architecture.md).

### Modèle

- `Habit { id, name, seed, startDate, createdAt }` et
  `Relapse { id, habitId, date }`. Pas d'entité `CheckIn`.
- Identifiants UUID générés sur l'appareil.
- Dates métier en jour local `YYYY-MM-DD`.
- `plante = f(seed, startDate, rechutes, aujourd'hui)` : fonction pure du
  domaine ; la date du jour et le générateur aléatoire sont injectés.
- Croissance par ajout : chaque jour a une position stable, rien ne bouge
  après avoir poussé.

## Alternatives considérées

- **React Native sans Expo** : plus de contrôle natif, mais pas d'Expo Go et
  une configuration Xcode / Android Studio dès le premier jour. Rejeté.
- **Expo Router** (template par défaut) : utile pour plusieurs écrans, mais
  ajoute une dizaine de fichiers d'exemple. Reporté : on l'ajoutera avec la
  navigation.
- **AsyncStorage** au lieu de SQLite : simple, mais clé/valeur ; les requêtes
  par habitude et par date deviendraient du filtrage manuel. Rejeté.
- **Redux Toolkit** : plus structuré, mais trop lourd pour l'état d'UI d'une
  petite app. Rejeté au profit de Zustand.
- **Stocker la plante comme image** : rapide à afficher, mais il faudrait la
  régénérer, la stocker et la synchroniser à chaque changement. Rejeté.
- **Architecture sans couches** (tout dans les composants) : plus rapide au
  début, mais la logique de la plante deviendrait intestable et liée à React.
  Rejeté.
- **Compteur de série stocké** : lecture plus rapide, mais il peut diverger de
  l'historique des rechutes. Rejeté ; la série est calculée.

## Conséquences

- Le domaine est entièrement testable sans appareil ; il doit le rester.
- Ajouter Supabase revient à écrire une nouvelle implémentation dans `data/`.
- Toute bibliothèque avec du code natif absente d'Expo Go obligera à passer
  à un _development build_. À vérifier avant chaque ajout de dépendance.
- La croissance par ajout contraint le générateur : l'apparence d'un jour ne
  dépend que de ce qui s'est passé jusqu'à ce jour. Saisir ou supprimer une
  rechute pour un jour passé entre en tension avec cette règle ; question
  ouverte, voir architecture.md.
- Les avertissements `npm audit` actuels concernent l'outillage de
  développement d'Expo ; ils se règlent en suivant les mises à jour du SDK,
  pas avec `npm audit fix --force`.
