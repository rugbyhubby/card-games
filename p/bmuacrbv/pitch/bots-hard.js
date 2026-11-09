// Pitch computer player, Hard level.
//
// No peeking: it only uses its own cards, every card played this hand, the
// bids, and who has shown they're out of a suit. Easy and Medium are in bots.js.
import { SUITS, makeDeck } from '../../../shared/deck.js';
import { RANK, MOON, team, partnerOf, nextP, gameValue, legalCards, power, trickWinner, WIN_AT } from './rules.js';
import { estimate, bestSuit } from './bots.js';

// Adjustable numbers, tuned with the simulator (tools/simulate.sh --game pitch --us hard --them medium).
export const TUNE = {
  partnerHelp: 0.7,     // points a partner usually adds (often Game). Medium assumes 0.35;
                        // 0.7 won most often in testing (0.6 and 0.8 slightly less).
  partnerBidBonus: 0.3, // extra per point partner bid
  dealerBonus: 0.15,    // dealer bids last and knows what everyone did
  setRisk: 0.2,         // be a bit braver when the other team is close to winning
  moonAt: 4.6,          // estimated points needed to shoot the moon
  stakeToTrump: 3       // Game value (or a jack) in a trick worth trumping for
};

const ALL = makeDeck();

// ---------- card memory ----------

function memory(S, p) {
  const t = S.trump;
  const known = new Set(S.hands[p].map(c => c.id));
  for (const h of S.history) known.add(h.card.id);
  const unseen = ALL.filter(c => !known.has(c.id));          // in someone else's hand, or never dealt
  // Didn't follow suit = out of that suit. Trump led and no trump played = out of trump.
  const out = [0, 1, 2, 3].map(() => new Set());
  for (const h of S.history) if (h.card.s !== h.led) out[h.p].add(h.led);
  const could = q => unseen.filter(c => !out[q].has(c.s));
  return { unseen, out, could };
}

// Could seat q beat card c (in a trick where `led` was led)?
function threatens(S, mem, q, c, led) {
  const t = S.trump, pc = power(c, t, led);
  return mem.could(q).some(x => power(x, t, led) > pc && (x.s === t || x.s === led));
}

function playersAfter(S, p) {
  const out = []; let q = p;
  while (out.length < 3 - S.trick.length) { q = nextP(q); out.push(q); }
  return out;
}

// Lower is cheaper to give away. Keeps trumps, the jack, 10s and sure winners.
function value(S, mem, c) {
  const t = S.trump;
  if (c.s === t) return 60 + RANK[c.r] + (c.r === 'J' ? 40 : 0) - (RANK[c.r] <= 1 ? 25 : 0);   // a 2 or 3 of trump is cheap: Low goes to whoever plays it
  const boss = !mem.unseen.some(x => x.s === c.s && RANK[x.r] > RANK[c.r]);
  return RANK[c.r] + gameValue(c) * 2 + (boss ? 15 : 0);
}
const cheapest = (S, mem, cards) => cards.slice().sort((a, b) => value(S, mem, a) - value(S, mem, b))[0];

// ---------- bidding ----------

export function bid(S, p, level, options) {
  let { value: v } = bestSuit(S.hands[p]);
  v += TUNE.partnerHelp;
  const pb = S.bidder === partnerOf(p) ? S.bid : 0;
  if (pb) v += TUNE.partnerBidBonus * (pb - 1);
  if (p === S.dealer) v += TUNE.dealerBonus;
  const them = S.score[1 - team(p)];
  if (them >= WIN_AT - 5) v += TUNE.setRisk;
  if (options.includes(MOON) && v >= TUNE.moonAt) return MOON;
  // Partner already holds the bid: only go over it with real extra strength.
  if (pb && v < pb + 1.2) return 0;
  const want = Math.floor(v);
  const ok = options.filter(b => b !== MOON && b <= want);
  return ok.length ? ok[0] : 0;
}

// ---------- play ----------

export function playCard(S, p) {
  const t = S.trump;
  const L = legalCards(S.hands[p], S.trick, t);
  if (L.length === 1) return L[0];
  if (!t) {                                               // first card sets trump: lead our best suit's top card
    const { suit } = bestSuit(S.hands[p]);
    return L.filter(c => c.s === suit).sort((a, b) => RANK[b.r] - RANK[a.r])[0];
  }
  const mem = memory(S, p);
  return S.trick.length ? follow(S, p, L, mem) : lead(S, p, L, mem);
}

