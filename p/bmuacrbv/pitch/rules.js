// Pitch card rules (4-point: High, Low, Jack, Game).
//   - 52 cards, 6 each, two teams of two.
//   - Follow the suit led if you can, but you may play trump at any time.
//   - Highest trump wins the trick, otherwise the highest card of the suit led.
import { STANDARD_RANKS } from '../../../shared/deck.js';

export const NAMES = ['You', 'West', 'Partner', 'East'];
export const team = p => p % 2;
export const nextP = p => (p + 1) % 4;
export const partnerOf = p => (p + 2) % 4;

export const RANK = Object.fromEntries(STANDARD_RANKS.map((r, i) => [r, i]));   // 2 = 0 … A = 12
export const GAME_VALUE = { '10': 10, A: 4, K: 3, Q: 2, J: 1 };              // for the Game point
export const gameValue = c => GAME_VALUE[c.r] || 0;

export const MOON = 5;                                                   // "Shoot the moon" as a bid number
export const BIDS = [2, 3, 4, MOON];
export const bidName = b => b === MOON ? 'Shoot the moon' : String(b);
export const bidShort = b => b === MOON ? 'Moon' : String(b);
export const WIN_AT = 21;

// Cards this hand may play.
export function legalCards(hand, trick, trump) {
  if (!trick.length) return hand;
  const led = trick[0].card.s;
  if (!hand.some(c => c.s === led)) return hand;                         // out of the led suit: anything
  return hand.filter(c => c.s === led || c.s === trump);                 // follow suit, or trump
}

// How strong a card is in a trick (higher wins); -1 = can't win.
export function power(c, trump, led) {
  if (c.s === trump) return 100 + RANK[c.r];
  if (c.s === led) return RANK[c.r];
  return -1;
}

// Who is winning the trick so far: { p, card, pw }.
export function trickWinner(trick, trump) {
  const led = trick[0].card.s;
  let best = null;
  for (const e of trick) { const pw = power(e.card, trump, led); if (!best || pw > best.pw) best = { ...e, pw }; }
  return best;
}

// The four points for a finished hand.
//   played: every { p, card } played this hand
//   won:    [cards won by team 0, cards won by team 1]
// Returns { high, low, jack, game } each { team, ... } or null if nobody gets it,
// plus counts: how many points each team got.
export function scoreHand(played, won, trump) {
  const trumps = played.filter(e => e.card.s === trump);
  const byRank = (a, b) => RANK[a.card.r] - RANK[b.card.r];
  const hi = trumps.slice().sort(byRank).pop();
  const lo = trumps.slice().sort(byRank)[0];
  const high = { team: team(hi.p), p: hi.p, card: hi.card };
  const low = { team: team(lo.p), p: lo.p, card: lo.card };                    // to whoever played it
  const jackPlay = trumps.find(e => e.card.r === 'J');
  let jack = null;
  if (jackPlay) {
    const t = won[0].some(c => c.id === jackPlay.card.id) ? 0 : 1;            // to whoever won it
    jack = { team: t, p: jackPlay.p, card: jackPlay.card };
  }
  const count = won.map(cards => cards.reduce((s, c) => s + gameValue(c), 0));
  const game = count[0] === count[1] ? null : { team: count[0] > count[1] ? 0 : 1 };
  const points = [0, 0];
  for (const pt of [high, low, jack, game]) if (pt) points[pt.team]++;
  return { high, low, jack, game, count, points, available: 2 + (jack ? 1 : 0) + 1 };
}
