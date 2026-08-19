import type { Socket } from 'socket.io';
import { EVENTS, type ErrorEvent, type RoomSettingsUpdateRequest } from '@thegang/shared';
import type { RoomManager } from '../../rooms/RoomManager.js';
import { MAX_PLAYERS, MIN_PLAYERS } from '../../rooms/RoomManager.js';
import { dealRound } from '../../game/dealRound.js';

const MIN_RESPONSE_SECONDS = 10;
const MAX_RESPONSE_SECONDS = 600;

function sendError(socket: Socket, code: string, message: string): void {
  const payload: ErrorEvent = { code, message };
  socket.emit(EVENTS.ERROR, payload);
}

export function registerGameHandlers(socket: Socket, roomManager: RoomManager): void {
  // Réglages de partie (chat pendant le vote, temps de réponse) : hôte uniquement, avant le lancement.
  socket.on(EVENTS.ROOM_SETTINGS_UPDATE, (payload: RoomSettingsUpdateRequest) => {
    const entry = roomManager.getEntryBySocket(socket.id);
    if (!entry) return;
    const { room, player } = entry;
    if (!player.isHost) return;
    if (room.phase !== 'LOBBY') return;

    const chatEnabled = Boolean(payload?.chatEnabled);
    let responseTimeSeconds: number | null = null;
    if (payload?.responseTimeSeconds !== null && payload?.responseTimeSeconds !== undefined) {
      const seconds = Number(payload.responseTimeSeconds);
      if (!Number.isFinite(seconds)) return;
      responseTimeSeconds = Math.min(MAX_RESPONSE_SECONDS, Math.max(MIN_RESPONSE_SECONDS, Math.round(seconds)));
    }

    room.settings = { chatEnabled, responseTimeSeconds };
    roomManager.broadcastState(room);
  });

  socket.on(EVENTS.GAME_START, () => {
    const entry = roomManager.getEntryBySocket(socket.id);
    if (!entry) return;
    const { room, player } = entry;
    if (!player.isHost) return sendError(socket, 'NOT_HOST', "Seul l'hôte peut démarrer la partie.");
    if (room.phase !== 'LOBBY') return;
    if (room.players.length < MIN_PLAYERS || room.players.length > MAX_PLAYERS) {
      return sendError(socket, 'INVALID_PLAYER_COUNT', `Il faut entre ${MIN_PLAYERS} et ${MAX_PLAYERS} joueurs.`);
    }

    room.roundNumber = 0;
    room.roundHistory = [];
    dealRound(room, roomManager);
  });

  // L'hôte enchaîne directement sur une nouvelle manche depuis l'écran de résultat.
  socket.on(EVENTS.ROUND_CONTINUE, () => {
    const entry = roomManager.getEntryBySocket(socket.id);
    if (!entry) return;
    const { room, player } = entry;
    if (!player.isHost) return;
    if (room.phase !== 'ROUND_RESULT') return;
    dealRound(room, roomManager);
  });

  // Retour au salon (entre deux manches) : remet la room en LOBBY, prête pour un nouveau départ.
  socket.on(EVENTS.ROUND_RETURN_TO_LOBBY, () => {
    const entry = roomManager.getEntryBySocket(socket.id);
    if (!entry) return;
    const { room, player } = entry;
    if (!player.isHost) return;
    if (room.phase !== 'ROUND_RESULT') return;

    room.phase = 'LOBBY';
    room.roundNumber = 0;
    room.street = 'PREFLOP';
    room.communityCards = [];
    room.revealSequence = [];
    room.revealCursor = 0;
    room.chatLog = [];
    room.lastRoundOutcome = null;
    room.roundHistory = [];
    for (const p of room.players) {
      p.holeCards = [];
      p.chipSlot = null;
      p.locked = false;
    }
    roomManager.broadcastState(room);
  });
}
