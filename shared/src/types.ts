// Types partagés entre le serveur et le client. Aucune logique ici, uniquement des formes de données.

export type GamePhase = 'LOBBY' | 'DEALING' | 'VOTING' | 'REVEALING' | 'ROUND_RESULT';

// Les 4 étapes de classement d'une manche : pré-flop (2 cartes privées seules),
// puis flop/turn/river au fur et à mesure que les cartes communes tombent.
// Seul le classement de la rivière compte pour la révélation finale ; les précédents
// ne servent qu'à échanger des informations non-verbales (jeton + emotes + chat).
export type Street = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER';

export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J 12=Q 13=K 14=A

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type HandCategory =
  | 'HIGH_CARD'
  | 'PAIR'
  | 'TWO_PAIR'
  | 'TRIPS'
  | 'STRAIGHT'
  | 'FLUSH'
  | 'FULL_HOUSE'
  | 'QUADS'
  | 'STRAIGHT_FLUSH';

export interface HandEvaluation {
  category: HandCategory;
  categoryRank: number; // 0..8
  tiebreakers: number[]; // ordre décroissant de signification
  bestFive: Card[];
  label: string; // ex: "Deux paires, Rois et Neufs"
}

export type EmoteKind = 'HESITATE' | 'CONFIDENT' | 'ANNOYED' | 'THUMBS_DOWN' | 'PANIC' | 'OK' | 'NAILS' | 'NO_CROSS';

/** Paramètres de partie modifiables par l'hôte, avant le lancement (depuis le salon). */
export interface RoomSettings {
  /** Chat texte autorisé pendant le vote (pré-flop/flop/turn/river). Le chat du salon /
   *  entre les manches reste, lui, toujours disponible quel que soit ce réglage. */
  chatEnabled: boolean;
  /** Secondes d'inactivité avant de forcer le passage à l'étape suivante. `null` = illimité
   *  (on n'avance que quand tout le monde a verrouillé son jeton). */
  responseTimeSeconds: number | null;
}

export interface PublicPlayer {
  id: string;
  name: string;
  seatIndex: number;
  connected: boolean;
  isHost: boolean;
  chipSlot: number | null;
  locked: boolean;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  ts: number;
}

export interface EmoteEvent {
  id: string;
  playerId: string;
  playerName: string;
  emote: EmoteKind;
  ts: number;
}

export interface RevealStep {
  seatIndex: number;
  playerId: string;
  playerName: string;
  chipSlot: number;
  hand: HandEvaluation;
  passed: boolean;
}

export interface RoundOutcome {
  success: boolean;
  failedAtSeatIndex: number | null;
}

export interface RoundHistoryEntry {
  round: number;
  success: boolean;
}

// Vue redigee de l'etat de la room telle qu'envoyee a UN joueur precis.
// - myHoleCards n'est jamais présent que pour le destinataire (les autres joueurs restent sans le champ)
// - revealSequence est tronquee a ce qui a deja ete revele publiquement
export interface ClientRoomState {
  roomCode: string;
  hostPlayerId: string;
  phase: GamePhase;
  players: PublicPlayer[];
  myPlayerId: string;
  myHoleCards: Card[]; // vide tant que non distribué
  roundNumber: number;
  street: Street;
  communityCards: Card[];
  revealSequence: RevealStep[];
  lockCountdownDeadline: number | null;
  chatLog: ChatMessage[];
  lastRoundOutcome: RoundOutcome | null;
  roundHistory: RoundHistoryEntry[];
  settings: RoomSettings;
}

// ---- Payloads des événements Socket.IO ----

export interface CreateRoomRequest {
  name: string;
}
export interface CreateRoomAck {
  ok: true;
  roomCode: string;
  playerId: string;
  reconnectToken: string;
  state: ClientRoomState;
}

export interface JoinRoomRequest {
  roomCode: string;
  name: string;
}
export type JoinRoomError = 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'NAME_TAKEN' | 'GAME_IN_PROGRESS';
export type JoinRoomAck =
  | { ok: true; playerId: string; reconnectToken: string; state: ClientRoomState }
  | { ok: false; error: JoinRoomError };

export interface RejoinRequest {
  roomCode: string;
  playerId: string;
  reconnectToken: string;
}
export type RejoinError = 'INVALID_TOKEN' | 'ROOM_NOT_FOUND';
export type RejoinAck = { ok: true; state: ClientRoomState } | { ok: false; error: RejoinError };

export interface ChipMoveRequest {
  toSlot: number;
}

export interface EmoteRequest {
  emote: EmoteKind;
}

export interface ChatRequest {
  text: string;
}

export interface RoomSettingsUpdateRequest {
  chatEnabled: boolean;
  responseTimeSeconds: number | null;
}

export interface PlayerConnectionChanged {
  playerId: string;
  connected: boolean;
}

export interface ErrorEvent {
  code: string;
  message: string;
}

export interface ChipMoved {
  playerId: string;
  toSlot: number;
  displacedPlayerId: string | null;
}

export interface LockCountdownStarted {
  deadline: number;
}

export interface CommunityDealt {
  communityCards: Card[];
  street: Street;
}
