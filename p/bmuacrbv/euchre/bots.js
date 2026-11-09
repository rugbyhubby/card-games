// Euchre computer players. Each function looks at the game and returns a decision;
// game.js carries it out.
//   easy:   random play, rough bidding
//   medium: sensible bidding and play
//   hard:   see bots-hard.js
import { SUITS } from '../../../shared/deck.js';
import { RV, effSuit, power, trumpVal, strength, team, legalCards, trickWinner } from './rules.js';

// Which card to throw away after picking up the turned-up card.
export function discardChoice(hand, t) {
  let best = null, bc = 1e9;
  for (const c of hand) {
    let cost;
    if (effSuit(c, t) === t) cost = 100 + power(c, t, t);
    else {
      cost = c.r === 'A' ? 40 : RV[c.r];
      const same = hand.filter(x => effSuit(x, t) === c.s).length;
      if (same === 1 && c.r !== 'A') cost -= 0.5; // prefer making a void
    }
    if (cost < bc) { bc = cost; best = c; }
  }
  return best;
}

function noise(level) { return level === 'easy' ? (Math.random() * 2.6 - 1.3) : 0; }
function canAlone(level, v) { return level !== 'easy' && v >= 10.5; }

// Round one: order up the turned-up card? Returns { order, alone }.
export function bid1(S, p, level) {
  const t = S.upcard.s; let v;
  if (p === S.dealer) {
    const h = [...S.hands[p], S.upcard]; const d = discardChoice(h, t);
    v = strength(h.filter(c => c !== d), t);
  } else {
    v = strength(S.hands[p], t);
    v += (team(p) === team(S.dealer) ? 0.6 : -0.5) * trumpVal(S.upcard, t);
  }
  const order = v + noise(level) >= 7;
  return { order, alone: order && canAlone(level, v) };
}

// Round two: name a suit, or pass (suit: null). Returns { suit, alone }.
export function bid2(S, p, level) {
  let best = null, bv = -1;
  for (const s of SUITS) { if (s === S.turnedDown) continue; const v = strength(S.hands[p], s); if (v > bv) { bv = v; best = s; } }
  const call = bv + noise(level) >= 7;
  return { suit: call ? best : null, alone: call && canAlone(level, bv) };
}

function cost(c, t) { return effSuit(c, t) === t ? 100 + power(c, t, t) : RV[c.r]; }
function lowest(cards, t) { return cards.slice().sort((a, b) => cost(a, t) - cost(b, t))[0]; }

// Which card to play. `active` is how many players are in this hand (3 if someone is alone).
export function playCard(S, p, level, active) {
  const t = S.trump, L = legalCards(S.hands[p], S.trick, t);
  if (level === 'easy') return L[Math.floor(Math.random() * L.length)];
  if (!S.trick.length) {
    const trumps = L.filter(c => effSuit(c, t) === t).sort((a, b) => power(b, t, t) - power(a, t, t));
    const ours = team(S.maker) === team(p);
    if (trumps.length && ours && (trumps.length >= 2 || power(trumps[0], t, t) === 200)) return trumps[0];
    const aces = L.filter(c => effSuit(c, t) !== t && c.r === 'A');
    if (aces.length) return aces[0];
    const off = L.filter(c => effSuit(c, t) !== t);
    return off.length ? lowest(off, t) : trumps[trumps.length - 1];
  }
  const led = effSuit(S.trick[0].card, t);
  const w = trickWinner(S.trick, t);
  const last = S.trick.length === active - 1;
  if (team(w.p) === team(p) && (last || w.pw >= 100 || w.card.r === 'A')) return lowest(L, t);
  const beaters = L.filter(c => power(c, t, led) > w.pw).sort((a, b) => power(a, t, led) - power(b, t, led));
  if (beaters.length) return beaters[0];
  return lowest(L, t);
}
