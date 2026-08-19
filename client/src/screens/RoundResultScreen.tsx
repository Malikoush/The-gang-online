import { useRoom } from '../state/RoomProvider';
import { RoundTracker } from '../components/RoundTracker';
import { ChatPanel } from '../components/ChatPanel';

export function RoundResultScreen() {
  const { state, continueRound, returnToLobby } = useRoom();
  if (!state) return null;
  const me = state.players.find((p) => p.id === state.myPlayerId);
  const outcome = state.lastRoundOutcome;
  const failedPlayerName =
    outcome && outcome.failedAtSeatIndex !== null
      ? state.players.find((p) => p.seatIndex === outcome.failedAtSeatIndex)?.name
      : null;

  return (
    <div className="round-result-screen">
      <RoundTracker />
      <h2>{outcome?.success ? 'Classement réussi !' : 'Classement raté !'}</h2>
      {!outcome?.success && failedPlayerName && (
        <p>La main de {failedPlayerName} a cassé l'ordre des jetons à la river.</p>
      )}
      {me?.isHost ? (
        <div className="round-result-actions">
          <button type="button" onClick={continueRound}>
            Manche suivante
          </button>
          <button type="button" className="leave-button" onClick={returnToLobby}>
            Retour au salon
          </button>
        </div>
      ) : (
        <p>En attente de l'hôte…</p>
      )}
      <ChatPanel />
    </div>
  );
}
