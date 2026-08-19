import { useState, type FormEvent } from 'react';
import type { ClientRoomState } from '@thegang/shared';
import { useRoom } from '../state/RoomProvider';

/**
 * Le chat du salon / entre les manches est toujours ouvert (aucun enjeu de triche).
 * Pendant le vote, il ne l'est que si l'hôte l'a activé dans les réglages de partie —
 * par défaut il est coupé, pour éviter de décrire ses cartes en clair.
 */
function isChatAllowed(state: ClientRoomState): boolean {
  if (state.phase === 'LOBBY' || state.phase === 'ROUND_RESULT') return true;
  if (state.phase === 'VOTING') return state.settings.chatEnabled;
  return false;
}

export function ChatPanel() {
  const { state, sendChat } = useRoom();
  const [text, setText] = useState('');
  if (!state) return null;
  const disabled = !isChatAllowed(state);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim()) return;
    sendChat(text);
    setText('');
  }

  return (
    <div className="chat-panel">
      <div className="chat-log">
        {state.chatLog.length === 0 && <div className="chat-empty">Aucun message pour l'instant.</div>}
        {state.chatLog.map((m) => (
          <div key={m.id} className="chat-message">
            <span className="chat-author">{m.playerName} :</span> {m.text}
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? 'Chat désactivé pendant cette manche' : 'Écrire un message…'}
          maxLength={240}
        />
        <button type="submit" disabled={disabled}>
          Envoyer
        </button>
      </form>
    </div>
  );
}
