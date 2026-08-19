import { useRoom } from '../state/RoomProvider';

export function ChipBoard() {
  const { state, moveChip } = useRoom();
  if (!state) return null;
  const me = state.players.find((p) => p.id === state.myPlayerId);
  const slots = Array.from({ length: state.players.length }, (_, i) => i + 1);
  const canInteract = state.phase === 'VOTING' && !me?.locked;

  return (
    <div className="chip-board">
      {slots.map((slot) => {
        const occupant = state.players.find((p) => p.chipSlot === slot);
        const isMine = occupant?.id === state.myPlayerId;
        return (
          <button
            key={slot}
            type="button"
            className={`chip-slot ${isMine ? 'chip-slot-mine' : ''} ${occupant ? 'chip-slot-occupied' : ''} ${
              occupant?.locked ? 'chip-slot-locked' : ''
            }`}
            disabled={!canInteract}
            onClick={() => moveChip(slot)}
            title={occupant ? occupant.name : 'Libre'}
          >
            <span className="chip-slot-number">{slot}</span>
            {occupant && (
              <span className="chip-slot-name">
                {occupant.name}
                {occupant.locked ? ' 🔒' : ''}
                {!occupant.connected ? ' ⚡' : ''}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
