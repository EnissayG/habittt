# Le coin méditation : une plante le temps d'une séance

Spécification de la fonctionnalité et textes des séances. À acter dans un
ADR au moment de l'écrire. Les textes de ce fichier sont la référence : le
code les reprend tels quels.

## L'idée

Le fauteuil du mur de décor est une place où s'asseoir. On le touche, on
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

## Principes d'écriture

On tutoie. Phrases courtes, calmes, jamais d'ordre sec ni de promesse
(« tu iras mieux »), jamais de vocabulaire médical. Entre deux phrases, il
n'y a rien à lire.

## Le parcours

1. **Entrer** : le dernier mur de la pièce est le coin méditation (le
   fauteuil, une table basse avec une statue assise, une bougie et de
   l'encens, un rouleau avec un cercle tracé d'un seul geste, une lanterne
   de papier). Un bouton « Méditer » est posé sur le mur au-dessus du
   fauteuil ; toucher le fauteuil, la table ou le rouleau ouvre aussi la
   séance.
2. **Choisir** (écran 12) : « Combien de temps ? » et trois boutons :
   5 minutes, 10 minutes, 30 minutes. Dessous : « Une plante va pousser
   pendant que tu respires. Tu peux arrêter quand tu veux. » Et un
   interrupteur : « Vibrer au rythme du souffle », activé par défaut.
3. **La séance** :
   - Au centre, **le pot**, grand, d'abord vide. La plante est dessinée par
     le générateur de l'app, comme toutes les autres.
   - **Le souffle** dure dix secondes : quatre pour inspirer, six pour
     expirer. **Une lumière** en pixels, derrière la plante, grandit
     pendant l'inspiration et se retire pendant l'expiration ; elle part et
     s'arrête en douceur, comme un souffle. Le mot « inspire » ou
     « expire » est écrit dessous. Avec « Réduire les animations », la
     lumière garde une taille fixe et seuls les mots changent.
   - **La plante pousse à la fin de chaque expiration.** Elle va du pot
     vide à la plante adulte (120 jours) sur toute la séance, quelle que
     soit sa durée : quatre jours par souffle en 5 minutes, deux en 10
     minutes, deux jours tous les trois souffles en 30 minutes. Dans la
     séance longue, certains souffles ne montrent donc rien : c'est voulu,
     et une phrase le dit.
   - Dessous, **la phrase du moment**. Elle reste affichée 14
     secondes, puis s'efface.
   - En bas, discret : le temps restant en minutes (« encore 4 min ») et
     « Terminer ». Toucher l'écran masque ou montre ces deux éléments.
   - L'écran reste allumé pendant la séance.
4. **La fin** : la plante est adulte. « Elle a poussé pendant que tu
   respirais. », puis son nom sur une ligne (« Une fougère de Boston. »),
   avec les libellés existants de l'app, et un bouton « Revenir à la
   pièce ». Une vibration un peu plus longue marque la fin, pour qui avait
   les yeux fermés.
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
  fauteuil jusqu'au lendemain.

## Les textes

Chaque phrase a son moment, en minutes et secondes depuis le début.

### 5 minutes

| Moment | Phrase                                                             |
| ------ | ------------------------------------------------------------------ |
| 0:00   | Installe-toi. Il n'y a rien à réussir ici.                         |
| 0:25   | Inspire quand la lumière grandit. Expire quand elle se retire.     |
| 0:55   | Regarde le pot. Quelque chose y pousse, sans que tu fasses rien.   |
| 1:30   | Pose tes pieds. Relâche tes épaules.                               |
| 2:05   | Si une pensée passe, laisse-la passer. Reviens au souffle.         |
| 2:40   | Tu ne sais pas encore quelle plante c'est. Ce n'est pas grave.     |
| 3:15   | Une envie, c'est comme une vague. Elle monte, puis elle redescend. |
| 3:50   | Tu peux fermer les yeux. Elle pousse quand même.                   |
| 4:20   | Encore quelques souffles, à ton rythme.                            |
| 4:42   | Reviens doucement. Regarde ce qui a poussé.                        |

### 10 minutes

