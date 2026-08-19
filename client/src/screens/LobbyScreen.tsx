import { useState } from 'react';
import { useRoom } from '../state/RoomProvider';
import { RoomSettingsPanel } from '../components/RoomSettingsPanel';
import { SettingsModal } from '../components/SettingsModal';
import { ChatPanel } from '../components/ChatPanel';

export function LobbyScreen() {
  const { state, startGame, leaveRoom } = useRoom();
  const [settingsOpen, setSettingsOpen] = useState(false);
  if (!state) return null;
  const me = state.players.find((p) => p.id === state.myPlayerId);
  const canStart = me?.isHost && state.players.length >= 2 && state.players.length <= 6;

  return (
    <div className="lobby-screen">
      {me?.isHost && (
        <button
          type="button"
          className="settings-gear"
          onClick={() => setSettingsOpen(true)}
          aria-label="Réglages de la partie"
        >
          ⚙️
        </button>
      )}
      <h1>
        Salle <span className="room-code">{state.roomCode}</span>
      </h1>
      <p>Partagez ce code à vos complices (2 à 6 joueurs).</p>
      <ul className="player-list">
        {state.players.map((p) => (
          <li key={p.id} className={p.connected ? '' : 'player-disconnected'}>
            {p.name} {p.isHost ? '👑' : ''} {!p.connected ? '(déconnecté)' : ''}
          </li>
        ))}
      </ul>
      <RoomSettingsPanel />
      {me?.isHost ? (
        <button type="button" disabled={!canStart} onClick={startGame}>
          {state.players.length < 2 ? 'Il faut au moins 2 joueurs' : 'Démarrer le braquage'}
        </button>
      ) : (
        <p>En attente que l'hôte démarre la partie…</p>
      )}
      <button type="button" className="leave-button" onClick={leaveRoom}>
        Quitter
      </button>
      <ChatPanel />
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
