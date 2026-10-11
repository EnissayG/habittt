# État du projet

Point de reprise entre deux sessions. À jour au **11 octobre 2026**, après la
phase 4a (le coin méditation). À lire en premier avec `CLAUDE.md`, puis
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
| Phase 3f         | La plante meurt (vies, replanter), herbier, réglages, renommer                       | fait (ADR 0013, 0014), **à tester**         |
| Phase 3g         | Reflet miroir du plancher, nouveaux tableaux, plante séchée                          | fait (ADR 0015), **à tester sur téléphone** |
| Phase 3h         | Gestes des plantes, un par espèce (habitude, Labo, étagère et son reflet)            | fait (ADR 0016), **à tester sur téléphone** |
| Phase 4a         | Le coin méditation : une plante pousse à chaque souffle (écran 12)                   | fait (ADR 0017), **à tester sur téléphone** |
| Phase 4b         | Le coin méditation revu : décor, bouton, lumière du souffle, vibrations rythmées     | fait (ADR 0018), **à tester sur téléphone** |

Chiffres au dernier commit : 1222 tests, typecheck et lint au vert, bundles
iOS et Android compilés. `expo-doctor` : 21/21 (correctifs Expo appliqués).

## Ce qui reste

### Prochaine étape

La phase 4a (le coin méditation, [meditation.md](meditation.md)) est
faite. Reste à la tester sur téléphone (ci-dessous), avec les phases 3, puis
à choisir la suite parmi [idees.md](idees.md).

La phase 3g (ADR 0015) a été écrite hors de Claude Code, sans téléphone :
les tests, le typecheck et le lint passent, mais **le bundle n'a pas été
recompilé et rien n'a été vu dans Expo Go**.

### À vérifier sur téléphone (phase 4b, le coin méditation revu)

Écrit hors de Claude Code, sans téléphone : tests, typecheck et lint
passent, le bundle n'a pas été recompilé. Cette liste remplace, pour
l'entrée, la barre et la vibration, celle de la phase 4a ci-dessous.

- **Le coin** : sur le dernier mur, le fauteuil sur son tapis sous le
  tableau des montagnes ; à côté, la table basse avec la bougie, la statue
  assise, les galets et l'encens dont la fumée monte ; au-dessus, le
  rouleau au cercle ; entre les deux cadres, la lanterne de papier pendue
  au plafond ; la lampe au bout du mur. Tout se reflète dans le plancher.
- **Le bouton « Méditer »** au-dessus du fauteuil : visible, il ne touche
  ni le tableau ni le fauteuil. Toucher le fauteuil, la table ou le rouleau
  ouvre aussi l'écran 12. Avec VoiceOver : un seul bouton, « Méditer ».
- **Avec très peu de plantes** (pièce basse) : le rouleau, la lanterne ou
  le tableau peuvent manquer ; rien ne se chevauche.
- **La lumière du souffle** : un disque clair derrière la plante, qui
  grandit 4 s et se retire 6 s, en douceur ; le mot « inspire » ou
  « expire » dessous. La plante reste lisible devant la lumière.
- **Les vibrations** : pendant l'inspiration, de petits coups de plus en
  plus rapprochés et marqués ; une pause en haut ; pendant l'expiration,
  des coups qui s'espacent et s'adoucissent ; puis le silence jusqu'au
  souffle suivant. Dire si c'est trop, pas assez, ou si on ne sent pas la
  différence entre les trois forces. Aucune avec l'interrupteur désactivé.
- **« Réduire les animations »** : la lumière ne bouge plus, les mots
  changent, la plante pousse.

### À vérifier sur téléphone (phase 4a, le coin méditation)

- **L'entrée** : sur le mur de décor, toucher le fauteuil ouvre l'écran 12 ;
  toucher la lampe, le tableau ou le tapis ne fait rien. Avec VoiceOver :
  « Le fauteuil : méditer ».
- **Le choix** : « Combien de temps ? », les trois durées, le texte,
  l'interrupteur « Vibrer à chaque inspiration », activé à chaque fois.
- **La séance** : le pot vide en grand, puis une pousse à la fin de chaque
  expiration. La barre se remplit en 4 s et se vide en 6 s, par cases
  carrées, sans coin arrondi. Les phrases aux bons moments, 14 s chacune,
  sur deux lignes au plus. « encore N min » et « Terminer » en bas ;
  toucher l'écran les masque ou les montre.
- **La séance de 5 minutes en entier** : la plante est adulte à la fin ;
  « Elle a poussé pendant que tu respirais. », son nom (par exemple « Une
  fougère de Boston (retombante). »), « Revenir à la pièce ». Vérifier que
  l'article est le bon pour l'espèce qui sort.
