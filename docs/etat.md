# État du projet

Point de reprise entre deux sessions. À jour au **6 octobre 2026**, après la
phase 2 et la refonte de l'étagère en murs. À lire en premier avec `CLAUDE.md`, puis
[architecture.md](architecture.md) et les [ADR](decisions/).

## Où on en est

| Phase            | Contenu                                                                              | État                                        |
| ---------------- | ------------------------------------------------------------------------------------ | ------------------------------------------- |
| Mise en place    | Expo SDK 57, TypeScript strict, Jest, ESLint/Prettier, couches                       | fait                                        |
| Jalon 1          | Domaine en TDD : `LocalDate`, `Habit`, `Relapse`, séries, repositories               | fait                                        |
| Première version | SQLite, cas d'usage, écrans simples                                                  | fait, puis remplacé                         |
| Générateur       | Plantes en pixels, propriétés testées                                                | fait (ADR 0003)                             |
| Rendu            | Skia, palette Solarized Light, Labo                                                  | fait (ADR 0004)                             |
| Phase 0          | Police Pixelify Sans, contraste ≥ 4,5:1 testé                                        | fait                                        |
| Phase 1          | Port exact du prototype : 13 espèces, `settle()`, génome, variétés, libellés, parité | fait (ADR 0005)                             |
| Phase 2          | Navigation, écrans 1, 2, 3, 4, 5, 7, 8, fenêtre et plancher                          | fait (ADR 0006), **à tester sur téléphone** |
| Phase 2 bis      | Étagère en murs, plein écran, plancher miroir                                        | fait (ADR 0007), **à tester sur téléphone** |
| Phase 3          | Notes et arrosage, retrait, jardin, réglages, renommer                               | à faire                                     |

Chiffres au dernier commit : 403 tests, typecheck et lint au vert, bundles iOS et Android compilés.

## Ce qui reste

### Phase 3 (prochaine)

Décisions déjà prises : voir
[architecture.md, section « Prévu en phase 3 »](architecture.md). À faire :

1. **Écran 6, notes et arrosage** : remplacer le panneau « Bientôt » de
   l'écran 5 par le vrai panneau ; chip « N notes » sur l'écran 5 ; notes
   encadrées dans la grille et listées sous l'historique (écran 7) ; petite
   fleur sur le jour arrosé ; toucher la plante affiche le jour et sa note.
   Après une rechute (écran 8), proposer d'écrire une note.
2. **Écran 9, retirer** : par appui long sur l'étagère ou par le menu de
   l'écran 5, jamais par glissement (il sert à changer de mur) ; « Elle rejoint le jardin » ou « Je
   la donne » ; « Tout effacer définitivement » avec une seconde
   confirmation.
3. **Écran 10, le jardin** : même présentation que l'étagère, en lecture
   seule ; accessible depuis l'étagère et depuis les réglages (l'étagère
   n'a plus de « bas » : où placer l'accès est à décider).
4. **Écran 11, réglages** : musique et barre de musique affichées
   « bientôt » ; rappel doux le soir (notification locale, désactivé par
   défaut) ; le jardin ; compte et synchronisation « bientôt » ; exporter mes
   données ; à propos (licences, dont Pixelify Sans).
5. **Renommer** une habitude (menu de l'écran 5).
6. Doc et ADR de la phase.

### Hors périmètre pour l'instant

Voir [idees.md](idees.md) : musique, vitalité, compte et synchronisation,
marques après 120 jours, animation de la fenêtre, meubles et décors.

### À vérifier sur téléphone (phases 2 et 2 bis)

- L'ouverture (1,5 s), la fenêtre selon l'heure.
- L'étagère en plein écran : mur sous la barre d'état, plancher jusqu'au
  bord, points au-dessus de la barre d'accueil, aucun rebond ni défilement
  vertical.
- Le passage d'un mur à l'autre (créer 7 plantes debout ou 2 retombantes
  pour avoir un mur 2), et le raccord du plancher entre deux murs.
- Le reflet du plancher : lisible, assez discret, joints par-dessus.
- Le temps d'affichage de l'étagère (calcul du plancher, environ 27 ms sous
  Node pour trois murs, plus sous Hermes) et la fluidité du glissement.
- La netteté des pixels partout, à la même échelle.
- Le sélecteur de date en mode calendrier sur iOS, dans les panneaux.
- Le glisser-retour sur iOS.

## Décisions de la session non écrites ailleurs

### Façon de travailler

- **Commits** : faits par Claude, atomiques, **sans aucune mention de
  Claude** (ni `Co-Authored-By`, ni lien de session). Pendant un temps,
  l'utilisateur committait lui-même ; ce n'est plus le cas.
- **Rien n'est poussé** sans demande explicite.
- **Arrêt à la fin de chaque phase** pour tester sur l'iPhone avant de
  continuer.
- **Plan d'abord** pour une étape nouvelle, accord de l'utilisateur, puis
  code. Domaine en TDD (tests avant le code, montrés en échec).
- **Signaler un mauvais choix avant de l'appliquer** plutôt que de le
  corriger en silence.
- **Le commit `6da6d1f`** (« visualisation des plantes ») regroupe huit
  commits prévus ; il est déjà poussé et a été gardé tel quel.

### Références

- `docs/prototypes/plants.js` est la **référence des plantes** : l'app doit
  dessiner exactement les mêmes. Modifier l'un sans l'autre fait échouer le
  test de parité. Le fichier est exclu de Prettier pour rester identique.
- `docs/prototypes/maquette-habittt.html` est la **cible visuelle** des
  écrans : une référence à reproduire en React Native, pas du code à copier.

### Points techniques à retenir

- **Script d'installation de Skia** bloqué par npm : à autoriser
  (`npm install-scripts approve @shopify/react-native-skia`) avant le premier
  build natif (development build ou EAS). Inutile dans Expo Go.
- **`expo` passe parfois de `~57.0.x` à `^57.0.x`** dans `package.json`
  quand on lance l'app ; l'utilisateur annule ce changement, qui ne doit pas
  être committé.
- **Polices** : importer chaque graisse par son chemin
  (`@expo-google-fonts/pixelify-sans/500Medium`) pour n'embarquer que celles
  utilisées.
- **Graines de la parité** : les graines supplémentaires de
  `prototypeParity.test.ts` couvrent chaque variété, trait et forme de pot ;
  un test vérifie que cette couverture reste complète.
- **Notifications** : les notifications locales (rappel doux) fonctionnent
  dans Expo Go ; seules les notifications push en sont exclues (vérifié dans
  la doc SDK 57).
- **Sous Git Bash, ne pas utiliser `sed` avec un motif contenant `` \` ``** :
  GNU sed le lit comme « début de ligne ». Préférer un petit script Node ou
  l'outil d'édition.

## Questions ouvertes pour la phase 3

- « Je la donne » : la plante quitte l'étagère et n'est pas au jardin ; où
  peut-on la retrouver (réglages, rien) ?
- Format de l'export : JSON partagé avec la feuille de partage native ?
- Le rappel du soir : à quelle heure, et avec quel texte (sans reproche) ?
