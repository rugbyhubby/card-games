// Pitch computer players, Easy and Medium. Each function looks at the game and
// returns a decision; game.js carries it out. Hard is in bots-hard.js.
//   easy:   rough bidding, random play
//   medium: sensible bidding and play; never beats a partner who is winning
//           the trick if it has another card it can play
import { SUITS } from '../../../shared/deck.js';
import { RANK, MOON, team, partnerOf, gameValue, legalCards, power, trickWinner } from './rules.js';

// Roughly how many of the four points this hand would take with suit s as trump.
export function estimate(hand, s) {
  const trumps = hand.filter(c => c.s === s);
  const has = r => trumps.some(c => c.r === r);
  let v = 0;
  // High
  if (has('A')) v += 1; else if (has('K')) v += 0.55; else if (has('Q')) v += 0.25;
  // Low (goes to whoever plays it)
  if (has('2')) v += 1; else if (has('3')) v += 0.6; else if (has('4')) v += 0.35;
  // Jack: safer with higher trumps or more trumps to back it up
  if (has('J')) v += (has('A') || has('K') || trumps.length >= 3) ? 0.8 : 0.45;
  // Game: long trumps and high cards win the tricks with 10s in them
  const tens = hand.filter(c => c.r === '10').length;
  const aces = hand.filter(c => c.r === 'A').length;
  v += Math.min(0.9, 0.12 * trumps.length + 0.15 * tens + 0.08 * aces);
  return v;
}

// The suit this hand would like as trump, and how good it is.
export function bestSuit(hand) {
  let best = null, bv = -1;
  for (const s of SUITS) { const v = estimate(hand, s); if (v > bv) { bv = v; best = s; } }
  return { suit: best, value: bv };
}

// Bid: one of `options` (amounts above the current bid, or matching it for the dealer), or 0 to pass.
export function bid(S, p, level, options) {
  if (S.bidder === partnerOf(p)) options = options.filter(b => b > S.bid);   // never take the bid from partner
  let { value } = bestSuit(S.hands[p]);
  if (level === 'easy') value += Math.random() * 2 - 1;
  value += 0.35;                                        // a partner usually chips in (often the Game point)
  const want = Math.floor(value);
  const ok = options.filter(b => b !== MOON && b <= want);
  return ok.length ? ok[0] : 0;                         // the lowest bid that's enough
}

// Lower is cheaper to give away.
function value(c, trump) {
  if (c.s === trump) return 50 + RANK[c.r] + (c.r === 'J' ? 30 : 0);
  return RANK[c.r] + gameValue(c) * 1.5;
}
const cheapest = (cards, trump) => cards.slice().sort((a, b) => value(a, trump) - value(b, trump))[0];

export function playCard(S, p, level) {
  const t = S.trump;
  const L = legalCards(S.hands[p], S.trick, t);
  if (level === 'easy') return L[Math.floor(Math.random() * L.length)];

  // First card of the hand: lead the best card of the suit we want as trump.
  if (!t) {
    const { suit } = bestSuit(S.hands[p]);
    return L.filter(c => c.s === suit).sort((a, b) => RANK[b.r] - RANK[a.r])[0];
  }

  if (!S.trick.length) {
    const trumps = L.filter(c => c.s === t).sort((a, b) => RANK[b.r] - RANK[a.r]);
    const offs = L.filter(c => c.s !== t);
    // Our team bid: keep drawing trump with big ones.
    if (team(S.bidder) === team(p) && trumps.length && (trumps[0].r === 'A' || trumps[0].r === 'K')) return trumps[0];
    const aces = offs.filter(c => c.r === 'A');
    if (aces.length) return aces[0];
    const safe = offs.filter(c => c.r !== '10');
    if (safe.length) return cheapest(safe, t);
    return cheapest(L, t);
  }

  const led = S.trick[0].card.s;
  const w = trickWinner(S.trick, t);
  const last = S.trick.length === 3;

  // Partner is winning: don't take it from them if any card avoids that.
  if (team(w.p) === team(p)) {
    const under = L.filter(c => power(c, t, led) <= w.pw);
    const pool = under.length ? under : L;
    if (last) {                                           // safe: give partner our Game points
      const gifts = pool.filter(c => c.s !== t && gameValue(c) > 0).sort((a, b) => gameValue(b) - gameValue(a));
      if (gifts.length) return gifts[0];
    }
    return cheapest(pool, t);
  }

  // The other team is winning.
  const winners = L.filter(c => power(c, t, led) > w.pw).sort((a, b) => power(a, t, led) - power(b, t, led));
  const atStake = S.trick.reduce((s, e) => s + gameValue(e.card), 0) + (S.trick.some(e => e.card.s === t && e.card.r === 'J') ? 20 : 0);
  if (winners.length) {
    const followers = winners.filter(c => c.s === led && c.s !== t);
    if (followers.length) return followers[0];           // win with the suit led if we can
    if (last || atStake >= 4) return winners[0];          // trump in when it's worth it
  }
  // Can't (or won't) win: give away as little as possible.
  const keep = L.filter(c => !(c.s === t && c.r === 'J') && c.r !== '10');
  return cheapest(keep.length ? keep : L, t);
}
