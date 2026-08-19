import { RoomProvider, useRoom } from './state/RoomProvider';
import { HomeScreen } from './screens/HomeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { VotingScreen } from './screens/VotingScreen';
import { RevealScreen } from './screens/RevealScreen';
import { RoundResultScreen } from './screens/RoundResultScreen';

function Game() {
  const { state } = useRoom();
  if (!state) return <HomeScreen />;

  switch (state.phase) {
    case 'LOBBY':
      return <LobbyScreen />;
    case 'DEALING':
    case 'VOTING':
      return <VotingScreen />;
    case 'REVEALING':
      return <RevealScreen />;
    case 'ROUND_RESULT':
      return <RoundResultScreen />;
    default:
      return null;
  }
}

export default function App() {
  return (
    <RoomProvider>
      <div className="app-shell">
        <Game />
      </div>
    </RoomProvider>
  );
}
