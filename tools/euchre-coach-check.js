// Checks Grandma Dot's coaching rules (euchre/learn/coach.js) on hand-made situations.
// Run from the card-games folder:
//   /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tools/euchre-coach-check.js
import { grade, highestTrump } from '../p/bmuacrbv/euchre/learn/coach.js';

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

check('highest trump: left bower beats the ace', highestTrump(hand('AH JD 10H KC'), 'H').id, 'JD');
check('highest trump: right bower beats the left', highestTrump(hand('JD JH'), 'H').id, 'JH');
check('highest trump: ace when no bowers', highestTrump(hand('10H AH KS'), 'H').id, 'AH');

print(fails ? `${fails} FAILED` : 'All coaching checks passed');
