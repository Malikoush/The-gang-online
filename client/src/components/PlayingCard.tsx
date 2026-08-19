import type { Card } from '@thegang/shared';

const SUIT_SYMBOL: Record<Card['suit'], string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const RANK_LABEL: Record<number, string> = { 11: 'V', 12: 'D', 13: 'R', 14: 'A' };

export function PlayingCard({ card, hidden }: { card?: Card; hidden?: boolean }) {
  if (hidden || !card) {
    return <div className="card card-hidden" aria-label="carte cachée" />;
  }
  const isRed = card.suit === 'H' || card.suit === 'D';
  const label = RANK_LABEL[card.rank] ?? String(card.rank);
  return (
    <div className={`card ${isRed ? 'card-red' : 'card-black'}`}>
      <span className="card-rank">{label}</span>
      <span className="card-suit">{SUIT_SYMBOL[card.suit]}</span>
    </div>
  );
}
