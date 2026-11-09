// Euchre computer player, Hard level.
//
// Same rules as everyone else, and no peeking: it only uses what a careful
// player at the table would know, namely its own cards, every card played
// this hand, the turned-up card, and who has shown they're out of a suit.
//
// Easy and Medium are in bots.js and are not affected by this file.
import { SUITS, makeDeck } from '../../../shared/deck.js';
import { RANKS, RV, sister, team, nextP, partnerOf, effSuit, power, trumpVal, strength, legalCards, trickWinner } from './rules.js';
import { discardChoice } from './bots.js';

// Adjustable numbers, tuned with the simulator (tools/simulate.sh --us hard --them medium).
export const TUNE = {
  callAt: 5.5,          // hand strength needed to call trump. Medium needs 7; calling bolder
                        // won both against Medium and against Hard copies calling at 6 or 6.5.
  partnerUp: 0.6,       // round 1: bonus × turned-up card when it goes to our dealer
  oppUp: 0.5,           // round 1: penalty × turned-up card when it goes to their dealer
  firstSeat: 0.3,       // bonus for the player left of the dealer (gets the first lead)
  nextBonus: 0.8,       // round 2, left of dealer: "next" (same color as the turned-down suit)
  closeCaution: 0.6,    // extra strength needed when the other team is 8+ (a euchre would end it)
  closeEager: 0.3,      // a little less needed when we're 8+ and they're not close
  aloneAt: 4.3,         // estimated sure tricks needed to go alone
  voidGuess: 1          // if an opponent could hold at most this many cards of the led suit, assume they may be out of it
};

const ALL = makeDeck(RANKS);
const isTrump = (c, t) => effSuit(c, t) === t;

// ---------- card memory ----------

// What seat p knows about where the cards are.
function memory(S, p) {
  const t = S.trump;
  const known = new Set(S.hands[p].map(c => c.id));
  for (const h of S.history) known.add(h.card.id);
  if (S.discard && S.discard.p === p) known.add(S.discard.card.id);
  if (S.turnedDown) known.add(S.upcard.id);                       // turned down: out of play
  const upWithDealer = S.upcardTaken && S.dealer !== p && !known.has(S.upcard.id);
  if (upWithDealer) known.add(S.upcard.id);                       // we know who holds it
  const unseen = ALL.filter(c => !known.has(c.id));

  // Didn't follow suit = out of that suit for the rest of the hand.
  const out = [0, 1, 2, 3].map(() => new Set());
  for (const h of S.history) if (effSuit(h.card, t) !== h.led) out[h.p].add(h.led);

  // Cards seat q might still hold.
  const could = q => {
    const list = unseen.filter(c => !out[q].has(effSuit(c, t)));
    if (upWithDealer && q === S.dealer) list.push(S.upcard);
    return list;
  };
  return { out, could, unseen };
}

// Could seat q beat card c in a trick where `led` was led?
function threatens(S, mem, q, c, led) {
  const t = S.trump, pc = power(c, t, led);
  const cards = mem.could(q);
  const ledLeft = cards.filter(x => effSuit(x, t) === led).length;
  for (const x of cards) {
    if (power(x, t, led) <= pc) continue;
    const xs = effSuit(x, t);
    if (xs === led) return true;                                  // a higher card of the same suit
    if (xs === t && (mem.out[q].has(led) || ledLeft <= TUNE.voidGuess)) return true;  // a trump, if out of the led suit
  }
  return false;
}

// Seats still to play in this trick after p, in order.
function playersAfter(S, p) {
  const active = S.sitter == null ? 4 : 3;
  const out = [];
  let q = p;
  while (out.length < active - S.trick.length - 1) { q = nextP(q); if (q !== S.sitter) out.push(q); }
  return out;
}

// Which card to give up: lowest value, keeping trumps and sure winners, and
// preferring to empty a short suit (so we can trump it later).
function dump(S, mem, p, cards) {
  const t = S.trump, hand = S.hands[p];
  const value = c => {
    if (isTrump(c, t)) return 100 + power(c, t, t);
    const s = c.s;
    const higherOut = mem.unseen.some(x => effSuit(x, t) === s && RV[x.r] > RV[c.r]);
    let v = RV[c.r] + (higherOut ? 0 : 10);                       // keep the best card left in a suit
    if (hand.filter(x => effSuit(x, t) === s).length === 1 && higherOut) v -= 0.5;
    return v;
  };
  return cards.slice().sort((a, b) => value(a) - value(b))[0];
}

// ---------- bidding ----------

function threshold(S, p) {
  const us = S.score[team(p)], them = S.score[1 - team(p)];
  let thr = TUNE.callAt;
  if (them >= 8) thr += TUNE.closeCaution;
  else if (them >= 6) thr += TUNE.closeCaution / 2;
  if (us >= 8 && them < 6) thr -= TUNE.closeEager;
  return thr;
}

// Rough count of tricks this hand would take alone with t as trump.
function soloTricks(hand, t) {
  const trumps = hand.filter(c => isTrump(c, t)).sort((a, b) => power(b, t, t) - power(a, t, t));
  const order = [200, 190, 106, 105, 104, 103, 102, 101].filter(x => x !== 103); // R, L, A, K, Q, 10, 9 (J of trump is the right)
  let run = 0;                                                    // trumps from the top with no gaps
  for (const c of trumps) { if (power(c, t, t) === order[run]) run++; else break; }
  const rest = trumps.length - run;
  const aces = hand.filter(c => !isTrump(c, t) && c.r === 'A').length;
  const voids = SUITS.filter(s => s !== t && !hand.some(c => effSuit(c, t) === s)).length;
  return run + rest * 0.7 + aces * 0.8 + (trumps.length >= 3 ? voids * 0.2 : 0);
}

