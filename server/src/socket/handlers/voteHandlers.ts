import type { Socket } from 'socket.io';
import { EVENTS, type ChipMoveRequest } from '@thegang/shared';
import type { RoomManager } from '../../rooms/RoomManager.js';
import { onChipActivity, checkAllLocked } from '../../game/lockTimer.js';
import { advanceVotingStage } from '../../game/votingStage.js';

export function registerVoteHandlers(socket: Socket, roomManager: RoomManager): void {
  socket.on(EVENTS.CHIP_MOVE, (payload: ChipMoveRequest) => {
    const entry = roomManager.getEntryBySocket(socket.id);
    if (!entry) return;
    const { room, player } = entry;
    if (room.phase !== 'VOTING' || player.locked) return;
    const toSlot = Number(payload?.toSlot);
    if (!Number.isInteger(toSlot) || toSlot < 1 || toSlot > room.players.length) return;

    const occupant = room.players.find((p) => p.id !== player.id && p.chipSlot === toSlot);
    const fromSlot = player.chipSlot;
    if (occupant) {
      occupant.chipSlot = fromSlot;
      // La personne déplacée n'a plus confirmé sa nouvelle position : on la déverrouille
      // pour éviter qu'elle reste "verrouillée" sur un slot qu'elle n'a jamais choisi.
      if (occupant.locked) {
        occupant.locked = false;
        roomManager.io.to(room.roomCode).emit(EVENTS.CHIP_LOCK_CHANGED, { playerId: occupant.id, locked: false });
      }
    }
    player.chipSlot = toSlot;

    roomManager.io.to(room.roomCode).emit(EVENTS.CHIP_MOVED, {
      playerId: player.id,
      toSlot,
      displacedPlayerId: occupant?.id ?? null,
    });
    roomManager.broadcastState(room);
    onChipActivity(room, roomManager, () => advanceVotingStage(room, roomManager));
  });

  socket.on(EVENTS.CHIP_LOCK, () => {
    const entry = roomManager.getEntryBySocket(socket.id);
    if (!entry) return;
    const { room, player } = entry;
    if (room.phase !== 'VOTING') return;

    if (!player.locked && player.chipSlot === null) return; // il faut avoir choisi un slot avant de se verrouiller
    player.locked = !player.locked;

    roomManager.io.to(room.roomCode).emit(EVENTS.CHIP_LOCK_CHANGED, { playerId: player.id, locked: player.locked });
    roomManager.broadcastState(room);

    if (player.locked) {
      checkAllLocked(room, roomManager, () => advanceVotingStage(room, roomManager));
    } else {
      onChipActivity(room, roomManager, () => advanceVotingStage(room, roomManager));
    }
  });
}