function lead(S, p, L, mem) {
  const t = S.trump;
  const opps = [nextP(p), nextP(nextP(nextP(p)))];
  const trumps = L.filter(c => c.s === t).sort((a, b) => RANK[b.r] - RANK[a.r]);
  const offs = L.filter(c => c.s !== t);
  const sure = c => opps.every(q => !threatens(S, mem, q, c, c.s));
  const oppTrump = opps.some(q => mem.could(q).some(c => c.s === t));

  // A trump nobody can beat: lead it while opponents may still have trump
  // (draws their trumps, and may catch the jack).
  if (trumps.length && sure(trumps[0]) && oppTrump && trumps[0].r !== 'J') return trumps[0];
  // Off-suit cards nobody can beat (opponents out of trump or can't top it).
  const sureOff = offs.filter(sure).sort((a, b) => gameValue(b) - gameValue(a));
  if (sureOff.length) return sureOff[0];
  // We bid and hold the jack: clear the way with other high trumps first.
  const iHaveJack = trumps.some(c => c.r === 'J');
  if (team(S.bidder) === team(p) && iHaveJack && oppTrump && trumps[0].r !== 'J') return trumps[0];
  // Aces where opponents aren't known to be out of the suit.
  const aces = offs.filter(c => c.r === 'A' && opps.every(q => !mem.out[q].has(c.s)));
  if (aces.length) return aces[0];
  // Otherwise something cheap that isn't a 10 or the jack.
  const plain = L.filter(c => c.r !== '10' && !(c.s === t && c.r === 'J'));
  const offPlain = plain.filter(c => c.s !== t);
  if (offPlain.length) return cheapest(S, mem, offPlain);
  if (plain.length) return cheapest(S, mem, plain);
  return cheapest(S, mem, L);
}

function follow(S, p, L, mem) {
  const t = S.trump;
  const led = S.trick[0].card.s;
  const w = trickWinner(S.trick, t);
  const after = playersAfter(S, p);
  const oppAfter = after.filter(q => team(q) !== team(p));
  const holds = c => oppAfter.every(q => !threatens(S, mem, q, c, led));
  const winners = L.filter(c => power(c, t, led) > w.pw).sort((a, b) => power(a, t, led) - power(b, t, led));
  const stake = S.trick.reduce((s, e) => s + gameValue(e.card), 0) + (S.trick.some(e => e.card.s === t && e.card.r === 'J') ? 10 : 0);

  // Partner is winning.
  if (team(w.p) === team(p)) {
    const under = L.filter(c => power(c, t, led) <= w.pw);
    if (holds(w.card)) {
      // Their trick is safe: hand over points (the jack, 10s, aces…) without taking it.
      const pool = under.length ? under : L;
      const jack = pool.find(c => c.s === t && c.r === 'J');
      if (jack) return jack;
      const gifts = pool.filter(c => gameValue(c) > 0 && c.s !== t).sort((a, b) => gameValue(b) - gameValue(a));
      if (gifts.length) return gifts[0];
      return cheapest(S, mem, pool);
    }
    // Partner may lose it: take over only with a card that will hold, if points are at stake.
    const safe = winners.filter(holds);
    if (safe.length && stake >= TUNE.stakeToTrump) return safe[0];
    return cheapest(S, mem, under.length ? under : L);
  }

  // The other team is winning.
  if (winners.length) {
    const safe = winners.filter(holds);
    const worth = stake >= TUNE.stakeToTrump || !oppAfter.length;
    if (safe.length && (worth || safe[0].s !== t)) {
      // Winning for sure: add our own points to it if we can do it with the same card.
      const pointy = safe.filter(c => gameValue(c) > 0 && c.s !== t);
      if (pointy.length && !oppAfter.length) return pointy.sort((a, b) => gameValue(b) - gameValue(a))[0];
      return safe[0];
    }
    if (!oppAfter.length) return winners[0];               // last to play: cheapest win
    // Not sure to hold, but beating them with the suit led is still usually right.
    const followers = winners.filter(c => c.s === led && c.s !== t);
    if (followers.length) return followers[0];
    if (worth) return winners[0];                          // trump in when the trick is worth it
  }
  // Can't (or won't) win: give away as little as possible.
  const keep = L.filter(c => !(c.s === t && c.r === 'J') && c.r !== '10');
  return cheapest(S, mem, keep.length ? keep : L);
}
