import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { RoomManager } from './rooms/RoomManager.js';
import { registerSocketHandlers } from './socket/registerHandlers.js';
import { logger } from './util/logger.js';

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// En build de prod, server/dist/index.js et client/dist/ sont tous les deux à la racine
// du dépôt déployé : un seul service Web sert donc l'API/Socket.IO ET les fichiers statiques
// du client, pas besoin de CORS ni d'une seconde origine en production.
const clientDistPath = path.join(__dirname, '../../client/dist');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN },
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(express.static(clientDistPath));
// Route de repli : toute page non-API renvoie l'app React (pas de routeur côté client
// aujourd'hui, mais ça évite un 404 si quelqu'un rafraîchit ou ouvre un lien direct).
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const roomManager = new RoomManager(io);
registerSocketHandlers(io, roomManager);

httpServer.listen(PORT, () => {
  logger.info(`Serveur The Gang à l'écoute sur le port ${PORT}`);
});
