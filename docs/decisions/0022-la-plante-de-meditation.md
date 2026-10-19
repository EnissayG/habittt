# 0022. La plante de méditation, l'objectif doux et les réglages gardés

- **Statut :** accepté
- **Date :** 2026-10-19
- **Modifie :** [0017](0017-le-coin-meditation.md) (« rien n'est
  enregistré ») et [0021](0021-toute-l-app-dans-le-noir.md) (la lumière
  n'était pas gardée)

## Contexte

On veut suivre ses méditations : un calendrier, un objectif, un rappel, et
quelque chose qui avance. Mais une série qui casse culpabilise : l'inverse
de ce que l'app veut faire partout ailleurs.

## Décisions

- **Un jour médité** (`MeditationDay`, `meditationLog.ts`) : une ligne par
  jour, avec ses minutes et son nombre de séances ; identifiant tiré de la
  date (UUID v5), comme les arrosages. Une séance compte dès une minute
  entière, qu'elle soit finie ou quittée avant (« Terminer », retour) ;
  ses minutes s'ajoutent à celles du jour.
- **La plante de méditation** : toujours le même jade
  (`MEDITATION_PLANT`), qui pousse d'un jour pour chaque jour médité
  (jusqu'à 120) et **ne meurt jamais** : un jour sans méditation ne change
  rien, elle attend.
- **Un objectif doux** : un nombre de jours par semaine, de 1 à 7, 5 par
  défaut. La semaine commence le lundi ; « 3 jours sur 5 », puis
  « objectif atteint ». Rien ne dit qu'il est manqué.
- **Les jours d'affilée** (`run`) : comptés jusqu'à aujourd'hui, ou
  jusqu'à hier tant qu'aujourd'hui reste ouvert, et **montrés seulement à
  partir de 2**. Une série interrompue disparaît, sans message.
- **Le calendrier** (`meditationMonth`, `MeditationCalendar`) : un carré
  vert par jour médité, aujourd'hui encadré, les autres jours simplement
  neutres ; on remonte jusqu'au premier mois médité.
- **Le rappel** : une notification locale par jour, désactivée par
  défaut, à 7 h 30, 12 h 30, 18 h ou 21 h 30 ; « Le soleil est là, si tu
  as envie de respirer un peu. » L'heure voyage dans les données de la
  notification (comme le rappel du soir, l'état est la planification).
- **Les réglages gardés** (`settings.ts`, table `settings`, clé et valeur
  texte) : l'objectif, la vibration au rythme du souffle et la lumière
  éteinte sont gardés d'une ouverture à l'autre. Une valeur illisible ou
  une clé inconnue reprend sa valeur par défaut.
- **Écran 12, avant la séance** : la plante et ses jours, les durées, la
  vibration, la semaine et l'objectif, le calendrier, le rappel.
- **Base de données** : migration 6 (`meditation_days`, `settings`).
  **Export** : format 2, avec `meditation: { goal, days }`.

## Conséquences

- La séance elle-même ne change pas (soleil, bonsaï, encens, aucune
  phrase).
- La plante de méditation n'est pas encore dans la pièce : idée pour plus
  tard, la poser près du coussin.
- Le rappel sonne même un jour déjà médité : une notification locale ne
  peut pas savoir si on a médité. Le texte reste une invitation.
