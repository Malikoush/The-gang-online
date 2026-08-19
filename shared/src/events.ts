// Noms d'événements Socket.IO — source unique de vérité pour client et serveur.

export const EVENTS = {
  // Client -> Server
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_REJOIN: 'room:rejoin',
  ROOM_LEAVE: 'room:leave',
  GAME_START: 'game:start',
  ROOM_SETTINGS_UPDATE: 'room:settingsUpdate',
  CHIP_MOVE: 'chip:move',
  CHIP_LOCK: 'chip:lock',
  EMOTE_SEND: 'emote:send',
  CHAT_SEND: 'chat:send',
  ROUND_CONTINUE: 'round:continue',
  ROUND_RETURN_TO_LOBBY: 'round:returnToLobby',

  // Server -> Client
  ROOM_STATE: 'room:state',
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  PLAYER_CONNECTION: 'player:connection',
  DEAL_PRIVATE: 'deal:private',
  DEAL_COMMUNITY: 'deal:community',
  CHIP_MOVED: 'chip:moved',
  CHIP_LOCK_CHANGED: 'chip:lockChanged',
  REVEAL_COUNTDOWN_STARTED: 'reveal:countdownStarted',
  REVEAL_COUNTDOWN_CANCELLED: 'reveal:countdownCancelled',
  EMOTE_RECEIVE: 'emote:receive',
  CHAT_RECEIVE: 'chat:receive',
  REVEAL_STEP: 'reveal:step',
  REVEAL_COMPLETE: 'reveal:complete',
  ERROR: 'error',
} as const;
