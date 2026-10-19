# 0027. Le chat de la référence, image par image

- **Statut :** accepté
- **Date :** 2026-10-19
- **Remplace :** [0026](0026-le-chat-anime.md) (le dessin et les gestes du chat)

## Contexte

Les chats dessinés par le code (0025, puis 0026 : de profil, puis
« chibi ») ne ressemblaient pas assez à ce que Yassine voulait. Il a fourni
la référence : un GIF de chat en pixel art, une image gratuite, avec ses
animations (debout, bond sur place, s'asseoir, se coucher, s'endormir).

## Décisions

- **Le dessin est repris tel quel, cellule par cellule** : les 20 images
  différentes du GIF (512 × 512, une cellule = 8 pixels), recadrées sur
  20 × 22 cellules, sont écrites en lettres dans `scene/catSprites.ts`
  (a contour, b pelage, c pelage clair, d rayure, e pelage ombré, f nez,
  E œil). Les yeux sont repérés pour que le chat noir ait des yeux verts.
- **Le roux garde exactement les couleurs du GIF.** Les autres pelages
  repeignent le même dessin : noir (yeux verts), gris tigré, calico (blanc,
  taches orange et noires sur la tête et le dos, queue orange), siamois
  (crème ; oreilles, masque, pattes et queue foncés).
- **Les poses** (`CAT_FRAMES`) : debout (0, 1 : il respire, la queue
  bouge), bond (2 à 5), s'asseoir (6), assis (7 à 10 : la queue balaie le
  sol), se coucher (11), couché (12 à 15 : la queue remue), s'assoupir (16),
  dormir (17 à 19). Une image dure 0,17 s, comme dans le GIF.
- **Les enchaînements du GIF sont respectés** : il s'assoit en passant par
  l'image 6, se couche par la 11, s'endort par la 16, se réveille par la 16,
  se relève par la 10 puis la 6. Sa journée : il dort, se réveille couché,
  s'assoit, se lève, part en bonds (souvent vers un autre mur), reste debout
  un instant, s'assoit, se couche parfois et se rendort, ou repart.
- **Il se déplace par bonds** faits des images du bond sur place : debout,
  ramassé, il pousse (les pattes arrière encore au sol), en l'air, il
  redescend, il se pose ; 6 cellules par bond, 0,84 s. Il n'avance qu'en
  l'air : ses pattes ne glissent jamais.
- **Le sol** : la rangée 17 (le contour sous les pattes) est posée sur la
  ligne du plancher. Sous elle, la queue d'un chat assis ou couché s'étend
  sur le plancher, vers nous. L'ombre du GIF est remplacée par le reflet du
  plancher (le style de la pièce) : seul ce qui est au-dessus des pattes se
  reflète, et en l'air le reflet s'éloigne de lui-même.
- Plus de toilette, d'étirement ni de « z » : le GIF ne les a pas.

## Conséquences

- `drawCat(pelage, image, sens)` ; `catAt` donne l'image à dessiner.
- **Licence à vérifier avant la publication** : retrouver la page de
  l'image, lire ses conditions (usage commercial, mention de l'auteur) et
  créditer l'auteur dans l'app si c'est demandé.
