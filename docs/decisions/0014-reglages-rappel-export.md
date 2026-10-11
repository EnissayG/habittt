# 0014. Réglages, rappel du soir, export et renommer

- **Statut :** accepté
- **Date :** 2026-10-11
- **Complète :** [0011](0011-retirer-et-effacer.md) et
  [0013](0013-la-plante-meurt.md)

## Contexte

Fin de la phase 3 : l'écran 11 (réglages), l'herbier (écran 10, ADR 0013)
et Renommer. Questions tranchées : « Je la donne » fait disparaître la
plante de l'app ; l'export est un fichier JSON partagé ; le rappel sonne à
20 h.

## Décision

### L'écran Réglages

Dans l'ordre de la maquette :

- **Musique** et **Barre de musique visible** : « bientôt ».
- **Rappel doux le soir** : un interrupteur.
- **L'herbier** : avec le nombre de vies passées.
- **Compte et synchronisation** : « bientôt ».
- **Exporter mes données**.
- **À propos de habittt** : version, licences.

La ligne « La musique : habittt, vol. 1 » de la maquette attend la
musique.

### Le rappel du soir (`ui/settings/reminder.ts`)

- Une **notification locale** quotidienne à 20 h (`expo-notifications`,
  déclencheur quotidien), **désactivée par défaut**, avec le texte « Ta
  plante est là, si tu as envie de passer la voir. ». Sans reproche, et
  sans mention de la mort de la plante.
- **Rien n'est stocké** : l'état de l'interrupteur se lit dans les
  notifications programmées (identifiant fixe). La permission n'est
  demandée qu'au moment d'activer ; si elle est refusée, tout reste
  désactivé et un message dit où l'autoriser.
- Sur Android, un canal « Rappel du soir ». Les notifications locales
  fonctionnent dans Expo Go ; seules les notifications push en sont
  exclues.

### L'export (`buildExport`, domaine ; `ui/settings/shareExport.ts`)

- **Contenu** (format 1, champ `format` à incrémenter si la forme change) :
  chaque habitude non effacée, données comprises, avec son nom, son
  espèce, sa graine, ses dates et son statut. On y trouve aussi les dates
  de ses rechutes actives, de ses replantations et de ses arrosages, ses
  notes actives (date, texte, humeur) et ses vies (début, fin, jours).
- Les rechutes annulées et les notes supprimées sont laissées de côté :
  l'export dit ce que la personne a gardé.
- **Fichier** `habittt-AAAA-MM-JJ.json` dans le cache (`expo-file-system`),
  remis à la feuille de partage native (`expo-sharing`) : Fichiers, mail,
  etc.

### Renommer

`renameHabit` reprend les règles de la création : nettoyage, nom non vide,
50 caractères au plus. Le même nom ne change rien, pas même `updatedAt`.
On renomme une habitude de l'étagère seulement, par son menu.

### Dépendances ajoutées

`expo-notifications`, `expo-file-system`, `expo-sharing` et
`expo-constants` (version de l'app dans « À propos »), installées avec
`npx expo install`, toutes incluses dans Expo Go.
