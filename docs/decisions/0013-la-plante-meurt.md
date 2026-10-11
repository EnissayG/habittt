# 0013. La plante meurt quand l'habitude échoue

- **Statut :** accepté
- **Date :** 2026-10-11
- **Remplace :** le principe « la plante ne meurt jamais »
  ([architecture.md](../architecture.md)), et en partie
  [0002](0002-rechutes-et-croissance.md) (une rechute laisse une trace sur
  la plante, qui continue de pousser)
- **Modifie :** [0011](0011-retirer-et-effacer.md) (le jardin devient
  l'herbier)

## Contexte

Jusqu'ici, une rechute jaunissait la feuille de son jour et la plante
continuait de pousser. Changement de concept produit : **la plante meurt
quand l'habitude échoue**. On peut toujours en replanter une nouvelle.

## Décision

### Des vies successives

Une habitude a des **vies** successives. Chaque rechute termine la vie en
cours ; la plante de cette vie est **morte**. L'état « morte » est
**calculé, jamais stocké** : il découle toujours des rechutes et des
replantations (`splitLives`, domaine, pur).

- **Vie 0** : commence à `startDate`, avec la graine de l'habitude
  (`Habit.seed`). Son premier jour compté est `startDate` (convention
  existante : un suivi commencé aujourd'hui affiche 1 jour).
- **Vie k ≥ 1** : commence le jour d'une **replantation** `R`. Son premier
  jour compté est **le lendemain de `R`** : le compteur affiche **0** le
  jour où l'on replante, et la plante n'est qu'un pot fraîchement semé.
- **Fin d'une vie** : pour la vie 0, la première rechute active datée au
  moins de `startDate` ; pour une vie replantée le jour `R`, la première
  rechute active **après `R`**. On rechute puis on replante souvent le
  même jour : la rechute de ce jour appartient à la vie précédente.
  **Limite connue** : une rechute le soir même d'une replantation ne tue
  pas la nouvelle plante, qui n'est encore qu'un pot à 0 jour. Le journal
  garde la rechute.
- **Vie suivante** : elle commence à la première replantation datée au
  moins du jour de la rechute fatale. Une replantation antérieure est
  ignorée.
- **Jours tenus** :
  - vie en cours : de son premier jour à aujourd'hui inclus ;
  - vie morte : de son premier jour à la veille de la rechute (au moins 0).
- **Plante d'une vie** : `renderPlant` avec la graine de la vie, le nombre
  de jours tenus comme âge, les arrosages de la vie, aucun jour de rechute.
  La croissance par ajout et toutes les propriétés du générateur restent
  vraies **à l'intérieur d'une vie**.

### Ce qui découle du calcul

- **Supprimer une rechute entrée par erreur ranime la plante** : la vie
  qu'elle terminait continue. Une replantation faite entre-temps devient
  sans objet et est ignorée ; la plante retrouve sa graine et son âge.
- **Ajouter une rechute oubliée** termine la vie qui la contient.
- **Le record** de l'habitude est le plus grand nombre de jours tenus d'une
  vie. Le compteur courant est celui de la vie en cours, 0 si elle est
  morte. Le total de l'étagère est la somme des compteurs courants.

### Replanter

- Action « **Replanter** », possible seulement quand la plante est morte et
  l'habitude sur l'étagère, aujourd'hui seulement, une fois par jour.
- **Nouvelle graine, déterministe** : `replantSeed(habitId, date)`, un
  hachage FNV-1a 32 bits de `habitId/date` mélangé par la finale de
  MurmurHash3. Même habitude, même jour : même plante, sur tous les
  appareils, sans rien stocker d'autre que la date.
- **Stockage** : `Replanting { id, habitId, date, updatedAt }`, identifiant
  UUID v5 déterministe tiré de `(habitId, date)` comme les rechutes (espace
  de noms propre). **Migration SQLite n° 5** : table `replantings`, unicité
  sur `(habit_id, date)`.

### Les données existantes

Avant cette décision, une rechute ne tuait pas : la personne continuait
sans replanter. Pour ne pas faire mourir d'un coup toutes les habitudes
qui ont déjà une rechute, **la migration n° 5 ajoute une replantation le
jour de chaque rechute active existante**. Les compteurs courants restent
identiques (jours depuis la dernière rechute).

**Conséquence visible et assumée** : la plante affichée devient celle de
la vie en cours, avec une nouvelle graine. Une habitude ancienne avec une
rechute récente montre une plante jeune, et ses vies passées vont dans
l'herbier.

### Ce qui ne change pas

- **Les notes restent attachées à l'habitude**, pas à la vie. Le journal
  montre tous les jours, quelle que soit la vie.
- **Arroser** n'est possible que sur une plante vivante.
- **Les rechutes** gardent leurs règles : une par jour, saisie
  rétroactive, annulation logique.

### L'affichage

- **Une plante morte reste sur l'étagère** avec le nombre de jours qu'elle
  a tenus, **sans compteur qui avance**. Le rendu séché sera fourni : le
  domaine passe un champ `dead: boolean` dans l'image de la plante
  (`PlantImage.dead`), que le rendu utilisera.
- **Le ton** : « Elle n'a pas tenu cette fois. Tu peux replanter. » Pas de
  rouge, pas de point d'exclamation, pas de reproche.

### L'herbier remplace le jardin

- L'**herbier** liste les vies passées de chaque habitude : son numéro, sa
  date de début, sa date de fin et son nombre de jours.
- « Elle rejoint le jardin » devient « **Elle rejoint l'herbier** » : la
  dernière vie d'une habitude retirée y figure aussi, terminée le jour du
  retrait. La valeur stockée reste `garden`, pour ne pas migrer à nouveau.
- Une habitude donnée n'y figure pas.
- **Pas de dessin des plantes dans l'herbier** pour l'instant : chaque vie
  a sa graine, et préparer une plante pour une graine nouvelle (`settle()`)
  coûte plusieurs dizaines de millisecondes. Le texte suffit.

### Les principes du produit, réécrits

- **La plante meurt quand l'habitude échoue ; on peut toujours replanter.**
- **Aucun message culpabilisant, aucune notification de reproche.**
- **Une vie passée reste visible**, dans l'herbier et dans le journal.
- **Écrire une note est toujours facultatif.**

## Conséquences

- `plante = f(vie, aujourd'hui)` : la graine et le début viennent de la
  vie, plus seulement de l'habitude.
- Le jaunissement d'un jour de rechute (`relapse` sur les pixels) reste
  dans le générateur, puisque la parité avec le prototype l'exige, mais il
  n'est plus utilisé par l'app.
- La future vitalité (soif, fatigue) reste possible, comme variation de
  couleurs d'une plante vivante.
