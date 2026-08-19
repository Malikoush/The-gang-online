import { EVENTS } from '@thegang/shared';
import type { RoomManager } from '../rooms/RoomManager.js';
import type { RoomState } from '../rooms/types.js';

const COUNTDOWN_MS = 10_000;

export function clearRoomTimers(room: RoomState): void {
  if (room.inactivityTimer) clearTimeout(room.inactivityTimer);
  if (room.lockCountdownTimer) clearTimeout(room.lockCountdownTimer);
  room.inactivityTimer = null;
  room.lockCountdownTimer = null;
}

function startLockCountdown(room: RoomState, roomManager: RoomManager, onAdvance: () => void): void {
  const deadline = Date.now() + COUNTDOWN_MS;
  room.lockCountdownDeadline = deadline;
  roomManager.io.to(room.roomCode).emit(EVENTS.REVEAL_COUNTDOWN_STARTED, { deadline });
  roomManager.broadcastState(room);
  room.lockCountdownTimer = setTimeout(() => {
    room.lockCountdownDeadline = null;
    onAdvance();
  }, COUNTDOWN_MS);
}

/** Annule tout compte à rebours en cours suite à une nouvelle activité sur un jeton. */
export function cancelLockCountdown(room: RoomState, roomManager: RoomManager): void {
  const wasCounting = room.lockCountdownDeadline !== null;
  clearRoomTimers(room);
  room.lockCountdownDeadline = null;
  if (wasCounting) {
    roomManager.io.to(room.roomCode).emit(EVENTS.REVEAL_COUNTDOWN_CANCELLED, {});
  }
}

/**
 * (Ré)arme la fenêtre d'inactivité pour l'étape de classement en cours, selon le temps
 * de réponse choisi par l'hôte (`room.settings.responseTimeSeconds`). À `null` (réglage
 * par défaut : illimité), on n'arme rien — la manche n'avance que quand tout le monde a
 * verrouillé son jeton, sans jamais forcer la main. À appeler au début de chaque street
 * (pré-flop/flop/turn/river) et à chaque activité sur un jeton (déplacement ou
 * verrouillage/déverrouillage).
 */
export function armInactivityWatch(room: RoomState, roomManager: RoomManager, onAdvance: () => void): void {
  clearRoomTimers(room);
  room.lockCountdownDeadline = null;
  room.chipLastMovedAt = Date.now();
  if (room.settings.responseTimeSeconds === null) return;
  room.inactivityTimer = setTimeout(() => {
    startLockCountdown(room, roomManager, onAdvance);
  }, room.settings.responseTimeSeconds * 1000);
}

export function onChipActivity(room: RoomState, roomManager: RoomManager, onAdvance: () => void): void {
  armInactivityWatch(room, roomManager, onAdvance);
}

/** Déclenche onAdvance() immédiatement si tous les joueurs connectés sont verrouillés. */
export function checkAllLocked(room: RoomState, roomManager: RoomManager, onAdvance: () => void): void {
  const connected = room.players.filter((p) => p.connected);
  if (connected.length > 0 && connected.every((p) => p.locked)) {
    clearRoomTimers(room);
    room.lockCountdownDeadline = null;
    onAdvance();
  }
}
