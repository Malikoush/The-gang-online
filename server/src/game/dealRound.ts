import { EVENTS } from '@thegang/shared';
import type { RoomManager } from '../rooms/RoomManager.js';
import type { RoomState } from '../rooms/types.js';
import { buildShuffledDeck, drawCards } from './deck.js';
import { armInactivityWatch } from './lockTimer.js';
import { advanceVotingStage } from './votingStage.js';

/**
 * (Ré)initialise et distribue une nouvelle manche : 2 cartes privées par joueur,
 * aucune carte commune pour l'instant (pré-flop), reset du vote et du chat.
 * Le déroulé pré-flop/flop/turn/river est ensuite piloté par advanceVotingStage().
 */
export function dealRound(room: RoomState, roomManager: RoomManager): void {
  room.phase = 'DEALING';
  room.roundNumber += 1;
  room.chatLog = [];
  room.revealSequence = [];
  room.revealCursor = 0;
  room.communityCards = [];
  room.street = 'PREFLOP';
  room.lockCountdownDeadline = null;
  room.lastRoundOutcome = null;

  room.deck = buildShuffledDeck();
  for (const player of room.players) {
    player.holeCards = drawCards(room.deck, 2);
    player.chipSlot = null;
    player.locked = false;
    if (player.socketId) {
      roomManager.io.to(player.socketId).emit(EVENTS.DEAL_PRIVATE, { holeCards: player.holeCards });
    }
  }

  room.phase = 'VOTING';
  room.lastActivityAt = Date.now();
  roomManager.broadcastState(room);
  armInactivityWatch(room, roomManager, () => advanceVotingStage(room, roomManager));
}
