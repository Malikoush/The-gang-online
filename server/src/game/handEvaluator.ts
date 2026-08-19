import type { Card, HandCategory, HandEvaluation, Rank } from '@thegang/shared';

const CATEGORY_RANK: Record<HandCategory, number> = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  TRIPS: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  QUADS: 7,
  STRAIGHT_FLUSH: 8,
};

const RANK_NAME: Record<number, string> = {
  2: 'Deux', 3: 'Trois', 4: 'Quatre', 5: 'Cinq', 6: 'Six', 7: 'Sept',
  8: 'Huit', 9: 'Neuf', 10: 'Dix', 11: 'Valet', 12: 'Dame', 13: 'Roi', 14: 'As',
};

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [first, ...rest] = items;
  const withFirst = combinations(rest, k - 1).map((combo) => [first, ...combo]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function rankGroups(cards: Card[]): Array<{ rank: number; count: number }> {
  const counts = new Map<number, number>();
  for (const c of cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  return [...counts.entries()]
    .map(([rank, count]) => ({ rank, count }))
    .sort((a, b) => (b.count - a.count) || (b.rank - a.rank));
}

function detectStraight(sortedRanksDesc: number[]): number | null {
  const unique = [...new Set(sortedRanksDesc)];
  if (unique.length < 5) {
    // roue A-5-4-3-2 : l'As compte comme 1 uniquement dans ce cas précis
    if (unique.includes(14) && [2, 3, 4, 5].every((r) => unique.includes(r))) return 5;
    return null;
  }
  for (let i = 0; i <= unique.length - 5; i++) {
    if (unique[i] - unique[i + 4] === 4) return unique[i];
  }
  if (unique.includes(14) && [2, 3, 4, 5].every((r) => unique.includes(r))) return 5;
  return null;
}

/** Évalue un ensemble de 2 à 5 cartes (jamais plus) et renvoie sa meilleure catégorie. */
function evaluateExact(cards: Card[]): HandEvaluation {
  const ranksDesc = [...cards].map((c) => c.rank).sort((a, b) => b - a);
  const groups = rankGroups(cards);
  const isFlush = cards.length === 5 && cards.every((c) => c.suit === cards[0].suit);
  const straightHigh = cards.length === 5 ? detectStraight(ranksDesc) : null;

  let category: HandCategory;
  let tiebreakers: number[];

  if (straightHigh !== null && isFlush) {
    category = 'STRAIGHT_FLUSH';
    tiebreakers = [straightHigh];
  } else if (groups[0].count === 4) {
    category = 'QUADS';
    tiebreakers = [groups[0].rank, groups[1]?.rank ?? 0];
  } else if (groups[0].count === 3 && groups[1]?.count === 2) {
    category = 'FULL_HOUSE';
    tiebreakers = [groups[0].rank, groups[1].rank];
  } else if (isFlush) {
    category = 'FLUSH';
    tiebreakers = ranksDesc;
  } else if (straightHigh !== null) {
    category = 'STRAIGHT';
    tiebreakers = [straightHigh];
  } else if (groups[0].count === 3) {
    category = 'TRIPS';
    const kickers = groups.filter((g) => g.count === 1).map((g) => g.rank);
    tiebreakers = [groups[0].rank, ...kickers];
  } else if (groups[0].count === 2 && groups[1]?.count === 2) {
    const pairs = [groups[0].rank, groups[1].rank].sort((a, b) => b - a);
    const kicker = groups.find((g) => g.count === 1)?.rank ?? 0;
    category = 'TWO_PAIR';
    tiebreakers = [...pairs, kicker];
  } else if (groups[0].count === 2) {
    const kickers = groups.filter((g) => g.count === 1).map((g) => g.rank);
    category = 'PAIR';
    tiebreakers = [groups[0].rank, ...kickers];
  } else {
    category = 'HIGH_CARD';
    tiebreakers = ranksDesc;
  }

  return {
    category,
    categoryRank: CATEGORY_RANK[category],
    tiebreakers,
    bestFive: cards,
    label: buildLabel(category, tiebreakers),
  };
}

function buildLabel(category: HandCategory, tiebreakers: number[]): string {
  const name = (r: number) => RANK_NAME[r] ?? String(r);
  switch (category) {
    case 'STRAIGHT_FLUSH':
      return `Quinte flush au ${name(tiebreakers[0])}`;
    case 'QUADS':
      return `Carré de ${name(tiebreakers[0])}`;
    case 'FULL_HOUSE':
      return `Full, ${name(tiebreakers[0])} par les ${name(tiebreakers[1])}`;
    case 'FLUSH':
      return `Couleur au ${name(tiebreakers[0])}`;
    case 'STRAIGHT':
      return `Quinte au ${name(tiebreakers[0])}`;
    case 'TRIPS':
      return `Brelan de ${name(tiebreakers[0])}`;
    case 'TWO_PAIR':
      return `Deux paires, ${name(tiebreakers[0])} et ${name(tiebreakers[1])}`;
    case 'PAIR':
      return `Paire de ${name(tiebreakers[0])}`;
    case 'HIGH_CARD':
    default:
      return `Hauteur ${name(tiebreakers[0])}`;
  }
}

/**
 * Évalue la meilleure main possible à partir des cartes privées + cartes communes.
 * cards.length vaut 2 (aucune carte commune), 5, 6 ou 7 selon le braquage.
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length <= 2) {
    return evaluateExact(cards);
  }
  const combos = combinations(cards, 5);
  let best: HandEvaluation | null = null;
  for (const combo of combos) {
    const evalCombo = evaluateExact(combo);
    if (!best || compareHands(evalCombo, best) > 0) best = evalCombo;
  }
  return best as HandEvaluation;
}

/** -1 si a < b, 0 si égalité stricte, 1 si a > b */
export function compareHands(a: HandEvaluation, b: HandEvaluation): -1 | 0 | 1 {
  if (a.categoryRank !== b.categoryRank) return a.categoryRank > b.categoryRank ? 1 : -1;
  const len = Math.max(a.tiebreakers.length, b.tiebreakers.length);
  for (let i = 0; i < len; i++) {
    const av = a.tiebreakers[i] ?? 0;
    const bv = b.tiebreakers[i] ?? 0;
    if (av !== bv) return av > bv ? 1 : -1;
  }
  return 0;
}
