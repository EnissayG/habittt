# Tester l'application sur son téléphone avec Expo Go

Expo Go est une application gratuite qui exécute le projet directement sur un téléphone, sans build ni store. L'ordinateur sert le code, le téléphone l'affiche et se recharge à chaque sauvegarde.

## Prérequis

- Node.js (version LTS) installé sur l'ordinateur.
- L'application **Expo Go** installée sur le téléphone (App Store ou Google Play).
- Le téléphone et l'ordinateur sur le **même réseau Wi-Fi**.

## Lancer l'application

1. Dans le dossier du projet, installer les dépendances (une seule fois, ou après un changement de `package.json`) :

   ```bash
   npm install
   ```

2. Démarrer le serveur de développement :

   ```bash
   npx expo start
   ```

3. Un code QR s'affiche dans le terminal. Le scanner :
   - **iPhone** : avec l'application Appareil photo, puis toucher la notification qui ouvre Expo Go.
   - **Android** : avec le bouton « Scan QR code » dans Expo Go.

4. L'application se charge sur le téléphone.

## Pendant le développement

| Action                     | Comment                                              |
| -------------------------- | ---------------------------------------------------- |
| Recharger l'application    | Touche `r` dans le terminal                          |
| Ouvrir le menu développeur | Secouer le téléphone, ou touche `m` dans le terminal |
| Voir les `console.log`     | Ils s'affichent dans le terminal de l'ordinateur     |
| Arrêter le serveur         | `Ctrl + C` dans le terminal                          |

Une sauvegarde de fichier met l'application à jour toute seule (Fast Refresh). Un rechargement complet n'est nécessaire que si l'état semble incohérent.

## Problèmes courants

**Le téléphone ne trouve pas le serveur.**
Souvent causé par un réseau qui isole les appareils entre eux (Wi-Fi d'université, de café, VPN). Utiliser le mode tunnel :

```bash
npx expo start --tunnel
```

C'est plus lent, mais ça fonctionne sur n'importe quel réseau. Sinon, partager la connexion du téléphone avec l'ordinateur.

**« Project is incompatible with this version of Expo Go ».**
Expo Go ne prend en charge que la version récente du SDK Expo. Mettre à jour Expo Go sur le téléphone, ou mettre le projet à niveau :

```bash
npx expo install expo@latest
npx expo install --fix
```

**Comportement étrange après avoir installé une librairie.**
Redémarrer en vidant le cache :

```bash
npx expo start --clear
```

## Limites d'Expo Go

Expo Go contient un ensemble fixe de modules natifs. Si le projet a besoin d'un module qui n'y est pas, il faut passer à un **build de développement** (généré avec EAS Build), qui est une version d'Expo Go propre au projet. Ce passage est prévu au jalon de publication ; tant que tout fonctionne dans Expo Go, on y reste.

Pour installer une librairie, toujours utiliser `npx expo install <nom>` plutôt que `npm install <nom>` : Expo choisit la version compatible avec le SDK du projet.
