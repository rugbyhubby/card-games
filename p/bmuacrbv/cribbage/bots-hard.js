// Computer player, Hard.
// Discarding: like Medium (best average hand over every possible starter),
// plus what the two discards are usually worth in the crib: added when it's
// its own crib, subtracted when it's yours.
// Pegging: looks one move ahead. It tracks every card it has seen, works out
// what you might hold, and weighs the points it takes now against the points
// your best reply could take (and its own comeback), so it sets traps and
// avoids them (pairs, runs, 15s, 31, and the go).
import { makeDeck } from '../../../shared/deck.js';
import { SETUP, order, value, pegPoints } from './rules.js';
import { keeps, expectedHand } from './bots.js';

// Tuning knobs, checked with the simulator (tools/README.md).
export const TUNE = { crib: 1, reply: 1, comeback: 0.5, goBonus: 0.6, keepLow: 0.04 };

const CRIB = [
  [5.56, 4.38, 4.58, 5.53, 5.75, 4.24, 4.11, 4.11, 4.07, 3.93, 4.19, 3.91, 3.74],
  [4.38, 5.85, 6.82, 4.97, 5.65, 4.33, 4.27, 4.21, 4.14, 4.03, 4.29, 3.94, 3.86],
  [4.58, 6.82, 6.14, 5.45, 6.4, 4.28, 4.37, 4.26, 4.15, 4.19, 4.39, 4.04, 3.89],
  [5.53, 4.97, 5.45, 6.09, 6.95, 4.96, 4.22, 4.34, 4.22, 4.23, 4.33, 3.97, 3.94],
  [5.75, 5.65, 6.4, 6.95, 9.01, 7.11, 6.38, 5.79, 5.75, 7.01, 7.23, 6.94, 6.85],
  [4.24, 4.33, 4.28, 4.96, 7.11, 6.29, 5.53, 4.98, 5.55, 3.81, 4.1, 3.76, 3.62],
  [4.11, 4.27, 4.37, 4.22, 6.38, 5.53, 6.12, 6.71, 4.33, 3.72, 4.01, 3.65, 3.56],
  [4.11, 4.21, 4.26, 4.34, 5.79, 4.98, 6.71, 5.66, 4.98, 4.26, 3.93, 3.64, 3.56],
  [4.07, 4.14, 4.15, 4.22, 5.75, 5.55, 4.33, 4.98, 5.55, 4.81, 4.55, 3.57, 3.49],
  [3.93, 4.03, 4.19, 4.23, 7.01, 3.81, 3.72, 4.26, 4.81, 5.48, 5.09, 4.15, 3.35],
  [4.19, 4.29, 4.39, 4.33, 7.23, 4.1, 4.01, 3.93, 4.55, 5.09, 5.91, 5.04, 4.3],
  [3.91, 3.94, 4.04, 3.97, 6.94, 3.76, 3.65, 3.64, 3.57, 4.15, 5.04, 5.26, 4.02],
  [3.74, 3.86, 3.89, 3.94, 6.85, 3.62, 3.56, 3.56, 3.49, 3.35, 4.3, 4.02, 5.05],
];
const cribValue = (a, b) => CRIB[order(a) - 1][order(b) - 1];

export function discard(S, p) {
  const hand = S.hands[p], keep = hand.length - SETUP[S.n].toCrib;
  const mine = S.dealer === p ? 1 : -1;
  let best = null, bestScore = -Infinity;
  for (const k of keeps(hand, keep)) {
    const kept = new Set(k.map(c => c.id));
    const out = hand.filter(c => !kept.has(c.id));
    let sc = expectedHand(k, hand);
    if (out.length === 2) sc += mine * TUNE.crib * cribValue(out[0], out[1]);
    if (sc > bestScore + 1e-9) { best = out; bestScore = sc; }
  }
  return best;
}

// Cards Hard hasn't seen: not in its hand, not played, not the starter, not its own discards.
function unseen(S, p) {
  const seen = new Set([...S.hands[p], ...S.peg.played.map(e => e.card), ...(S.discarded[p] || []), S.starter].filter(Boolean).map(c => c.id));
  return makeDeck().filter(c => !seen.has(c.id));
}

// Chance that someone holding k of the U unseen cards has at least one of u particular ones.
function chanceHolds(u, U, k) {
  let none = 1;
  for (let i = 0; i < k; i++) none *= Math.max(0, (U - u - i) / (U - i));
  return 1 - none;
}

const best = (seq, count, hand) => {
  let top = 0;
  for (const c of hand) if (count + value(c) <= 31) top = Math.max(top, pegPoints([...seq, c]).pts);
  return top;
};

export function peg(S, p, level, legal) {
  const opp = (p + 1) % S.n;                 // the next player (2-player: the other one)
  const k = S.hands[opp].length;
  const pool = unseen(S, p), U = pool.length;
  // Unseen cards grouped by rank, with how many of each.
  const byRank = new Map();
  for (const c of pool) { const g = byRank.get(c.r) || { card: c, u: 0 }; g.u++; byRank.set(c.r, g); }

  let pick = legal[0], pickScore = -Infinity;
  for (const c of legal) {
    const seq = [...S.peg.seq, c], count = S.peg.count + value(c);
    let sc = pegPoints(seq).pts;
    if (count < 31 && k > 0) {
      // Your possible replies, best first; chance each is the best one you have.
      const rest = S.hands[p].filter(x => x.id !== c.id);
      const replies = [];
      for (const { card: r, u } of byRank.values()) {
        if (count + value(r) > 31) continue;
        const seq2 = [...seq, r];
        replies.push({ pts: pegPoints(seq2).pts, P: chanceHolds(u, U, k), back: best(seq2, count + value(r), rest) });
      }
      replies.sort((a, b) => b.pts - a.pts);
      let notYet = 1, expReply = 0, expBack = 0;
      for (const r of replies) {
        const w = r.P * notYet;
        expReply += w * r.pts; expBack += w * r.back;
        notYet *= 1 - r.P;
      }
      // notYet = chance you can't play at all: a go, likely worth 1 to Hard.
      sc += -TUNE.reply * expReply + TUNE.comeback * expBack + TUNE.goBonus * notYet;
    }
    // Keep low cards for later in the round (they make 31s and dodge gos).
    sc += TUNE.keepLow * value(c);
    if (sc > pickScore) { pick = c; pickScore = sc; }
  }
  return pick;
}