export function bid1(S, p) {
  const t = S.upcard.s;
  let hand = S.hands[p], v;
  if (p === S.dealer) {
    const h = [...S.hands[p], S.upcard]; const d = discardChoice(h, t);
    hand = h.filter(c => c !== d);
    v = strength(hand, t);
  } else {
    v = strength(hand, t);
    v += (team(p) === team(S.dealer) ? TUNE.partnerUp : -TUNE.oppUp) * trumpVal(S.upcard, t);
    if (p === nextP(S.dealer)) v += TUNE.firstSeat;
  }
  const order = v >= threshold(S, p);
  // Going alone: our dealer partner would sit out and not pick up, so judge our own hand only.
  return { order, alone: order && soloTricks(hand, t) >= TUNE.aloneAt };
}

export function bid2(S, p) {
  let best = null, bv = -1;
  for (const s of SUITS) {
    if (s === S.turnedDown) continue;
    let v = strength(S.hands[p], s);
    if (p === nextP(S.dealer) && s === sister(S.turnedDown)) v += TUNE.nextBonus;  // "next"
    if (p === nextP(S.dealer)) v += TUNE.firstSeat;
    if (v > bv) { bv = v; best = s; }
  }
  const call = bv >= threshold(S, p);
  return { suit: call ? best : null, alone: call && soloTricks(S.hands[p], best) >= TUNE.aloneAt };
}

// ---------- play ----------

export function playCard(S, p) {
  const L = legalCards(S.hands[p], S.trick, S.trump);
  if (L.length === 1) return L[0];
  const mem = memory(S, p);
  return S.trick.length ? follow(S, p, L, mem) : lead(S, p, L, mem);
}

function lead(S, p, L, mem) {
  const t = S.trump;
  const partner = partnerOf(p);
  const partnerIn = S.sitter !== partner;
  const opps = [nextP(p), nextP(nextP(nextP(p)))].filter(q => q !== S.sitter);
  const trumps = L.filter(c => isTrump(c, t)).sort((a, b) => power(b, t, t) - power(a, t, t));
  const offs = L.filter(c => !isTrump(c, t));
  const oppTrump = opps.some(q => mem.could(q).some(c => isTrump(c, t)));
  const weMade = team(S.maker) === team(p);
  const sure = c => opps.every(q => !threatens(S, mem, q, c, effSuit(c, t)));

  // Our team named trump: draw the other team's trumps.
  if (weMade && trumps.length && oppTrump) {
    if (S.maker === p && (sure(trumps[0]) || trumps.length >= 2)) return trumps[0];
    if (S.maker === partner && partnerIn) return trumps[0];       // partner called: lead trump to them
  }
  // Cash cards nobody can beat.
  const sureOff = offs.filter(sure);
  if (sureOff.length) return sureOff[0];
  if (trumps.length && sure(trumps[0]) && (weMade || !offs.length)) return trumps[0];

  // Off-suit aces, unless an opponent is out of that suit and could trump it.
  const aces = offs.filter(c => c.r === 'A' && opps.every(q => !mem.out[q].has(c.s) || !mem.could(q).some(x => isTrump(x, t))));
  if (aces.length) return aces[0];

  // Partner is out of a suit and may have trump: lead it so they can trump it,
  // but only if no opponent is out of it too (they could overtrump).
  if (partnerIn && mem.could(partner).some(x => isTrump(x, t))) {
    const forPartner = offs.filter(c => mem.out[partner].has(c.s) && opps.every(q => !mem.out[q].has(c.s)));
    if (forPartner.length) return dump(S, mem, p, forPartner);
  }
  // Otherwise a low card in a suit no opponent is out of.
  const quiet = offs.filter(c => opps.every(q => !mem.out[q].has(c.s)));
  if (quiet.length) return dump(S, mem, p, quiet);
  if (offs.length) return dump(S, mem, p, offs);
  return trumps[trumps.length - 1];
}

function follow(S, p, L, mem) {
  const t = S.trump;
  const led = effSuit(S.trick[0].card, t);
  const w = trickWinner(S.trick, t);
  const after = playersAfter(S, p);
  const oppAfter = after.filter(q => team(q) !== team(p));
  const holds = c => oppAfter.every(q => !threatens(S, mem, q, c, led));
  const winners = L.filter(c => power(c, t, led) > w.pw).sort((a, b) => power(a, t, led) - power(b, t, led));

  // Partner is winning.
  if (team(w.p) === team(p)) {
    if (holds(w.card)) return dump(S, mem, p, L);                 // it will hold: play low, don't trump it
    const safe = winners.filter(holds);
    if (safe.length) return safe[0];                              // partner may lose it: take it for sure
    return dump(S, mem, p, L);
  }

  // The other team is winning.
  if (!winners.length) return dump(S, mem, p, L);
  if (!oppAfter.length) return winners[0];                        // last to play: cheapest card that wins
  const safe = winners.filter(holds);
  if (after.includes(partnerOf(p))) {
    // Second to play: play low and leave it to partner, unless we can win for sure.
    if (safe.length) return safe[0];
    return dump(S, mem, p, L);
  }
  // Third to play (partner already played and is losing): play high.
  if (safe.length) return safe[0];
  return winners[winners.length - 1];
}
