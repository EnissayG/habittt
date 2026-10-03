# 0002. Rechutes et croissance de la plante

- **Statut :** accepté
- **Date :** 2026-10-03
- **Complète :** [0001](0001-stack-et-architecture.md)

## Contexte

L'ADR 0001 pose deux principes qui entrent en tension :

- la plante pousse **par ajout seulement** : chaque jour a une position stable,
  et ce qui a poussé ne bouge plus ;
- l'utilisateur doit pouvoir corriger son historique : déclarer une rechute
  oubliée, ou annuler une rechute saisie par erreur.

Si l'apparence d'un jour dépendait de tout ce qui s'est passé avant lui, une
correction rétroactive modifierait tous les jours suivants, ce qui contredit le
premier principe. Il fallait aussi préparer la synchronisation entre appareils,
prévue plus tard avec Supabase.

## Décision

### Habitude

- `startDate` ne peut pas être dans le futur, mais peut être dans le passé :
  on peut déclarer un arrêt commencé il y a plusieurs semaines.

### Rechutes

- Modèle : `Relapse { id, habitId, date, deletedAt }`.
- Saisie possible pour tout jour entre `startDate` et aujourd'hui inclus,
  jamais dans le futur.
- **Une seule rechute par jour et par habitude** : unicité sur
  `(habitId, date)`. Saisir une rechute un jour qui en a déjà une active ne
  fait rien.
- **Annulation par suppression logique** : `deletedAt` est renseigné, la ligne
  n'est jamais effacée.
- Les règles qui dépendent de la date du jour la reçoivent en paramètre
  (`today`), comme le générateur de plante.

### Générateur de plante

- La **géométrie** dépend seulement de `seed` et de l'index du jour :
  `position(n) = g(seed, n)`.
- L'**apparence** de la case `n` dépend seulement de `seed`, de `n` et de la
  présence d'une rechute active ce jour-là :
  `apparence(n) = h(seed, n, rechuteLeJour(n))`.

## Alternatives considérées

- **Interdire la saisie rétroactive** : préserve la croissance par ajout sans
  effort, mais un utilisateur qui oublie de saisir une rechute ne peut plus
  avoir un historique honnête. Rejeté.
- **Limiter la saisie à hier** : même problème, simplement repoussé d'un jour.
  Rejeté.
- **Apparence dépendant des jours précédents** (par exemple des feuilles plus
  jeunes juste après une rechute) : plus expressif, mais une correction
  rétroactive redessinerait tous les jours suivants. Rejeté ; un tel effet
  pourra être ajouté plus tard comme couche d'affichage séparée, sans toucher
  aux positions.
- **Suppression physique des rechutes** : plus simple localement, mais un
  appareil ne peut pas distinguer « supprimé ailleurs » de « jamais existé »
  lors de la synchronisation. Rejeté.
- **Plusieurs rechutes par jour** : n'apporte rien au compteur de série et
  complique l'affichage d'une case. Rejeté.

## Conséquences

- Saisir ou annuler une rechute pour le jour `n` ne modifie que la case `n`.
  Rien d'autre ne bouge dans la plante.
- Trois propriétés deviennent des tests clés du générateur : la plante
  d'aujourd'hui est un préfixe de celle de demain ; une rechute au jour `n` ne
  change que la case `n` ; les positions sont identiques avec ou sans rechutes.
- Les notes datées, prévues plus tard, pourront s'accrocher à `position(n)`.
- Toutes les lectures métier doivent ignorer les rechutes annulées.
- Reste à valider : l'articulation entre unicité et suppression logique
  (réactivation d'une rechute annulée, identifiant déterministe pour la
  synchronisation). Voir [architecture.md](../architecture.md).
