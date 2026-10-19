# 0028. Toucher le chat

- **Statut :** accepté
- **Date :** 2026-10-19
- **Modifie :** [0025](0025-le-chat.md) (le chat ne captait aucun toucher)

## Contexte

Le chat vivait sa vie sans qu'on puisse rien lui faire. Yassine veut qu'il
réagisse quand on le touche.

## Décisions

- **Un toucher bref** : il répond selon ce qu'il fait, avec les images du
  dessin (aucune nouvelle image du chat) :
  - debout, il fait un petit saut sur place ;
  - assis, sa queue balaie le sol ;
  - couché, sa queue remue puis s'enroule ;
  - endormi, il se réveille un instant, regarde, remue la queue, puis se
    rendort ;
  - en plein bond, il continue sa route.
    Un petit cœur monte de sa tête et s'efface.
- **Le doigt gardé dessus (0,35 s)** : on le caresse. Il s'installe (debout,
  il s'assoit puis se couche ; assis, il se couche), ferme les yeux et reste
  là, la queue bougeant un peu, tant que le doigt reste. Un cœur monte
  toutes les 0,8 s. Le téléphone **ronronne** : un tapotement doux toutes
  les 0,12 s. Le doigt levé, il rouvre les yeux et revient à sa pose, par
  les mêmes enchaînements que le dessin.
- **Sa journée attend pendant qu'il réagit** : le temps passé à répondre
  est retiré de son horloge, donc il reprend exactement où il en était,
  sans saut de place ni de pose. Un nouveau toucher remplace le précédent.
- **Pur et testé** (`scene/catTouch.ts`, `catReaction(toucher, depuis)`) :
  l'image à montrer, les cœurs (place, transparence) et la fin. La vue
  (`CatView`) ne fait que tenir l'horloge et les touchers.
- **Seule sa boîte capte le toucher** (le chat au-dessus des pattes, pas
  sa queue posée au sol). Pour le lecteur d'écran : « Le chat », bouton,
  avec un indice. Le glissement entre les murs reste possible en partant
  du chat.
- **« Réduire les animations »** : il ne bouge pas, mais le toucher se sent
  toujours (le petit déclic, le ronronnement).
- Le cœur suit la lumière éteinte, comme le chat.

## Conséquences

- Le chat peut passer devant le coussin de méditation : un toucher sur lui
  va alors au chat, pas au coussin. L'enseigne « Méditer » reste toujours
  libre.
