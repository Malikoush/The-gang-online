import { useRoom } from '../state/RoomProvider';

const RESPONSE_TIME_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'unlimited', label: 'Illimité' },
  { value: '30', label: '30 secondes' },
  { value: '45', label: '45 secondes' },
  { value: '60', label: '60 secondes' },
  { value: '90', label: '90 secondes' },
  { value: '120', label: '2 minutes' },
];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { state, updateSettings } = useRoom();
  if (!state) return null;
  const { chatEnabled, responseTimeSeconds } = state.settings;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Réglages de la partie</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={chatEnabled}
            onChange={(e) => updateSettings({ chatEnabled: e.target.checked, responseTimeSeconds })}
          />
          Autoriser le chat pendant les manches
        </label>
        <label className="settings-select">
          Temps de réponse
          <select
            value={responseTimeSeconds === null ? 'unlimited' : String(responseTimeSeconds)}
            onChange={(e) => {
              const value = e.target.value;
              updateSettings({ chatEnabled, responseTimeSeconds: value === 'unlimited' ? null : Number(value) });
            }}
          >
            {RESPONSE_TIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
