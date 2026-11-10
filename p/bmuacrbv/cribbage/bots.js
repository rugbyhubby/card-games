// Computer players, Easy and Medium. (Hard is in bots-hard.js.)
// Each level has two jobs: which cards to give the crib, and which card to peg.
//   discard(S, p, level) -> the cards to put in the crib
//   peg(S, p, level, legal) -> one of the legal cards
import { makeDeck } from '../../../shared/deck.js';
import { SETUP, countHand, pegPoints, value } from './rules.js';

// Every way to keep `keep` cards out of `hand` (e.g. 15 ways to keep 4 of 6).
export function keeps(hand, keep) {
  const out = [];
  const pick = (start, cur) => {
    if (cur.length === keep) { out.push(cur); return; }
    for (let i = start; i < hand.length; i++) pick(i + 1, [...cur, hand[i]]);
  };
  pick(0, []);
  return out;
}

// Average hand score over every starter card the player hasn't seen.
export function expectedHand(kept, seen) {
  const known = new Set(seen.map(c => c.id));
  let total = 0, count = 0;
  for (const st of makeDeck()) {
    if (known.has(st.id)) continue;
    total += countHand(kept, st).total; count++;
  }
  return total / count;
}

// Points for playing `card` now.
export const pointsFor = (S, card) => pegPoints([...S.peg.seq, card]).pts;

// Easy: keep the 4 cards that score best on their own (pairs, 15s, runs).
// Medium: keep the 4 with the best average score once the starter is turned.
export function discard(S, p, level) {
  const hand = S.hands[p], keep = hand.length - SETUP[S.n].toCrib;
  let best = null, bestScore = -1;
  for (const k of keeps(hand, keep)) {
    const sc = level === 'easy' ? countHand(k, null).total : expectedHand(k, hand);
    if (sc > bestScore + 1e-9) { best = k; bestScore = sc; }
  }
  const kept = new Set(best.map(c => c.id));
  return hand.filter(c => !kept.has(c.id));
}

// Easy: the first card it can play.
// Medium: takes points when it can; avoids leaving the count on 5 or 21
// (where a ten-card makes 15 or 31); otherwise plays its highest card,
// but doesn't lead a 5.
export function peg(S, p, level, legal) {
  if (level === 'easy') return legal[0];
  let best = legal[0], bestScore = -Infinity;
  for (const c of legal) {
    const after = S.peg.count + value(c);
    let sc = pointsFor(S, c) * 10;
    if (after === 5 || after === 21) sc -= 15;
    if (S.peg.count === 0 && c.r === '5') sc -= 15;
    sc += value(c) * 0.1;
    if (sc > bestScore) { best = c; bestScore = sc; }
  }
  return best;
}
