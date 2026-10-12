# Le coin méditation : une plante le temps d'une séance

Spécification de la fonctionnalité (ADR 0017, 0018, 0019).

## L'idée

Le coussin du dernier mur est une place où s'asseoir. On le touche, on
choisit une durée, et on a devant soi un pot vide. **À chaque respiration,
une plante y pousse un peu.** À la fin de la séance, elle est adulte : elle
a poussé pendant qu'on respirait, sans qu'on fasse rien d'autre.

C'est l'idée de toute l'app, en quelques minutes au lieu de cent vingt
jours : ce qui pousse, pousse lentement, et on n'a pas à le forcer.

On ne sait pas d'avance quelle plante ce sera. On la reconnaît peu à peu,
et son nom n'est donné qu'à la fin.

## Ce qui la rend simple à utiliser

- **Rien à apprendre** : pas de posture, pas de vocabulaire, pas de
  technique. On respire et on regarde pousser.
- **Elle marche les yeux fermés** : la main sent le souffle. De petites
  vibrations se rapprochent et se renforcent pendant l'inspiration,
  s'arrêtent un instant en haut du souffle, puis s'espacent et s'effacent
  pendant l'expiration. On peut poser le téléphone dans sa main ou sur sa
  cuisse et ne plus regarder l'écran ; la plante pousse quand même.
- **Trois durées**, de la pause de cinq minutes à la demi-heure.
- **Rien à réussir** : aucune série, aucun compteur de séances, aucun
  rappel. Une séance interrompue n'est pas un échec, aucun message ne le
  relève.

## Pas de mots

Aucune phrase, aucun conseil. Le seul texte de la séance est « inspire »
ou « expire ». Le reste se voit (le soleil, la plante, l'encens) ou se
sent (la vibration).

## Le parcours

1. **Entrer** : le dernier mur de la pièce est le coin méditation (un
   coussin sur une natte, une table basse avec une bougie, une statue
   assise, des galets et de l'encens qui fume, un vase d'herbes sèches ;
   au mur une étagère, un tableau, un rouleau à l'ensō, une lanterne de
   papier). Un bouton « Méditer » est posé sur le mur au-dessus du
   coussin ; toucher le coussin, la table ou le rouleau ouvre aussi la
   séance.
2. **Choisir** (écran 12) : « Combien de temps ? » et trois boutons :
   5 minutes, 10 minutes, 30 minutes. Et un interrupteur : « Vibrer au
   rythme du souffle », activé par défaut.
3. **La séance** :
   - En haut, **le soleil** : un cœur qui ne change pas de taille, et de
     l'air autour qui s'étend pendant l'inspiration et revient pendant
     l'expiration, en vagues qui ondulent.
   - Dessous, **le pot**, grand, d'abord vide. La plante est dessinée par
     le générateur de l'app, comme toutes les autres.
   - À côté du pot, **un bâton d'encens** qui se consume : neuf au début,
     brûlé jusqu'au porte-encens à la fin. C'est lui qui montre le temps
     qui passe.
   - **Le souffle** dure dix secondes : quatre pour inspirer, six pour
     expirer. Le mot « inspire » ou « expire », écrit en gros, apparaît au
     début de chaque moitié du souffle et s'efface à sa fin.
   - Avec « Réduire les animations », le soleil reste à mi-souffle, la
     fumée ne bouge pas et le mot ne s'efface pas.
   - **La plante pousse à la fin de chaque expiration.** Elle va du pot
     vide à la plante adulte (120 jours) sur toute la séance, quelle que
     soit sa durée : quatre jours par souffle en 5 minutes, deux en 10
     minutes, deux jours tous les trois souffles en 30 minutes.
   - En bas, discret : le temps restant en minutes (« encore 4 min ») et
     « Terminer ». Toucher l'écran masque ou montre ces deux éléments.
   - L'écran reste allumé pendant la séance.
4. **La fin** : la plante est adulte, avec son nom (« Une fougère de
   Boston. ») et un bouton « Revenir à la pièce ». Une vibration un peu
   plus longue marque la fin, pour qui avait les yeux fermés.
5. **Quitter avant la fin** (« Terminer » ou retour) : on revient à la
   pièce, sans confirmation ni message. La plante s'arrête là où elle en
   était.
6. **L'app passe en arrière-plan** : la séance se met en pause et reprend
   où elle en était.

## La plante de la séance

- Son espèce et sa graine sont tirées au début de la séance, parmi les
  treize espèces, avec le générateur de graines injecté (jamais
  `Math.random()` dans le domaine).
- Elle ne meurt jamais, ne fait pas de geste (ADR 0016) pendant qu'elle
  pousse, et n'a pas de jours arrosés.
- **Elle n'est pas gardée.** Rien n'est enregistré dans cette première
  version : pas de table, pas de migration, rien dans l'export. Idée pour
  plus tard, à noter dans `idees.md` : garder la dernière plante à côté du
  coussin jusqu'au lendemain.

## Pour le code

- **Domaine** (`meditation.ts`), pur et testé : les trois séances ; le
  souffle à un instant donné (`breathAt`, `breathFullness`) ; le mot et son
  opacité (`breathWord`) ; la part de séance écoulée (`sessionShare`) ; les
  jours de la plante (`plantDaysAt` : 0 au début, 120 au dernier souffle,
  jamais en baisse) ; les coups de vibration (`pulsesBetween`) ; le temps
  restant arrondi à la minute supérieure. Le temps et la graine sont
  injectés. Les dessins : `drawSun` et `drawIncenseTimer` (`scene/`).
- **La plante** : `renderPlant` existe déjà ; les plans sont en cache par
  espèce et graine, donc redessiner à chaque souffle est peu coûteux.
- **L'entrée** : le plan de la pièce nomme chaque pièce de décor
  (`PlacedContent` de type `decor`, champ `piece`) ; `MEDITATION_PIECES`
  dit lesquelles ouvrent la séance.
- **Modules** : `expo-keep-awake` et `expo-haptics`, à installer avec
  `npx expo install` après avoir vérifié qu'ils sont dans Expo Go.
- **Le réglage de la vibration** : le garder d'une séance à l'autre s'il
  existe déjà un endroit où l'app range ses réglages (le rappel du soir) ;
  sinon, activé à chaque fois.
