import type { ClientRoomState, PublicPlayer } from '@thegang/shared';
import type { RoomState } from './types.js';

/**
 * SEUL point de passage autorisé pour construire un payload envoyé à un client.
 * Masque les cartes privées de tous les joueurs sauf `forPlayerId`, et tronque
 * revealSequence à ce qui a déjà été publiquement révélé (revealCursor).
 * Aucun autre code ne doit jamais émettre `state.players` ou `state.deck` bruts.
 */
export function serializeForPlayer(state: RoomState, forPlayerId: string): ClientRoomState {
  const me = state.players.find((p) => p.id === forPlayerId);

  const players: PublicPlayer[] = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    seatIndex: p.seatIndex,
    connected: p.connected,
    isHost: p.isHost,
    chipSlot: p.chipSlot,
    locked: p.locked,
  }));

  return {
    roomCode: state.roomCode,
    hostPlayerId: state.hostPlayerId,
    phase: state.phase,
    players,
    myPlayerId: forPlayerId,
    myHoleCards: me?.holeCards ?? [],
    roundNumber: state.roundNumber,
    street: state.street,
    communityCards: state.communityCards,
    revealSequence: state.revealSequence.slice(0, state.revealCursor),
    lockCountdownDeadline: state.lockCountdownDeadline,
    chatLog: state.chatLog,
    lastRoundOutcome: state.lastRoundOutcome,
    roundHistory: state.roundHistory,
    settings: state.settings,
  };
}
