import { useState, type FormEvent } from 'react';
import { useRoom } from '../state/RoomProvider';

function joinErrorLabel(code: string): string {
  switch (code) {
    case 'ROOM_NOT_FOUND':
      return "Cette salle n'existe pas.";
    case 'ROOM_FULL':
      return 'La salle est complète (6 joueurs max).';
    case 'NAME_TAKEN':
      return 'Ce nom est déjà pris dans cette salle.';
    case 'GAME_IN_PROGRESS':
      return 'La partie a déjà commencé.';
    default:
      return 'Impossible de rejoindre la salle.';
  }
}

export function HomeScreen() {
  const { createRoom, joinRoom, joinError, connected } = useRoom();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    if (mode === 'create') createRoom(name);
    else joinRoom(roomCode, name);
  }

  return (
    <div className="home-screen">
      <h1>The Gang</h1>
      <p className="subtitle">
        On avait dit 4 manche pas plus ...
      </p>
      <div className="mode-toggle">
        <button type="button" className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>
          Créer une partie
        </button>
        <button type="button" className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>
          Rejoindre
        </button>
      </div>
      <form onSubmit={handleSubmit} className="home-form">
        <label>
          Votre nom
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} required />
        </label>
        {mode === 'join' && (
          <label>
            Code de la salle
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={4}
              required
            />
          </label>
        )}
        <button type="submit" disabled={!connected}>
          {mode === 'create' ? 'Créer' : 'Rejoindre'}
        </button>
      </form>
      {!connected && <p className="error">Connexion au serveur…</p>}
      {joinError && <p className="error">{joinErrorLabel(joinError)}</p>}
    </div>
  );
}
