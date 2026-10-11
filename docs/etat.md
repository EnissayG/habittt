# État du projet

Point de reprise entre deux sessions. À jour au **6 octobre 2026**, après la
phase 2, la refonte de l'étagère en murs et les retours du premier test. À lire en premier avec `CLAUDE.md`, puis
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
| Phase 2 bis      | Étagère en murs, plein écran, plancher miroir                                        | fait (ADR 0007), testé                      |
| Phase 2 ter      | Retours du test : panneaux, dates, mise en page, reflet, animation, Labo             | fait (ADR 0008), **à tester sur téléphone** |
| Phase 3a         | Total de l'en-tête, notes et arrosage (écrans 5 à 8)                                 | fait (ADR 0009), testé                      |
| Phase 3b         | La pièce en entier : trois murs au moins, décor, glissement continu                  | fait (ADR 0010), testé                      |
| Phase 3c         | Chiffres en Jersey 10, étiquettes et faits plus lisibles                             | fait, testé                                 |
| Phase 3d         | Retirer et effacer une habitude (écran 9)                                            | fait (ADR 0011), testé                      |
| Phase 3e         | Le journal de la plante (remplace l'historique)                                      | fait (ADR 0012), **à tester sur téléphone** |
| Phase 3f         | La plante meurt (vies, replanter), herbier, réglages, renommer                       | en cours (ADR 0013)                         |

Chiffres au dernier commit : 545 tests, typecheck et lint au vert, bundles
iOS et Android compilés. `expo-doctor` : 21/21 (correctifs Expo appliqués).

## Ce qui reste

### Phase 3f (en cours) : la plante meurt

Changement de concept décidé le 11 octobre 2026 : **une rechute fait
mourir la plante** de la vie en cours, on peut replanter (ADR 0013). À
faire, dans l'ordre :

1. Domaine : vies (`splitLives`), graine de replantation, replanter,
   statistiques et plante par vie, champ `PlantImage.dead`.
2. Données : table `replantings`, migration n° 5 (une replantation le jour
   de chaque rechute existante, pour ne rien faire mourir d'un coup).
3. Écrans : plante morte sur l'étagère et sur l'écran de l'habitude,
   « Replanter », nouveau texte du panneau de rechute.
4. **Herbier** (remplace le jardin) : les vies passées de chaque habitude.
5. **Réglages** (écran 11) : musique et barre « bientôt » ; rappel doux à
   20 h (notification locale, désactivé par défaut, « Ta plante est là, si
   tu as envie de passer la voir. ») ; l'herbier ; compte et
   synchronisation « bientôt » ; exporter mes données (JSON, feuille de
   partage) ; à propos (licences, dont Pixelify Sans et Jersey 10).
6. **Renommer** une habitude (menu de l'écran 5).
7. Doc de la phase.

### Hors périmètre pour l'instant

Voir [idees.md](idees.md) : musique, vitalité, compte et synchronisation,
marques après 120 jours, meubles et décors.

### À vérifier sur téléphone (phase 3e, le journal)

- Toucher la plante n'importe où ouvre le journal ; l'indice sous la
  plante.
- Le calendrier : ouvert sur le mois en cours, glisser vers les mois
  précédents jusqu'au mois de début, pas au-delà.
- Les couleurs : vert, orange (numéro en blanc), point rose des notes,
  aujourd'hui encadré ; les jours avant le début et après aujourd'hui
  vides.
- Sous le calendrier : les notes et rechutes du mois affiché, qui changent
  quand on glisse.
- Toucher un jour ou une note : le panneau du jour, « Écrire une note » /
  « Modifier la note », « Noter une rechute ce jour-là » / « Annuler la
  rechute ».
- La pastille « N notes › » : le journal sur le mois de la dernière note.
- Le menu : « Journal » au lieu d'« Historique ».
- La note du jour sous la plante après l'arrosage ; la toucher pour la
  modifier.

### À vérifier sur téléphone (phases 3c et 3d)

- Les chiffres en Jersey 10 partout : étagère, en-tête, compteur, record,
  date de début, panneaux (« Jour 87 · 4 octobre »), puces. Ils doivent
  avoir la hauteur des mots voisins ; « 951 » ne doit plus se lire « 981 ».
- L'étagère : le nombre de jours en premier, plus grand ; le nom dessous,
  plus discret ; l'en-tête « N plantes · N jours de séries en cours ».
- L'écran d'une habitude : le record et la date de début plus grands.
- **La migration n° 4 sur ta vraie base** : tes habitudes restent sur
  l'étagère.
- Retirer par appui long sur une plante de l'étagère, et par le menu
  (« Retirer ») ; les deux cartes ; « Confirmer » ramène à l'étagère sans
  la plante.
- « Tout effacer définitivement » : la seconde confirmation, puis la
  plante disparaît.
- Une plante mise dans l'herbier n'est visible nulle part tant que l'écran de
  l'herbier n'existe pas : c'est normal à ce stade.

### À vérifier sur téléphone (phase 3b, la pièce)

- Avec peu de plantes : trois murs au moins, des points, le glissement.
- Le glissement : libre, avec l'élan, puis calé en douceur sur le mur le
  plus proche ; jamais arrêté entre deux murs ; un geste fort peut
  traverser plusieurs murs (dis si tu préfères un mur à la fois).
- La fluidité pendant le glissement, surtout sur la démo (4 murs).
- Les points qui suivent le doigt.
- Le mur 2 : tablettes vides dessinées, tableau du coucher de soleil en
  haut tant qu'aucune plante retombante n'y pend.
- Le mur de décor : fauteuil et lampe posés sur la ligne du sol, tableau,
  tapis devant le fauteuil ; leurs proportions par rapport aux pots.
- Le reflet du fauteuil et de la lampe dans le plancher.
- Le Labo : le plancher limité au premier mur.

### À vérifier sur téléphone (phase 3a)

- Le total de l'en-tête : la somme des nombres sous les plantes, « jours
  d'affilée ».
- Arroser, avec et sans note ; la goutte qui tombe ; la petite fleur sur
  une plante de moins de 120 jours ; « Ta plante est arrosée. ».
- Le panneau au-dessus du clavier pendant qu'on écrit.
- Après une rechute, la proposition d'écrire un mot.
- La migration n°3 sur ta vraie base (tes habitudes doivent rester).
- La démo du Labo, qui contient maintenant des notes et des arrosages.

### Toujours à vérifier (phase 2 ter)

- L'ouverture : toujours le bonsaï, 1,5 s (après avoir fermé complètement
  Expo Go).
- Les panneaux : menu, rechute ; une seconde rechute le même jour propose
  de l'annuler.
- L'année dans « depuis le … » pour une date d'une autre année.
- Plus de coupure entre deux places de la tablette.
- La mise en page : fenêtre sous l'en-tête, rangées espacées, plancher plus
  haut, tablettes alignées d'un mur à l'autre.
- Le reflet : pots et plantes reconnaissables, net sous la plinthe.
- L'animation de la fenêtre, reprise de la maquette (nuages, fumée, soleil,
  étoiles à plusieurs éclats, étoile filante, flocons), à 6 images par
  seconde : la voir dans le Labo pour chaque vue, vérifier qu'elle s'arrête
  hors de l'étagère et avec « Réduire les animations ».
- La démo (Labo) : trois murs, le glissement, puis le retour à tes données.
- **Choisir la police des chiffres** dans la planche du Labo ; ensuite, en
  faire un rôle du thème et désinstaller les autres.
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

## Réponses aux questions de la phase 3

- « Je la donne » : la plante disparaît de l'app ; ses données restent et
  figurent dans l'export.
- L'export : un fichier JSON partagé avec la feuille de partage native
  (`expo-file-system`, `expo-sharing`).
- Le rappel du soir : 20 h, « Ta plante est là, si tu as envie de passer la
  voir. ».
- Pas de retour de l'herbier vers l'étagère pour l'instant (`idees.md`).
- Le rendu séché d'une plante morte sera fourni ; le domaine passe
  `PlantImage.dead`.
