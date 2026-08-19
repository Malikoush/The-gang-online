import { randomBytes, randomUUID } from 'node:crypto';
import type { Server } from 'socket.io';
import { EVENTS } from '@thegang/shared';
import { generateRoomCode } from './roomCode.js';
import { serializeForPlayer } from './serialize.js';
import type { RoomState, ServerPlayer } from './types.js';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
const RECONNECT_GRACE_MS = 60_000;
const IDLE_ROOM_SWEEP_INTERVAL_MS = 60_000;
const IDLE_ROOM_TTL_MS = 10 * 60_000;

export type JoinError = 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'NAME_TAKEN' | 'GAME_IN_PROGRESS';
export type RejoinError = 'INVALID_TOKEN' | 'ROOM_NOT_FOUND';

function newReconnectToken(): string {
  return randomBytes(16).toString('hex');
}

export class RoomManager {
  private rooms = new Map<string, RoomState>();
  private socketIndex = new Map<string, { roomCode: string; playerId: string }>();

  constructor(public readonly io: Server) {
    setInterval(() => this.sweepIdleRooms(), IDLE_ROOM_SWEEP_INTERVAL_MS).unref();
  }

  getRoom(roomCode: string): RoomState | undefined {
    return this.rooms.get(roomCode);
  }

  getEntryBySocket(socketId: string): { room: RoomState; player: ServerPlayer } | undefined {
    const idx = this.socketIndex.get(socketId);
    if (!idx) return undefined;
    const room = this.rooms.get(idx.roomCode);
    if (!room) return undefined;
    const player = room.players.find((p) => p.id === idx.playerId);
    if (!player) return undefined;
    return { room, player };
  }

  createRoom(hostName: string, socketId: string): { room: RoomState; player: ServerPlayer } {
    const roomCode = generateRoomCode((code) => this.rooms.has(code));
    const hostPlayer: ServerPlayer = {
      id: randomUUID(),
      socketId,
      name: hostName.trim().slice(0, 24),
      seatIndex: 0,
      connected: true,
      disconnectedAt: null,
      isHost: true,
      reconnectToken: newReconnectToken(),
      holeCards: [],
      chipSlot: null,
      locked: false,
    };
    const room: RoomState = {
      roomCode,
      hostPlayerId: hostPlayer.id,
      phase: 'LOBBY',
      players: [hostPlayer],
      roundNumber: 0,
      street: 'PREFLOP',
      communityCards: [],
      deck: [],
      chipLastMovedAt: Date.now(),
      inactivityTimer: null,
      lockCountdownDeadline: null,
      lockCountdownTimer: null,
      revealSequence: [],
      revealCursor: 0,
      revealTimer: null,
      chatLog: [],
      lastRoundOutcome: null,
      roundHistory: [],
      settings: { chatEnabled: false, responseTimeSeconds: null },
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };
    this.rooms.set(roomCode, room);
    this.socketIndex.set(socketId, { roomCode, playerId: hostPlayer.id });
    return { room, player: hostPlayer };
  }

  joinRoom(
    roomCode: string,
    name: string,
    socketId: string,
  ): { ok: true; room: RoomState; player: ServerPlayer } | { ok: false; error: JoinError } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };
    if (room.phase !== 'LOBBY') return { ok: false, error: 'GAME_IN_PROGRESS' };
    if (room.players.length >= MAX_PLAYERS) return { ok: false, error: 'ROOM_FULL' };
    const trimmedName = name.trim().slice(0, 24);
    const nameTaken = room.players.some((p) => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (nameTaken) return { ok: false, error: 'NAME_TAKEN' };

    const player: ServerPlayer = {
      id: randomUUID(),
      socketId,
      name: trimmedName,
      seatIndex: room.players.length,
      connected: true,
      disconnectedAt: null,
      isHost: false,
      reconnectToken: newReconnectToken(),
      holeCards: [],
      chipSlot: null,
      locked: false,
    };
    room.players.push(player);
    room.lastActivityAt = Date.now();
    this.socketIndex.set(socketId, { roomCode: room.roomCode, playerId: player.id });
    return { ok: true, room, player };
  }

  rejoin(
    roomCode: string,
    playerId: string,
    reconnectToken: string,
    socketId: string,
  ): { ok: true; room: RoomState; player: ServerPlayer } | { ok: false; error: RejoinError } {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };
    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.reconnectToken !== reconnectToken) return { ok: false, error: 'INVALID_TOKEN' };

    player.socketId = socketId;
    player.connected = true;
    player.disconnectedAt = null;
    room.lastActivityAt = Date.now();
    this.socketIndex.set(socketId, { roomCode: room.roomCode, playerId: player.id });
    return { ok: true, room, player };
  }

  leaveRoom(roomCode: string, playerId: string): RoomState | undefined {
    const room = this.rooms.get(roomCode);
    if (!room) return undefined;
    const player = room.players.find((p) => p.id === playerId);
    if (player?.socketId) this.socketIndex.delete(player.socketId);
    room.players = room.players.filter((p) => p.id !== playerId);
    if (room.players.length === 0) {
      this.deleteRoom(roomCode);
      return undefined;
    }
    if (room.hostPlayerId === playerId) {
      const newHost = room.players[0];
      newHost.isHost = true;
      room.hostPlayerId = newHost.id;
    }
    room.lastActivityAt = Date.now();
    return room;
  }

  handleSocketDisconnect(socketId: string): { room: RoomState; player: ServerPlayer } | undefined {
    const entry = this.socketIndex.get(socketId);
    if (!entry) return undefined;
    this.socketIndex.delete(socketId);
    const room = this.rooms.get(entry.roomCode);
    if (!room) return undefined;
    const player = room.players.find((p) => p.id === entry.playerId);
    if (!player) return undefined;
    player.connected = false;
    player.socketId = null;
    player.disconnectedAt = Date.now();
    room.lastActivityAt = Date.now();

    setTimeout(() => {
      // Après la fenêtre de grâce, on ne fait rien d'automatique en dehors du LOBBY :
      // le siège reste réservé pour le braquage en cours (voir plan de conception).
      if (room.phase === 'LOBBY' && !player.connected) {
        this.leaveRoom(room.roomCode, player.id);
        this.broadcastState(room);
      }
    }, RECONNECT_GRACE_MS).unref();

    return { room, player };
  }

  broadcastState(room: RoomState): void {
    for (const player of room.players) {
      if (!player.socketId) continue;
      this.io.to(player.socketId).emit(EVENTS.ROOM_STATE, { state: serializeForPlayer(room, player.id) });
    }
  }

  deleteRoom(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (room?.inactivityTimer) clearTimeout(room.inactivityTimer);
    if (room?.lockCountdownTimer) clearTimeout(room.lockCountdownTimer);
    if (room?.revealTimer) clearTimeout(room.revealTimer);
    this.rooms.delete(roomCode);
  }

  private sweepIdleRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      const anyConnected = room.players.some((p) => p.connected);
      if (!anyConnected && now - room.lastActivityAt > IDLE_ROOM_TTL_MS) {
        this.deleteRoom(code);
      }
    }
  }
}
