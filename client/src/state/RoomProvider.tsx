import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { EVENTS } from '@thegang/shared';
import type {
  ChatRequest,
  ClientRoomState,
  CreateRoomAck,
  EmoteEvent,
  EmoteKind,
  JoinRoomAck,
  RejoinAck,
  RoomSettingsUpdateRequest,
} from '@thegang/shared';
import { socket } from '../socket/socket';
import { clearSession, loadSession, saveSession } from '../hooks/useReconnectToken';

interface RoomContextValue {
  state: ClientRoomState | null;
  connected: boolean;
  joinError: string | null;
  emotes: EmoteEvent[];
  createRoom: (name: string) => void;
  joinRoom: (roomCode: string, name: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  moveChip: (toSlot: number) => void;
  toggleLock: () => void;
  sendEmote: (emote: EmoteKind) => void;
  sendChat: (text: string) => void;
  continueRound: () => void;
  returnToLobby: () => void;
  updateSettings: (settings: RoomSettingsUpdateRequest) => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function useRoom(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom doit être utilisé sous <RoomProvider>');
  return ctx;
}

export function RoomProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClientRoomState | null>(null);
  const [connected, setConnected] = useState(socket.connected);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [emotes, setEmotes] = useState<EmoteEvent[]>([]);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      const session = loadSession();
      if (session) {
        socket.emit(EVENTS.ROOM_REJOIN, session, (res: RejoinAck) => {
          if (res.ok) setState(res.state);
          else clearSession();
        });
      }
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onRoomState(payload: { state: ClientRoomState }) {
      setState(payload.state);
    }
    function onEmote(evt: EmoteEvent) {
      setEmotes((prev) => [...prev.slice(-19), evt]);
      setTimeout(() => {
        setEmotes((prev) => prev.filter((e) => e.id !== evt.id));
      }, 4000);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(EVENTS.ROOM_STATE, onRoomState);
    socket.on(EVENTS.EMOTE_RECEIVE, onEmote);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(EVENTS.ROOM_STATE, onRoomState);
      socket.off(EVENTS.EMOTE_RECEIVE, onEmote);
    };
  }, []);

  const createRoom = useCallback((name: string) => {
    setJoinError(null);
    socket.emit(EVENTS.ROOM_CREATE, { name }, (res: CreateRoomAck) => {
      saveSession({ roomCode: res.roomCode, playerId: res.playerId, reconnectToken: res.reconnectToken });
      setState(res.state);
    });
  }, []);

  const joinRoom = useCallback((roomCode: string, name: string) => {
    setJoinError(null);
    const code = roomCode.toUpperCase();
    socket.emit(EVENTS.ROOM_JOIN, { roomCode: code, name }, (res: JoinRoomAck) => {
      if (!res.ok) {
        setJoinError(res.error);
        return;
      }
      saveSession({ roomCode: code, playerId: res.playerId, reconnectToken: res.reconnectToken });
      setState(res.state);
    });
  }, []);

  const leaveRoom = useCallback(() => {
    socket.emit(EVENTS.ROOM_LEAVE);
    clearSession();
    setState(null);
  }, []);

  const startGame = useCallback(() => socket.emit(EVENTS.GAME_START), []);
  const moveChip = useCallback((toSlot: number) => socket.emit(EVENTS.CHIP_MOVE, { toSlot }), []);
  const toggleLock = useCallback(() => socket.emit(EVENTS.CHIP_LOCK), []);
  const sendEmote = useCallback((emote: EmoteKind) => socket.emit(EVENTS.EMOTE_SEND, { emote }), []);
  const sendChat = useCallback((text: string) => {
    const payload: ChatRequest = { text };
    socket.emit(EVENTS.CHAT_SEND, payload);
  }, []);
  const continueRound = useCallback(() => socket.emit(EVENTS.ROUND_CONTINUE), []);
  const returnToLobby = useCallback(() => socket.emit(EVENTS.ROUND_RETURN_TO_LOBBY), []);
  const updateSettings = useCallback(
    (settings: RoomSettingsUpdateRequest) => socket.emit(EVENTS.ROOM_SETTINGS_UPDATE, settings),
    [],
  );

  const value: RoomContextValue = {
    state,
    connected,
    joinError,
    emotes,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    moveChip,
    toggleLock,
    sendEmote,
    sendChat,
    continueRound,
    returnToLobby,
    updateSettings,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
