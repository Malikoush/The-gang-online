import { useRoom } from '../state/RoomProvider';
import { PlayingCard } from './PlayingCard';

export function CommunityCards() {
  const { state } = useRoom();
  if (!state) return null;
  return (
    <div className="community-cards">
      <div className="section-label">Cartes communes</div>
      <div className="card-row">
        {state.communityCards.length > 0 ? (
          state.communityCards.map((c, i) => <PlayingCard key={i} card={c} />)
        ) : (
          <span className="community-empty">Aucune pour l'instant - pré-flop</span>
        )}
      </div>
    </div>
  );
}
