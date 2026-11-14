// Checks Grandma Dot's coaching rules (euchre/learn/coach.js) on hand-made situations.
// Run from the card-games folder:
//   /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tools/euchre-coach-check.js
import { grade, gradeBid, gradeDiscard, bestDiscard, highestTrump } from '../p/bmuacrbv/euchre/learn/coach.js';
import { narrate } from '../p/bmuacrbv/euchre/learn/narrator.js';

let fails = 0;
const c = id => ({ r: id.slice(0, -1), s: id.slice(-1), id });
const hand = s => s.split(' ').map(c);
function check(name, got, want) {
  const ok = got === want;
  if (!ok) fails++;
  print(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ' (wanted ' + want + ')'}`);
}
const kind = g => g ? g.kind : 'none';
const S = (trump, trick, mine, sitter = null) => ({ trump, sitter, trick: trick.map(([p, id]) => ({ p, card: c(id) })), hands: [hand(mine), [], [], []] });

// Hearts trump. East led clubs, Dot's ace is winning, West followed low; you have no clubs.
let s = S('H', [[3, '9C'], [2, 'AC'], [1, '10C']], '9H 10S KD');
check('trumping Dot’s winning ace is a putz play', kind(grade(s, c('9H'))), 'putz');
check('…and the napkin says so', grade(s, c('9H')).mark, 'Trumped my ace');
check('throwing off instead is fine', kind(grade(s, c('10S'))), 'none');
s = S('H', [[3, '9C'], [2, 'AC'], [1, '10C']], '9H 10H');
check('only trump in hand: no choice, no mark', kind(grade(s, c('9H'))), 'none');
s = S('H', [[3, '9C'], [2, 'AC']], '9H 10S');
check('not last to play: no mark (East could still win)', kind(grade(s, c('9H'))), 'none');
s = S('H', [[3, 'AC'], [2, '9C'], [1, '10C']], '9H 10S');
check('East is winning, so trumping is right', kind(grade(s, c('9H'))), 'none');
s = S('H', [[1, '10C'], [2, 'AC']], '9H 10S', 3);
check('East sits out: you are last after two cards', kind(grade(s, c('9H'))), 'putz');
s = S('H', [[3, 'JD'], [2, 'JH'], [1, '9H']], 'AH 10S');
check('trump led: following with trump is not a putz', kind(grade(s, c('AH'))), 'none');

// Leading a bower with more trump behind it.
s = S('H', [], 'JH AH 10S');
check('leading the right bower with more trump: good', kind(grade(s, c('JH'))), 'good');
s = S('H', [], 'JD 9H 10S');
check('leading the left bower with more trump: good', kind(grade(s, c('JD'))), 'good');
s = S('H', [], 'JH 10S KC');
check('right bower, no other trump: nothing special', kind(grade(s, c('JH'))), 'none');

// Lesson 3: Dot's trick.
s = S('H', [[1, '9C'], [2, 'KC'], [3, '10C']], 'AC QC 9S');
check('L3: playing over Dot’s winning king with the ace (had the queen): putz', kind(grade(s, c('AC'), 3)), 'putz');
check('…napkin says so', grade(s, c('AC'), 3).mark, 'Played over my winner');
check('L3: playing the queen under her king: fine', kind(grade(s, c('QC'), 3)), 'none');
check('L2: the same over-play is not judged yet', kind(grade(s, c('AC'), 2)), 'none');
s = S('H', [[1, '9C'], [2, 'KC'], [3, '10C']], 'AC');
check('L3: only card, no choice: no mark', kind(grade(s, c('AC'), 3)), 'none');
s = S('H', [[1, '9C'], [2, 'AC'], [3, '10C']], '9H 10S');
check('L3: throwing off when you could trump her ace: good', kind(grade(s, c('10S'), 3)), 'good');
check('L1: same throw-off: not judged yet', kind(grade(s, c('10S'), 1)), 'none');

// Lesson 4: bidding. Hearts turned up.
const B = (mine, up, dealer = 3, phase = 'bid1', turnedDown = null) => ({ phase, dealer, turnedDown, upcard: c(up), hands: [hand(mine), [], [], []] });
let b = B('JH JD AH KC 9S', '9H');
check('L4: passing with 3 trumps (both bowers + ace): putz', kind(gradeBid(b, { order: false }, 4)), 'putz');
check('…napkin says so', gradeBid(b, { order: false }, 4).mark, 'Passed with 3 trump');
check('L4: ordering up with 3 trumps: good', kind(gradeBid(b, { order: true }, 4)), 'good');
b = B('JH KC QC 9S 10D', '9H');
check('L4: ordering up with 1 trump: putz', kind(gradeBid(b, { order: true }, 4)), 'putz');
check('L4: passing with 1 trump: fine', kind(gradeBid(b, { order: false }, 4)), 'none');
b = B('JH AH KC 9S 10D', '9H', 0);
check('L4: dealer with 2 trumps + the turned-up heart = 3: passing is a putz', kind(gradeBid(b, { order: false }, 4)), 'putz');
b = B('JC JS AS KS 9H', '9H', 3, 'bid2', 'H');
check('L4 round two: passing with 4 spades (both black Jacks): putz', kind(gradeBid(b, { suit: null }, 4)), 'putz');
check('L4 round two: calling spades: good', kind(gradeBid(b, { suit: 'S' }, 4)), 'good');
check('L3: bids are not judged yet', kind(gradeBid(B('JH JD AH KC 9S', '9H'), { order: false }, 3)), 'none');

// The dealer's discard (Lesson 1: hearts trump, you picked up the 9♥).
const D = mine => ({ trump: 'H', hands: [hand(mine), [], [], []] });
let d = D('JD AH 10H 9H KC 9S');
check('discard: best is the lone 9♠', bestDiscard(d.hands[0], 'H').id, '9S');
check('discard: throwing the J♦ (left bower) is a putz', gradeDiscard(d, c('JD')).kind, 'putz');
check('…and says so', gradeDiscard(d, c('JD')).say, 'Not the J♦! That’s a bower.');
check('discard: throwing a heart is a putz', gradeDiscard(d, c('9H')).kind, 'putz');
check('discard: the K♣ is close, but not best', gradeDiscard(d, c('KC')).kind, 'better');
check('discard: the 9♠ is right', gradeDiscard(d, c('9S')).kind, 'good');
check('discard: keeps aces when it can', bestDiscard(hand('AH JH AC 9C 10D'), 'H').id, '10D');

check('highest trump: left bower beats the ace', highestTrump(hand('AH JD 10H KC'), 'H').id, 'JD');
check('highest trump: right bower beats the left', highestTrump(hand('JD JH'), 'H').id, 'JH');
check('highest trump: ace when no bowers', highestTrump(hand('10H AH KS'), 'H').id, 'AH');

// The lessons' narration (hearts trump).
const N = (trick, mine, turn, extra = {}) => ({ phase: 'play', trump: 'H', turn, winner: null, collecting: null, history: trick.map(() => 1),
  trick: trick.map(([p, id]) => ({ p, card: c(id) })), hands: [hand(mine), [], [], []], ...extra });
check('narrate: West leads, Dot’s turn', narrate(N([[1, 'KS']], 'AH', 2)),
  'West led the King of Spades. Spades were led, so everyone must play a spade if they have one. It’s Dot’s turn. Tap Next to see her card.');
check('narrate: your turn, you have one', narrate(N([[1, 'KS'], [2, 'AS'], [3, '9S']], 'QS AH', 0)),
  'East played the 9 of Spades. Dot is winning so far. Your turn. You have a spade, so you must play it.');
check('narrate: your turn, none of the suit', narrate(N([[1, 'KS'], [2, 'AS'], [3, '9S']], '10H KC', 0)),
  'East played the 9 of Spades. Dot is winning so far. Your turn. You have no spades, so you can play any card, even a trump.');
check('narrate: left bower is not a diamond', narrate(N([[1, 'KD'], [2, 'AD'], [3, '9D']], 'JD KC', 0)),
  'East played the 9 of Diamonds. Dot is winning so far. Your turn. You have no diamonds, so you can play any card, even a trump. (Your Jack of Diamonds counts as trump, not as a diamond.)');
check('narrate: trick won by the only trump', narrate(N([[1, '9C'], [2, 'AC'], [3, '10C'], [0, '9H']], '', null, { winner: 0 })),
  'You played the 9 of Hearts. You win the trick with the 9 of Hearts (the only trump played). Tap Next to give yourself the cards.');
check('narrate: trick won by the highest of the suit', narrate(N([[1, 'KC'], [2, 'AC'], [3, '10C'], [0, '9C']], '', null, { winner: 2 })),
  'You played the 9 of Clubs. Dot wins the trick with the Ace of Clubs (the highest club played). Tap Next to give Dot the cards.');
check('narrate: after the trick, the winner leads', narrate(N([], 'AH', 2, { history: [1, 1, 1, 1] })),
  'Dot won that trick, so she leads next. It’s Dot’s turn. Tap Next to see her card.');
check('narrate: bidding is left to the game', String(narrate({ phase: 'bid1' })), 'null');

print(fails ? `${fails} FAILED` : 'All coaching checks passed');
