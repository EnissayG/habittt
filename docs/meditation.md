# Le coin méditation : respirer avec le soleil

Spécification de la fonctionnalité (ADR 0017 à 0020).

## L'idée

Le coussin du dernier mur est une place où s'asseoir. On le touche, on
choisit une durée, et on respire avec un soleil dont l'air s'étend et
revient au rythme du souffle, à côté d'un bonsaï adulte, déjà là. Un bâton
d'encens se consume pendant la séance : c'est lui qui montre le temps qui
passe. À la fin, un petit « Bravo ».

## Ce qui la rend simple à utiliser

- **Rien à apprendre** : pas de posture, pas de vocabulaire, pas de
  technique. On respire avec le soleil.
- **Elle marche les yeux fermés** : la main sent le souffle, comme les
  poumons. Pendant l'inspiration, de petits coups rapides et réguliers, de
  plus en plus forts : l'air entre vite. Une courte pause en haut. Pendant
  l'expiration, les coups partent aussi vite puis ralentissent et
  s'adoucissent : l'air finit de sortir. On peut poser le téléphone dans
  sa main ou sur sa cuisse et ne plus regarder l'écran.
- **Trois durées**, de la pause de cinq minutes à la demi-heure.
- **Rien à réussir** : aucune série, aucun compteur de séances, aucun
  rappel. Une séance interrompue n'est pas un échec, aucun message ne le
  relève.

## Pas de mots

Aucune phrase, aucun conseil. Le seul texte de la séance est « inspire »
ou « expire ». Le reste se voit (le soleil, l'encens) ou se sent (la
vibration). Seule la fin dit quelque chose : « Bravo ».

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
   - Dessous, **le bonsaï**, adulte, celui de l'écran d'ouverture. Il fait
     de temps en temps son petit geste (ADR 0016).
   - À côté, **un bâton d'encens** qui se consume : neuf au début, brûlé
     jusqu'au porte-encens à la fin.
   - **Le souffle** dure dix secondes : quatre pour inspirer, six pour
     expirer. Le mot « inspire » ou « expire », écrit en gros, apparaît au
     début de chaque moitié du souffle et s'efface à sa fin.
   - Avec « Réduire les animations », le soleil reste à mi-souffle, la
     fumée ne bouge pas et le mot ne s'efface pas.
   - En bas, discret : le temps restant en minutes (« encore 4 min ») et
     « Terminer ». Toucher l'écran masque ou montre ces deux éléments.
   - L'écran reste allumé pendant la séance.
4. **La fin** : le soleil s'ouvre en entier, de petites étoiles de lumière
   s'allument une à une autour de lui et du bonsaï, l'encens est consumé,
   puis « Bravo » apparaît, avec « 10 minutes pour toi » dessous. Un bouton
   « Revenir à la pièce ». Une vibration un peu plus longue marque la fin,
   pour qui avait les yeux fermés.
5. **Quitter avant la fin** (« Terminer » ou retour) : on revient à la
   pièce, sans confirmation ni message.
6. **L'app passe en arrière-plan** : la séance se met en pause et reprend
   où elle en était.

Rien n'est enregistré : pas de table, pas de migration, rien dans
l'export.

## Pour le code

- **Domaine** (`meditation.ts`), pur et testé : les trois séances ; le
  bonsaï (`MEDITATION_BONSAI`) ; le souffle à un instant donné
  (`breathAt`, `breathFullness`) ; le mot et son opacité (`breathWord`) ;
  la part de séance écoulée (`sessionShare`) ; les coups de vibration
  (`BREATH_PULSES`, `pulsesBetween`) ; le temps restant arrondi à la minute
  supérieure. Le temps est injecté. Les dessins : `drawSun`,
  `drawSparkles` et `drawIncenseTimer` (`scene/`).
- **L'entrée** : le plan de la pièce nomme chaque pièce de décor
  (`PlacedContent` de type `decor`, champ `piece`) ; `MEDITATION_PIECES`
  dit lesquelles ouvrent la séance.
- **UI** : l'horloge de la séance bat 20 fois par seconde
  (`useSessionClock`), ce qui laisse passer les coups rapides de
  l'inspiration (toutes les 0,13 s).
- **Modules** : `expo-keep-awake` et `expo-haptics`.
- **Le réglage de la vibration** : activé à chaque séance (l'app n'a pas
  encore d'endroit où ranger ses réglages).
