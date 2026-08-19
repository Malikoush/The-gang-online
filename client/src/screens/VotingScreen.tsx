import { useEffect, useState } from 'react';
import { useRoom } from '../state/RoomProvider';
import { HoleCards } from '../components/HoleCards';
import { CommunityCards } from '../components/CommunityCards';
import { ChipBoard } from '../components/ChipBoard';
import { EmoteBar, EmoteToasts } from '../components/EmoteBar';
import { ChatPanel } from '../components/ChatPanel';
import { STREET_LABEL } from '../util/streetLabel';

function CountdownBanner({ deadline }: { deadline: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000));
  return <div className="countdown-banner">⏱ Prochaine étape dans {secondsLeft}s…</div>;
}

export function VotingScreen() {
  const { state, toggleLock } = useRoom();
  if (!state) return null;
  const me = state.players.find((p) => p.id === state.myPlayerId);

  return (
    <div className="voting-screen">
      <h2>
        Manche {state.roundNumber} - {STREET_LABEL[state.street]}
      </h2>
      {state.lockCountdownDeadline && <CountdownBanner deadline={state.lockCountdownDeadline} />}
      <CommunityCards />
      <HoleCards />
      <div className="voting-lower">
        <ChipBoard />
        <button
          type="button"
          className={`lock-button ${me?.locked ? 'locked' : ''}`}
          onClick={toggleLock}
          disabled={me?.chipSlot === null && !me?.locked}
        >
          {me?.locked ? 'Déverrouiller' : 'Verrouiller mon jeton'}
        </button>
        <EmoteBar />
        {state.settings.chatEnabled && <ChatPanel />}
      </div>
      <EmoteToasts />
    </div>
  );
}
