import { useRoom } from '../state/RoomProvider';

/** Historique discret des dernières manches (le titre "Manche N — Street" est déjà porté par l'écran lui-même). */
export function RoundTracker() {
  const { state } = useRoom();
  if (!state || state.roundHistory.length === 0) return null;
  return (
    <div className="round-tracker-history">
      {state.roundHistory.map((h) => (
        <span key={h.round} className={h.success ? 'round-success' : 'round-fail'} title={`Manche ${h.round}`}>
          {h.success ? 'Suuu, allez encore une petite  ' : 'Tu va rester sur un défaite ?'}
        </span>
      ))}
    </div>
  );
}
