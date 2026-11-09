// Euchre's card rules: the 24-card deck, trump, bowers and who wins a trick.
import { SUITS } from '../../../shared/deck.js';

export const RANKS = ['9', '10', 'J', 'Q', 'K', 'A'];
export const RV = { '9': 1, '10': 2, 'J': 3, 'Q': 4, 'K': 5, 'A': 6 };
export const NAMES = ['You', 'West', 'Partner', 'East'];

// Seats: 0 = you, 1 = West, 2 = Partner, 3 = East. Teams: you + Partner, West + East.
export const sister = s => ({ S: 'C', C: 'S', H: 'D', D: 'H' })[s];
export const team = p => p % 2;
export const nextP = p => (p + 1) % 4;
export const partnerOf = p => (p + 2) % 4;

// The suit a card counts as: the left bower counts as trump.
export function effSuit(c, t) { return (t && c.r === 'J' && c.s === sister(t)) ? t : c.s; }

// How strong a card is in a trick (higher wins). 0 = can't win.
export function power(c, t, led) {
  if (t) {
    if (c.r === 'J' && c.s === t) return 200;
    if (c.r === 'J' && c.s === sister(t)) return 190;
    if (c.s === t) return 100 + RV[c.r];
  }
  if (led && effSuit(c, t) === led) return 10 + RV[c.r];
  return 0;
}

export function trumpVal(c, t) {
  if (c.r === 'J' && c.s === t) return 3;
  if (c.r === 'J' && c.s === sister(t)) return 2.5;
  return { A: 2, K: 1.6, Q: 1.3, '10': 1.1, '9': 1 }[c.r];
}

// How good is this hand if suit t were trump? (~7 = worth calling)
export function strength(hand, t) {
  let v = 0;
  const nT = hand.filter(c => effSuit(c, t) === t).length;
  for (const c of hand) {
    if (effSuit(c, t) === t) v += trumpVal(c, t);
    else if (c.r === 'A') v += 1;
  }
  if (nT >= 2) for (const s of SUITS) if (s !== t && !hand.some(c => effSuit(c, t) === s)) v += 0.5;
  return v;
}

// Cards this hand may play: must follow the suit led if it can.
export function legalCards(hand, trick, t) {
  if (!trick.length) return hand;
  const led = effSuit(trick[0].card, t);
  const f = hand.filter(c => effSuit(c, t) === led);
  return f.length ? f : hand;
}

// Who is winning the trick so far: { p, card, pw }.
export function trickWinner(trick, t) {
  const led = effSuit(trick[0].card, t);
  let best = null;
  for (const e of trick) { const pw = power(e.card, t, led); if (!best || pw > best.pw) best = { ...e, pw }; }
  return best;
}
