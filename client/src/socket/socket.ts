import { io, Socket } from 'socket.io-client';

// En prod, le client est servi par le même service que le serveur (voir server/src/index.ts) :
// pas d'URL = connexion à la même origine. En dev local, VITE_SERVER_URL (voir .env.development)
// pointe vers le serveur Express/Socket.IO qui tourne sur un port séparé.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || undefined;

export const socket: Socket = io(SERVER_URL, { autoConnect: true });
