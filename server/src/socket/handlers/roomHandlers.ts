import type { Socket } from 'socket.io';
import {
  EVENTS,
  type CreateRoomAck,
  type CreateRoomRequest,
  type JoinRoomAck,
  type JoinRoomRequest,
  type RejoinAck,
  type RejoinRequest,
} from '@thegang/shared';
import type { RoomManager } from '../../rooms/RoomManager.js';
import { serializeForPlayer } from '../../rooms/serialize.js';

export function registerRoomHandlers(socket: Socket, roomManager: RoomManager): void {
  socket.on(EVENTS.ROOM_CREATE, (payload: CreateRoomRequest, ack: (res: CreateRoomAck) => void) => {
    const name = (payload?.name ?? '').trim();
    if (!name) return;
    const { room, player } = roomManager.createRoom(name, socket.id);
    socket.join(room.roomCode);
    ack({
      ok: true,
      roomCode: room.roomCode,
      playerId: player.id,
      reconnectToken: player.reconnectToken,
      state: serializeForPlayer(room, player.id),
    });
  });

  socket.on(EVENTS.ROOM_JOIN, (payload: JoinRoomRequest, ack: (res: JoinRoomAck) => void) => {
    const name = (payload?.name ?? '').trim();
    const roomCode = (payload?.roomCode ?? '').trim();
    if (!name || !roomCode) {
      ack({ ok: false, error: 'ROOM_NOT_FOUND' });
      return;
    }
    const result = roomManager.joinRoom(roomCode, name, socket.id);
    if (!result.ok) {
      ack({ ok: false, error: result.error });
      return;
    }
    const { room, player } = result;
    socket.join(room.roomCode);
    ack({
      ok: true,
      playerId: player.id,
      reconnectToken: player.reconnectToken,
      state: serializeForPlayer(room, player.id),
    });
    socket.to(room.roomCode).emit(EVENTS.PLAYER_JOINED, {
      player: { id: player.id, name: player.name, seatIndex: player.seatIndex, connected: true, isHost: false, chipSlot: null, locked: false },
    });
    roomManager.broadcastState(room);
  });

  socket.on(EVENTS.ROOM_REJOIN, (payload: RejoinRequest, ack: (res: RejoinAck) => void) => {
    const result = roomManager.rejoin(payload.roomCode, payload.playerId, payload.reconnectToken, socket.id);
    if (!result.ok) {
      ack({ ok: false, error: result.error });
      return;
    }
    const { room, player } = result;
    socket.join(room.roomCode);
    ack({ ok: true, state: serializeForPlayer(room, player.id) });
    socket.to(room.roomCode).emit(EVENTS.PLAYER_CONNECTION, { playerId: player.id, connected: true });
    roomManager.broadcastState(room);
  });

  socket.on(EVENTS.ROOM_LEAVE, () => {
    const entry = roomManager.getEntryBySocket(socket.id);
    if (!entry) return;
    const { room, player } = entry;
    socket.leave(room.roomCode);
    const updatedRoom = roomManager.leaveRoom(room.roomCode, player.id);
    if (updatedRoom) {
      roomManager.io.to(updatedRoom.roomCode).emit(EVENTS.PLAYER_LEFT, { playerId: player.id });
      roomManager.broadcastState(updatedRoom);
    }
  });

  socket.on('disconnect', () => {
    const result = roomManager.handleSocketDisconnect(socket.id);
    if (!result) return;
    const { room, player } = result;
    roomManager.io.to(room.roomCode).emit(EVENTS.PLAYER_CONNECTION, { playerId: player.id, connected: false });
    roomManager.broadcastState(room);
  });
}
