import { randomUUID } from 'node:crypto';
import type { Socket } from 'socket.io';
import { EVENTS, type ChatRequest, type EmoteRequest, type EmoteKind } from '@thegang/shared';
import type { RoomManager } from '../../rooms/RoomManager.js';
import type { RoomState } from '../../rooms/types.js';
import { RateLimiter } from '../../util/rateLimit.js';

const EMOTE_KINDS: EmoteKind[] = [
  'HESITATE',
  'CONFIDENT',
  'ANNOYED',
  'THUMBS_DOWN',
  'PANIC',
  'OK',
  'NAILS',
  'NO_CROSS',
];
const CHAT_MAX_LENGTH = 240;
const CHAT_LOG_CAP = 100;

const emoteLimiter = new RateLimiter(800);
const chatLimiter = new RateLimiter(400);

/**
 * Le chat du salon / entre les manches reste toujours ouvert (aucun enjeu de triche).
 * Pendant le vote (pré-flop/flop/turn/river), le texte libre permettrait de décrire
 * ses cartes explicitement — il est donc coupé par défaut, sauf si l'hôte l'a activé
 * dans les réglages de partie.
 */
function isChatAllowed(room: RoomState): boolean {
  if (room.phase === 'LOBBY' || room.phase === 'ROUND_RESULT') return true;
  if (room.phase === 'VOTING') return room.settings.chatEnabled;
  return false;
}

export function registerCommsHandlers(socket: Socket, roomManager: RoomManager): void {
  socket.on(EVENTS.EMOTE_SEND, (payload: EmoteRequest) => {
    const entry = roomManager.getEntryBySocket(socket.id);
    if (!entry) return;
    const { room, player } = entry;
    if (room.phase !== 'VOTING') return;
    if (!EMOTE_KINDS.includes(payload?.emote)) return;
    if (!emoteLimiter.allow(player.id)) return;

    roomManager.io.to(room.roomCode).emit(EVENTS.EMOTE_RECEIVE, {
      id: randomUUID(),
      playerId: player.id,
      playerName: player.name,
      emote: payload.emote,
      ts: Date.now(),
    });
  });

  socket.on(EVENTS.CHAT_SEND, (payload: ChatRequest) => {
    const entry = roomManager.getEntryBySocket(socket.id);
    if (!entry) return;
    const { room, player } = entry;
    if (!isChatAllowed(room)) return;
    const text = (payload?.text ?? '').trim().slice(0, CHAT_MAX_LENGTH);
    if (!text) return;
    if (!chatLimiter.allow(player.id)) return;

    const message = { id: randomUUID(), playerId: player.id, playerName: player.name, text, ts: Date.now() };
    room.chatLog.push(message);
    if (room.chatLog.length > CHAT_LOG_CAP) room.chatLog.shift();

    roomManager.io.to(room.roomCode).emit(EVENTS.CHAT_RECEIVE, message);
    // chatLog fait partie de l'état complet de la room : sans cette diffusion, le message
    // n'apparaît chez les autres joueurs qu'au prochain déplacement/verrouillage de jeton.
    roomManager.broadcastState(room);
  });
}
