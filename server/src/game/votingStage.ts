import { EVENTS } from '@thegang/shared';
import type { RoomManager } from '../rooms/RoomManager.js';
import type { RoomState } from '../rooms/types.js';
import { drawCards } from './deck.js';
import { armInactivityWatch } from './lockTimer.js';
import { startReveal } from './revealController.js';

/**
 * Appelée quand tous les joueurs connectés sont verrouillés (ou après le délai
 * d'inactivité) pour la street en cours. Fait avancer pré-flop -> flop -> turn -> river,
 * en déverrouillant tout le monde (les positions de jeton sont conservées d'une street
 * à l'autre, seul le verrouillage est remis à zéro). À la rivière, déclenche la révélation
 * finale à la place.
 */
export function advanceVotingStage(room: RoomState, roomManager: RoomManager): void {
  if (room.street === 'RIVER') {
    startReveal(room, roomManager);
    return;
  }

  const drawCount = room.street === 'PREFLOP' ? 3 : 1;
  room.communityCards = [...room.communityCards, ...drawCards(room.deck, drawCount)];
  room.street = room.street === 'PREFLOP' ? 'FLOP' : room.street === 'FLOP' ? 'TURN' : 'RIVER';
  for (const player of room.players) player.locked = false;

  roomManager.io
    .to(room.roomCode)
    .emit(EVENTS.DEAL_COMMUNITY, { communityCards: room.communityCards, street: room.street });
  roomManager.broadcastState(room);
  armInactivityWatch(room, roomManager, () => advanceVotingStage(room, roomManager));
}
