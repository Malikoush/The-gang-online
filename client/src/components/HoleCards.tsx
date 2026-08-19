import { useRoom } from '../state/RoomProvider';
import { PlayingCard } from './PlayingCard';

export function HoleCards() {
  const { state } = useRoom();
  if (!state) return null;
  return (
    <div className="hole-cards">
      <div className="section-label">Vos cartes</div>
      <div className="card-row">
        {state.myHoleCards.length > 0
          ? state.myHoleCards.map((c, i) => <PlayingCard key={i} card={c} />)
          : [0, 1].map((i) => <PlayingCard key={i} hidden />)}
      </div>
    </div>
  );
}
