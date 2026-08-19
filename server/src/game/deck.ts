import { randomInt } from 'node:crypto';
import type { Card, Rank, Suit } from '@thegang/shared';

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export function buildShuffledDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  // Fisher-Yates avec RNG cryptographiquement sûr (évite tout biais/prédictibilité de Math.random)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function drawCards(deck: Card[], count: number): Card[] {
  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    const card = deck.pop();
    if (!card) throw new Error('Deck épuisé');
    drawn.push(card);
  }
  return drawn;
}
