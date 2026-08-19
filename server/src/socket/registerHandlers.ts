import type { Server, Socket } from 'socket.io';
import type { RoomManager } from '../rooms/RoomManager.js';
import { registerRoomHandlers } from './handlers/roomHandlers.js';
import { registerGameHandlers } from './handlers/gameHandlers.js';
import { registerVoteHandlers } from './handlers/voteHandlers.js';
import { registerCommsHandlers } from './handlers/commsHandlers.js';
import { logger } from '../util/logger.js';

export function registerSocketHandlers(io: Server, roomManager: RoomManager): void {
  io.on('connection', (socket: Socket) => {
    logger.info('socket connecté', socket.id);
    registerRoomHandlers(socket, roomManager);
    registerGameHandlers(socket, roomManager);
    registerVoteHandlers(socket, roomManager);
    registerCommsHandlers(socket, roomManager);
  });
}
