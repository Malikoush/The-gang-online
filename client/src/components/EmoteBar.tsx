import { useRoom } from '../state/RoomProvider';
import type { EmoteKind } from '@thegang/shared';

const EMOTES: Array<{ kind: EmoteKind; icon: string; label: string }> = [
  { kind: 'HESITATE', icon: '🤔', label: 'Hésitation' },
  { kind: 'CONFIDENT', icon: '😎', label: 'Confiant' },
  { kind: 'ANNOYED', icon: '😠', label: 'Énervé' },
  { kind: 'THUMBS_DOWN', icon: '👎', label: 'Pouce vers le bas' },
  { kind: 'PANIC', icon: '😱', label: 'Panique' },
  { kind: 'OK', icon: '👍', label: 'OK' },
  { kind: 'NAILS', icon: '💅', label: 'Nonchalant' },
  { kind: 'NO_CROSS', icon: '🙅', label: 'Non' },
];

const EMOJI_BY_KIND: Record<EmoteKind, string> = Object.fromEntries(
  EMOTES.map((e) => [e.kind, e.icon]),
) as Record<EmoteKind, string>;

export function EmoteBar() {
  const { sendEmote, state } = useRoom();
  const disabled = state?.phase !== 'VOTING';
  return (
    <div className="emote-bar">
      {EMOTES.map((e) => (
        <button
          key={e.kind}
          type="button"
          className="emote-button"
          title={e.label}
          disabled={disabled}
          onClick={() => sendEmote(e.kind)}
        >
          {e.icon}
        </button>
      ))}
    </div>
  );
}

export function EmoteToasts() {
  const { emotes } = useRoom();
  return (
    <div className="emote-toasts">
      {emotes.map((e) => (
        <div key={e.id} className="emote-toast">
          <span className="emote-toast-icon">{EMOJI_BY_KIND[e.emote]}</span>
          <span className="emote-toast-name">{e.playerName}</span>
        </div>
      ))}
    </div>
  );
}
