import { useRoom } from '../state/RoomProvider';
import { PlayingCard } from '../components/PlayingCard';
import { CommunityCards } from '../components/CommunityCards';
import { RoundTracker } from '../components/RoundTracker';

export function RevealScreen() {
  const { state } = useRoom();
  if (!state) return null;
  const totalSlots = state.players.length;
  const revealed = state.revealSequence;

  return (
    <div className="reveal-screen">
      <RoundTracker />
      <h2>Révélation de la river…</h2>
      <CommunityCards />
      <div className="reveal-list">
        {Array.from({ length: totalSlots }, (_, i) => i + 1).map((slot) => {
          const step = revealed.find((r) => r.chipSlot === slot);
          return (
            <div
              key={slot}
              className={`reveal-row ${step ? (step.passed ? 'reveal-pass' : 'reveal-fail') : 'reveal-pending'}`}
            >
              <span className="reveal-slot">#{slot}</span>
              {step ? (
                <>
                  <span className="reveal-name">{step.playerName}</span>
                  <div className="card-row reveal-cards">
                    {step.hand.bestFive.map((c, i) => (
                      <PlayingCard key={i} card={c} />
                    ))}
                  </div>
                  <span className="reveal-label">{step.hand.label}</span>
                  <span className="reveal-icon">{step.passed ? '✅' : '❌'}</span>
                </>
              ) : (
                <span className="reveal-waiting">en attente…</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
