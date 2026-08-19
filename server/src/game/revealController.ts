import { EVENTS } from '@thegang/shared';
import type { RevealStep } from '@thegang/shared';
import type { RoomManager } from '../rooms/RoomManager.js';
import type { RoomState } from '../rooms/types.js';
import { clearRoomTimers } from './lockTimer.js';
import { compareHands, evaluateHand } from './handEvaluator.js';

const REVEAL_STEP_INTERVAL_MS = 1800;
const ROUND_HISTORY_CAP = 20;

/** Calcule la séquence complète de révélation (classement de la rivière) et démarre le défilement pas-à-pas. */
export function startReveal(room: RoomState, roomManager: RoomManager): void {
  clearRoomTimers(room);
  room.lockCountdownDeadline = null;

  const orderedBySlot = [...room.players]
    .filter((p) => p.chipSlot !== null)
    .sort((a, b) => (a.chipSlot as number) - (b.chipSlot as number));

  let previous: ReturnType<typeof evaluateHand> | null = null;
  room.revealSequence = orderedBySlot.map((player): RevealStep => {
    const hand = evaluateHand([...player.holeCards, ...room.communityCards]);
    const passed = previous === null || compareHands(hand, previous) >= 0;
    previous = hand;
    return {
      seatIndex: player.seatIndex,
      playerId: player.id,
      playerName: player.name,
      chipSlot: player.chipSlot as number,
      hand,
      passed,
    };
  });
  room.revealCursor = 0;
  room.phase = 'REVEALING';
  roomManager.broadcastState(room);

  revealNextStep(room, roomManager);
}

function revealNextStep(room: RoomState, roomManager: RoomManager): void {
  const step = room.revealSequence[room.revealCursor];
  room.revealCursor += 1;
  roomManager.broadcastState(room);
  roomManager.io.to(room.roomCode).emit(EVENTS.REVEAL_STEP, { step });

  const isLast = room.revealCursor >= room.revealSequence.length;
  if (!step.passed || isLast) {
    finalizeReveal(room, roomManager);
    return;
  }
  room.revealTimer = setTimeout(() => revealNextStep(room, roomManager), REVEAL_STEP_INTERVAL_MS);
}

function finalizeReveal(room: RoomState, roomManager: RoomManager): void {
  if (room.revealTimer) {
    clearTimeout(room.revealTimer);
    room.revealTimer = null;
  }
  const success = room.revealSequence.every((s) => s.passed);
  const failedStep = room.revealSequence.find((s) => !s.passed);
  room.lastRoundOutcome = { success, failedAtSeatIndex: failedStep ? failedStep.seatIndex : null };
  room.roundHistory = [...room.roundHistory, { round: room.roundNumber, success }].slice(-ROUND_HISTORY_CAP);
  room.phase = 'ROUND_RESULT';
  roomManager.broadcastState(room);
}
