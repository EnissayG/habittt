# habittt

Application mobile pour arrêter des habitudes. Chaque habitude est une plante
en pixel art qui pousse avec les jours tenus et garde la trace des rechutes.

> Projet en cours de mise en place : aucune fonctionnalité pour l'instant.

## Démarrer

Prérequis : Node 22 LTS ou plus récent, et l'application Expo Go à jour sur
le téléphone.

```bash
npm install
npm start      # puis scanner le QR code avec Expo Go
```

Vérifications : `npm test`, `npm run lint`, `npm run typecheck`.

Guide détaillé, avec les problèmes courants :
[tester avec Expo Go](docs/tester-avec-expo-go.md).

## Documentation

- [Architecture](docs/architecture.md) : couches, règle de dépendance, modèle
  de données, plante en fonction pure. **À lire en premier.**
- [Décisions d'architecture](docs/decisions/) : le pourquoi de chaque choix
  ([0001 : stack et architecture](docs/decisions/0001-stack-et-architecture.md),
  [0002 : rechutes et croissance](docs/decisions/0002-rechutes-et-croissance.md),
  [0003 : générateur de plantes](docs/decisions/0003-generateur-de-plantes.md),
  [0004 : rendu des plantes](docs/decisions/0004-rendu-des-plantes.md),
  [0005 : générateur v2](docs/decisions/0005-generateur-v2.md),
  [0006 : écrans et étagère](docs/decisions/0006-ecrans-et-etagere.md)).
- [Idées pour plus tard](docs/idees.md).
- [Tester avec Expo Go](docs/tester-avec-expo-go.md) : lancer l'app sur son
  téléphone, dépannage.
- [CLAUDE.md](CLAUDE.md) : résumé pour les assistants de code.