| Moment | Phrase                                                                 |
| ------ | ---------------------------------------------------------------------- |
| 0:00   | Installe-toi. Il n'y a rien à réussir ici.                             |
| 0:25   | Inspire quand la lumière grandit. Expire quand elle se retire.         |
| 0:55   | Regarde le pot. Quelque chose y pousse, sans que tu fasses rien.       |
| 1:35   | Pose tes pieds. Relâche tes épaules.                                   |
| 2:15   | Relâche ta mâchoire. Ton front. Tes mains.                             |
| 3:00   | Si une pensée passe, laisse-la passer. Reviens au souffle.             |
| 3:50   | Tu ne sais pas encore quelle plante c'est. Ce n'est pas grave.         |
| 4:40   | Tu peux fermer les yeux. Elle pousse quand même.                       |
| 5:30   | Une envie, c'est comme une vague. Elle monte, puis elle redescend.     |
| 6:20   | Tu peux la regarder passer sans rien faire.                            |
| 7:10   | Reviens au souffle, autant de fois qu'il le faut.                      |
| 8:00   | Elle ne pousse pas plus vite si tu la regardes.                        |
| 8:50   | Remarque comment tu te sens, sans chercher à changer quoi que ce soit. |
| 9:22   | Encore quelques souffles, à ton rythme.                                |
| 9:42   | Reviens doucement. Regarde ce qui a poussé.                            |

### 30 minutes

| Moment | Phrase                                                                 |
| ------ | ---------------------------------------------------------------------- |
| 0:00   | Installe-toi. Il n'y a rien à réussir ici.                             |
| 0:30   | Inspire quand la lumière grandit. Expire quand elle se retire.         |
| 1:05   | Regarde le pot. Quelque chose y pousse, sans que tu fasses rien.       |
| 2:00   | Pose tes pieds. Relâche tes épaules.                                   |
| 3:00   | Relâche ta mâchoire. Ton front. Tes mains.                             |
| 4:15   | Parfois, rien ne se voit. Ça pousse quand même.                        |
| 5:30   | Porte ton attention sur tes pieds, puis remonte lentement.             |
| 6:45   | Tes jambes. Ton ventre. Ton dos contre le fauteuil.                    |
| 8:00   | Ta poitrine qui se soulève. Tes épaules. Ta nuque.                     |
| 9:30   | Tu peux fermer les yeux. Elle pousse quand même.                       |
| 11:30  | Si une pensée passe, laisse-la passer. Reviens au souffle.             |
| 13:30  | Écoute les bruits de la pièce, sans les suivre.                        |
| 15:00  | Tu es à la moitié. Rien ne presse.                                     |
| 16:30  | Une envie, c'est comme une vague. Elle monte, puis elle redescend.     |
| 18:00  | Tu peux la regarder passer sans rien faire.                            |
| 20:00  | Reviens au souffle, autant de fois qu'il le faut.                      |
| 22:00  | Si tu t'es perdu dans tes pensées, ce n'est rien. Reviens.             |
| 24:00  | Elle ne pousse pas plus vite si tu la regardes.                        |
| 26:00  | Remarque comment tu te sens, sans chercher à changer quoi que ce soit. |
| 27:45  | Pense à une chose, même petite, qui t'a fait du bien aujourd'hui.      |
| 29:00  | Encore quelques souffles, à ton rythme.                                |
| 29:38  | Reviens doucement. Regarde ce qui a poussé.                            |

### La fin, pour les trois

« Elle a poussé pendant que tu respirais. » Puis le nom de la plante.

## Pour le code

- **Domaine**, pur et testé : les trois séances (durée, phrases et leurs
  moments) ; le souffle (inspiration ou expiration, et sa progression, à un
  instant donné) ; le nombre de jours de la plante après n souffles (0 au
  début, 120 à la fin, jamais en baisse, pour les trois durées) ; la phrase
  à afficher à un instant donné ; le temps restant arrondi à la minute
  supérieure. Le temps et la graine sont injectés.
  Tests à prévoir : chaque phrase tient en entier avant la suivante et
  avant la fin ; les moments sont croissants ; aucune phrase ne dépasse
  deux lignes (limite en caractères) ; la plante est adulte exactement au
  dernier souffle.
- **La plante** : `renderPlant` existe déjà ; les plans sont en cache par
  espèce et graine, donc redessiner à chaque souffle est peu coûteux.
- **L'entrée** : aujourd'hui le décor n'est jamais touché
  (`PlacedContent` de type `decor`). Il faut pouvoir reconnaître le
  fauteuil dans le plan de la pièce pour poser une zone tactile dessus.
- **Modules** : `expo-keep-awake` et `expo-haptics`, à installer avec
  `npx expo install` après avoir vérifié qu'ils sont dans Expo Go.
- **Le réglage de la vibration** : le garder d'une séance à l'autre s'il
  existe déjà un endroit où l'app range ses réglages (le rappel du soir) ;
  sinon, activé à chaque fois.
