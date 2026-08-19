import type {
  Card,
  ChatMessage,
  GamePhase,
  RevealStep,
  RoomSettings,
  RoundHistoryEntry,
  RoundOutcome,
  Street,
} from '@thegang/shared';

export interface ServerPlayer {
  id: string;
  socketId: string | null;
  name: string;
  seatIndex: number;
  connected: boolean;
  disconnectedAt: number | null;
  isHost: boolean;
  reconnectToken: string;
  holeCards: Card[];
  chipSlot: number | null;
  locked: boolean;
}

export interface RoomState {
  roomCode: string;
  hostPlayerId: string;
  phase: GamePhase;
  players: ServerPlayer[];
  roundNumber: number;
  street: Street;
  communityCards: Card[];
  deck: Card[];
  chipLastMovedAt: number;
  inactivityTimer: NodeJS.Timeout | null;
  lockCountdownDeadline: number | null;
  lockCountdownTimer: NodeJS.Timeout | null;
  revealSequence: RevealStep[];
  revealCursor: number;
  revealTimer: NodeJS.Timeout | null;
  chatLog: ChatMessage[];
  lastRoundOutcome: RoundOutcome | null;
  roundHistory: RoundHistoryEntry[];
  settings: RoomSettings;
  createdAt: number;
  lastActivityAt: number;
}
