// Cribbage card rules: card values, counting a hand, and pegging points.
// No game flow here (see game.js). Nothing assumes two players: the deal
// sizes come from SETUP, so 3-player Cribbage can be added later.
import { rankName } from '../../../shared/deck.js';

// How many cards each player gets, how many each gives the crib, and how many
// come off the deck into the crib, by number of players.
export const SETUP = {
  2: { hand: 6, toCrib: 2, deckToCrib: 0 },
  3: { hand: 5, toCrib: 1, deckToCrib: 1 }   // not built yet; here so nothing hard-codes 2
};
export const WIN_AT = 121;
export const SKUNK = 91;          // loser under 91: the win counts as 2 games
export const DOUBLE_SKUNK = 61;   // loser under 61: 3 games
export const NAMES = ['You', 'Computer', 'West'];

// Ace low. ORDER is for runs (A=1 ... K=13); VALUE is for counting to 15 and 31.
const ORDER = { A: 1, J: 11, Q: 12, K: 13 };
export const order = c => ORDER[c.r] || +c.r;
export const value = c => Math.min(order(c), 10);

// Games won by the winner, from the loser's final score.
export const gamesWon = loserScore => loserScore < DOUBLE_SKUNK ? 3 : loserScore < SKUNK ? 2 : 1;

// Every subset of a list (used for fifteens and runs; at most 5 cards, 32 subsets).
function subsets(list) {
  const out = [];
  for (let m = 1; m < (1 << list.length); m++) out.push(list.filter((_, i) => m & (1 << i)));
  return out;
}
const isRun = cs => {
  const o = cs.map(order).sort((a, b) => a - b);
  for (let i = 1; i < o.length; i++) if (o[i] !== o[0] + i) return false;
  return true;
};

// Count a hand (or crib) with its starter. Returns the total and each scoring
// combination in the order players say them: fifteens, pairs, runs, flush, nibs.
//   items: [{ kind: 'fifteen'|'pair'|'run'|'flush'|'nibs', ids: [card ids], pts }]
// With no starter (a computer guessing at its own hand), just the cards.
export function countHand(cards, starter, isCrib = false) {
  const all = starter ? [...cards, starter] : [...cards];
  const items = [];
  const ids = cs => cs.map(c => c.id);
  const subs = subsets(all);
  for (const s of subs) if (s.length >= 2 && s.reduce((t, c) => t + value(c), 0) === 15) items.push({ kind: 'fifteen', ids: ids(s), pts: 2 });
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    if (all[i].r === all[j].r) items.push({ kind: 'pair', ids: ids([all[i], all[j]]), pts: 2 });
  }
  for (let len = all.length; len >= 3; len--) {
    const runs = subs.filter(s => s.length === len && isRun(s));
    if (runs.length) { for (const s of runs) items.push({ kind: 'run', ids: ids(s), pts: len }); break; }
  }
  if (cards.length >= 4 && cards.every(c => c.s === cards[0].s)) {
    if (starter && starter.s === cards[0].s) items.push({ kind: 'flush', ids: ids(all), pts: all.length });
    else if (!isCrib) items.push({ kind: 'flush', ids: ids(cards), pts: cards.length });   // a crib needs all 5
  }
  if (starter) for (const c of cards) if (c.r === 'J' && c.s === starter.s) items.push({ kind: 'nibs', ids: [c.id], pts: 1 });
  return { total: items.reduce((t, x) => t + x.pts, 0), items };
}

// Turning a Jack as the starter: the dealer pegs 2.
export const heels = starter => starter && starter.r === 'J' ? 2 : 0;

// Cards that can be played without going over 31.
export const playable = (hand, count) => hand.filter(c => count + value(c) <= 31);

// Points for the card just played. `seq` is this round's cards in order (the
// count resets after 31 or a go). Returns { pts, parts: [{ name, pts }] }.
export function pegPoints(seq) {
  const parts = [];
  const count = seq.reduce((t, c) => t + value(c), 0);
  if (count === 15) parts.push({ name: 'Fifteen', pts: 2 });
  if (count === 31) parts.push({ name: '31', pts: 2 });
  let same = 1;
  while (same < seq.length && seq[seq.length - 1 - same].r === seq[seq.length - 1].r) same++;
  if (same >= 2) parts.push({ name: ['', '', 'Pair', 'Three of a kind', 'Four of a kind'][same], pts: [0, 0, 2, 6, 12][same] });
  for (let len = seq.length; len >= 3; len--) {
    if (isRun(seq.slice(-len))) { parts.push({ name: `Run of ${len}`, pts: len }); break; }
  }
  return { pts: parts.reduce((t, x) => t + x.pts, 0), parts };
}

// "Fifteen for 2", "Fifteen + Pair for 4".
export const pegLabel = ({ pts, parts }) => `${parts.map(p => p.name).join(' + ')} for ${pts}`;

// The words for a count, as players say them: "Fifteen two, fifteen four,
// a pair is six, and a run of three is nine." `upto` = how many items said so far.
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two',
  'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine'];
export const word = n => WORDS[n] || String(n);
export function sayCount(items, upto = items.length) {
  if (!items.length) return 'Nineteen. (Nothing at all.)';
  let total = 0, runSeen = false, pairSeen = false;
  const bits = items.slice(0, upto).map(it => {
    total += it.pts;
    if (it.kind === 'fifteen') return `fifteen ${word(total)}`;
    if (it.kind === 'pair') { const s = `${pairSeen ? 'another pair' : 'a pair'} is ${word(total)}`; pairSeen = true; return s; }
    if (it.kind === 'run') { const s = `${runSeen ? 'another run' : 'a run'} of ${word(it.ids.length)} is ${word(total)}`; runSeen = true; return s; }
    if (it.kind === 'flush') return `a flush is ${word(total)}`;
    return `his nibs is ${word(total)}`;
  });
  if (upto === items.length && bits.length > 1) bits[bits.length - 1] = 'and ' + bits[bits.length - 1];
  const s = bits.join(', ');
  return s.charAt(0).toUpperCase() + s.slice(1) + (upto === items.length ? '.' : '…');
}

// Short card name for messages: "the 7", "a King".
export const cardWord = c => (c.r === 'A' || c.r === '8' ? 'an ' : 'a ') + rankName(c.r);
