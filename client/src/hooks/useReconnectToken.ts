export interface StoredSession {
  roomCode: string;
  playerId: string;
  reconnectToken: string;
}

const KEY = 'thegang:session';

export function saveSession(session: StoredSession): void {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function loadSession(): StoredSession | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(KEY);
}