- **La plante ne fait aucun geste** pendant la séance, ni à la fin.
- **La vibration** : un coup léger au début de chaque inspiration (le
  premier dès le début), aucun avec l'interrupteur désactivé ; une
  vibration plus longue à la fin, même avec l'interrupteur désactivé
  (dis si ça gêne).
- **L'écran reste allumé** pendant toute la séance, puis s'éteint de
  nouveau normalement après être revenu à la pièce.
- **Arrière-plan** : quitter l'app au milieu, attendre, revenir ; la séance
  reprend où elle en était (même phrase, même plante, même temps restant).
- **Quitter avant la fin** : « Terminer » ou le glisser-retour ramène à la
  pièce, sans message.
- **« Réduire les animations »** : les mots « inspire » et « expire » à la
  place de la barre ; la plante pousse quand même.
- Rien de neuf dans l'export ni dans la base.

### À vérifier sur téléphone (phase 3h, les gestes)

- Sur l'écran d'une habitude : la plante est immobile, puis une seule
  partie bouge d'un pixel pendant une seconde et revient. Dans le Labo :
  pareil, pour essayer chaque espèce, chaque graine et chaque âge.
- **Sur l'étagère** : chaque plante fait le même geste, à son rythme, et
  son reflet bouge au même instant (visible pour la tablette du bas). Le
  glissement d'un mur à l'autre reste fluide pendant qu'une plante bouge.
  Après le geste, rien ne reste décalé, ni sur le mur ni dans le reflet.
- Le geste de chaque espèce (tableau de l'ADR 0016) et son rythme : toutes
  les 4 secondes pour les plus souples, 12 pour les plus raides.
- Le cactus ne bouge pas ; une fois fleuri, une fleur se referme un peu.
- Une plante séchée et un pot vide ne bougent pas.
- Avec « Réduire les animations » : aucun geste.
- Rien d'autre ne saute sur l'écran quand la plante bouge (compteur,
  goutte d'arrosage).

### À vérifier sur téléphone (phase 3g)

- **Le reflet** : un vrai miroir du mur, à taille réelle, immobile (plus
  d'ondulation) ; il s'estompe vers le bas.
- Le glissement d'un mur à l'autre reste fluide.
- Le tapis reste net, par-dessus le reflet.
- Si le plancher apparaît sans aucun reflet : le dire, le reflet est une
  image Skia (`mirrorImage`).
- **Les tableaux** : la mer au crépuscule et l'estampe du bonsaï sur les
  murs de tablettes, les montagnes à l'aube sur le mur de décor.
- **La plante séchée** : Réseaux et Râler dans la démo du Labo ; sur
  l'étagère, sur l'écran de l'habitude et dans le reflet. Couleurs de
  paille, feuillage clairsemé, quelques feuilles sur la tablette, le pot
  intact.

### Hors périmètre pour l'instant

Voir [idees.md](idees.md) : musique, vitalité, compte et synchronisation,
marques après 120 jours, meubles et décors, garder la plante de méditation.

### À vérifier sur téléphone (phase 3f)

- **La migration n° 5 sur ta vraie base** : tes habitudes restent
  vivantes, avec le même compteur ; leurs plantes sont celles de la vie en
  cours (plus jeunes, nouvelle graine) ; les vies passées sont dans
  l'herbier.
- Une rechute : « Ça arrive. » et le nouveau texte ; puis « Elle n'a pas
  tenu cette fois. Tu peux replanter. » et la proposition d'écrire.
- La plante morte : sur l'étagère, ses jours en gris ; sur son écran, ses
  jours tenus, le message et « Replanter » (ni arrosage, ni rechute).
- « Replanter » : un pot vide, compteur à 0, « Une nouvelle plante est en
  terre. » ; le lendemain, 1 jour et une pousse.
- Annuler la rechute dans le journal : la plante revient, avec son âge.
- Le menu : Journal, Renommer, Retirer ; renommer.
- Retirer : « Elle rejoint l'herbier ».
- Réglages : les lignes « bientôt » ; le rappel (permission, puis une
  notification à 20 h ; le désactiver) ; l'herbier ; l'export (feuille de
  partage, fichier lisible) ; « À propos ».
- La démo du Labo : deux plantes mortes (Réseaux, Râler), un herbier
  rempli.

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
- Le mur 2 : tablettes vides dessinées, tableau de la mer au crépuscule en
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
- **`expo-haptics` et `expo-keep-awake`** sont inclus dans Expo Go (vérifié
  dans la doc SDK 57).
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
- Le rendu séché d'une plante morte est fait (ADR 0015).
