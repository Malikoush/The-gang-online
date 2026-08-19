import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Card } from '@thegang/shared';
import { evaluateHand, compareHands } from './handEvaluator.js';

const c = (spec: string): Card => {
  const rankChar = spec.slice(0, -1);
  const suit = spec.slice(-1) as Card['suit'];
  const rankMap: Record<string, number> = { T: 10, J: 11, Q: 12, K: 13, A: 14 };
  const rank = (rankMap[rankChar] ?? Number(rankChar)) as Card['rank'];
  return { rank, suit };
};
const cards = (specs: string): Card[] => specs.split(' ').map(c);

test('paire simple sur 2 cartes seulement', () => {
  const hand = evaluateHand(cards('KS KH'));
  assert.equal(hand.category, 'PAIR');
});

test('hauteur sur 2 cartes dépareillées', () => {
  const hand = evaluateHand(cards('KS 7H'));
  assert.equal(hand.category, 'HIGH_CARD');
  assert.deepEqual(hand.tiebreakers, [13, 7]);
});

test('détecte une couleur', () => {
  const hand = evaluateHand(cards('2H 5H 9H JH KH 3S 4D'));
  assert.equal(hand.category, 'FLUSH');
});

test('détecte une quinte normale', () => {
  const hand = evaluateHand(cards('5H 6D 7S 8C 9H 2S 3D'));
  assert.equal(hand.category, 'STRAIGHT');
  assert.equal(hand.tiebreakers[0], 9);
});

test('détecte la quinte "roue" A-2-3-4-5', () => {
  const hand = evaluateHand(cards('AH 2D 3S 4C 5H 9S KD'));
  assert.equal(hand.category, 'STRAIGHT');
  assert.equal(hand.tiebreakers[0], 5);
});

test('détecte une quinte flush', () => {
  const hand = evaluateHand(cards('5H 6H 7H 8H 9H 2S 3D'));
  assert.equal(hand.category, 'STRAIGHT_FLUSH');
});

test('full house prioritaire sur couleur/quinte', () => {
  const hand = evaluateHand(cards('KH KD KS 9H 9D 2C 3C'));
  assert.equal(hand.category, 'FULL_HOUSE');
  assert.deepEqual(hand.tiebreakers, [13, 9]);
});

test('carré détecté avec kicker', () => {
  const hand = evaluateHand(cards('9H 9D 9S 9C KH 2C 3C'));
  assert.equal(hand.category, 'QUADS');
  assert.equal(hand.tiebreakers[0], 9);
  assert.equal(hand.tiebreakers[1], 13);
});

test('deux paires avec meilleur kicker choisi parmi 7 cartes', () => {
  const hand = evaluateHand(cards('KH KD 9S 9C 2H 3D AC'));
  assert.equal(hand.category, 'TWO_PAIR');
  assert.deepEqual(hand.tiebreakers, [13, 9, 14]);
});

test('compareHands ordonne correctement deux mains différentes', () => {
  const weak = evaluateHand(cards('2H 7D'));
  const strong = evaluateHand(cards('AH AD'));
  assert.equal(compareHands(weak, strong), -1);
  assert.equal(compareHands(strong, weak), 1);
});

test('compareHands renvoie 0 pour deux mains de force strictement égale', () => {
  const a = evaluateHand(cards('KH QD'));
  const b = evaluateHand(cards('KS QC'));
  assert.equal(compareHands(a, b), 0);
});
