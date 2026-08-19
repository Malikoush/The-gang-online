# The Gang — en ligne

Adaptation en ligne du jeu de cartes coopératif "The Gang". Chaque joueur reçoit 2 cartes privées, les cartes communes tombent au fil du pré-flop/flop/turn/river, et le groupe doit se classer collectivement de la main la plus faible à la plus forte à l'aide de jetons — sans jamais dire ce qu'on a en main.

Le classement se refait à chaque étape pour échanger des informations (jeton, emotes, chat si activé), mais seul celui de la rivière compte vraiment : si l'ordre choisi ne correspond pas à la vraie force des mains, la manche est ratée.

## Stack

- Serveur : Node.js + Express + Socket.IO, état de partie en mémoire (pas de base de données)
- Client : React + Vite + TypeScript
- Monorepo npm workspaces : `shared/` (types communs), `server/`, `client/`

## Lancer en local

```
npm install
npm run dev
```

Le client tourne sur http://localhost:5173, le serveur sur le port 4000. Ouvrir plusieurs onglets pour simuler plusieurs joueurs (2 à 6).

## Tests

```
npm test
```

Tests unitaires de l'évaluateur de mains de poker (paires, couleurs, quintes, égalités).

## Déploiement

Un seul service à déployer : en production, le serveur sert aussi le client buildé (`npm run build` puis `npm start`). Voir `render.yaml` pour un déploiement sur Render.
