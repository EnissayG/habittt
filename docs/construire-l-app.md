# Construire l'app (icône, lancement, installation)

## L'identité

- **Nom** : habittt, comme sur l'écran d'ouverture.
- **Icône** : le bonsaï de l'écran d'ouverture (`bonsai`, graine 12, adulte),
  pixel pour pixel, sur le crème de l'app (`#FDF6E3`). Sans la planche,
  pour qu'il soit grand dans l'icône.
- **Android** : icône adaptative (le bonsaï dans la zone sûre, fond crème),
  icône monochrome (thème des icônes d'Android 13+), petite icône blanche
  des rappels (`notification-icon.png`).
- **Lancement** : le bonsaï sur sa planche, sur le crème, puis l'écran
  d'ouverture prend le relais (même fond, même bonsaï, le titre dessous).
  Expo Go montre l'icône à la place : le lancement ne se voit que dans une
  vraie build.
- **Identifiant** : `com.graitaastudio.habittt` (Android et iOS). Il ne
  pourra plus changer une fois l'app publiée sur un store.
- Les images sont faites à partir du dessin du bonsaï (`renderPlant`) ; si
  le bonsaï change, il faut les refaire.

## Construire une version à installer (Android)

Une fois :

```powershell
npx expo install expo-splash-screen
npm install -g eas-cli
eas login
eas init
```

Puis, à chaque version à essayer :

```powershell
eas build -p android --profile preview
```

EAS construit l'app dans le nuage (une dizaine de minutes) et donne un lien
vers un fichier `.apk` : l'ouvrir sur le téléphone Android et l'installer
(autoriser l'installation depuis cette source). L'app s'installe à côté
d'Expo Go, avec sa propre icône, et garde ses données entre deux versions.

## iPhone

Installer l'app sur un iPhone hors d'Expo Go demande un compte Apple
Developer (99 $ US par an). En attendant, Expo Go suffit pour l'essayer.

## Pour les stores (plus tard)

- `eas build -p android --profile production` donne le fichier pour Google
  Play ; un compte développeur personnel récent doit d'abord faire un test
  fermé (12 testeurs pendant 14 jours).
- `eas build -p ios --profile production` puis `eas submit` pour l'App
  Store.
- Avant : vérifier la licence de l'image du chat (ADR 0027).
