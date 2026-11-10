// Checks Cribbage counting and pegging against hand-made examples. Run from the card-games folder:
//   /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tools/cribbage-count-check.js
import * as R from '../p/bmuacrbv/cribbage/rules.js';
const c = id => ({ r: id.slice(0, -1), s: id.slice(-1), id });
const cs = s => s.split(' ').map(c);
let fails = 0;
const check = (name, got, want) => { const ok = got === want; if (!ok) fails++; print(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : '   (wanted ' + want + ')'}`); };
const hand = (h, starter, crib = false) => R.countHand(cs(h), c(starter), crib).total;
const kinds = (h, starter, crib = false) => R.countHand(cs(h), c(starter), crib).items.map(i => i.kind[0]).join('');

print('Hands');
check('29: three 5s and the Jack of the starter suit, a 5 turned', hand('5H 5D 5C JS', '5S'), 29);
check('28: four 5s and a ten card (no nibs)', hand('5H 5D 5C 5S', 'KD'), 28);
check('double run 4-5-5-6 with a King', hand('4C 5H 5S 6D', 'KD'), 16);
check('double run: two runs of 3 counted', kinds('4C 5H 5S 6D', 'KD').replace(/[^r]/g, ''), 'rr');
check('double-double run 4-4-5-5-6', hand('4C 4D 5H 5S', '6D'), 24);
check('triple run 3-3-3-4-5', hand('3C 3D 3H 4S', '5D'), 21);
check('run of 5 A-2-3-4-5', hand('AC 2D 3H 4S', '5D'), 7);
check('hand flush, starter different suit: 4', hand('2H 4H 8H QH', 'KS'), 4);
check('hand flush, starter matches: 5', hand('2H 4H 8H QH', 'KH'), 5);
check('crib with 4 of a suit, starter different: no flush', hand('2H 4H 8H QH', 'KS', true), 0);
check('crib with all 5 of a suit: 5', hand('2H 4H 8H QH', 'KH', true), 5);
check('his nibs: Jack matching the starter suit', hand('JD AC 3S 7H', 'KD'), 1);
check('Jack not matching the starter suit: nothing', hand('JC AD 3S 7H', 'KD'), 0);
check('his nibs counts in the crib too', hand('JD AC 3S 7H', 'KD', true), 1);
check('"19" hand: nothing at all', hand('2C 4D 6S 8H', 'KC'), 0);
check('pair royal (three of a kind) is 6', hand('9C 9D 9H AS', 'KC'), 6);
check('four of a kind is 12, plus fifteens', hand('2C 2D 2H 2S', 'KC'), 12);
check('the words for a count', R.sayCount(R.countHand(cs('4C 5H 5S 6D'), c('KD')).items),
  'Fifteen two, fifteen four, fifteen six, fifteen eight, a pair is ten, a run of three is thirteen, and another run of three is sixteen.');
check('his heels: a Jack turned is 2 for the dealer', R.heels(c('JS')), 2);
check('no heels for a Queen', R.heels(c('QS')), 0);

print('Pegging');
const peg = s => R.pegPoints(cs(s)).pts;
check('15 for 2', peg('KS 5D'), 2);
check('pair for 2', peg('KS 5D 5C'), 2);
check('three of a kind for 6', peg('4S 4D 4C'), 6);
check('four of a kind for 12', peg('3S 3D 3C 3H'), 12);
check('run of 3 in any order', peg('7D 6S 8H'), 3);
check('run of 4 after a run of 3', peg('7D 6S 8H 5C'), 4 + 0);
check('15 and a run together', peg('4S 6D 5C'), 2 + 3);
check('31 for 2', peg('KS 5D 5C 9H 2S'), 2);
check('a broken run does not count', peg('6S 7D 7H 8C'), 0);
check('label', R.pegLabel(R.pegPoints(cs('4S 6D 5C'))), 'Fifteen + Run of 3 for 5');
check('playable: count 29 with a 7 and a 2', R.playable(cs('7D 2S'), 29).map(x => x.id).join(' '), '2S');

print('Skunks');
check('loser on 91: one game', R.gamesWon(91), 1);
check('loser on 90: skunk, two games', R.gamesWon(90), 2);
check('loser on 60: double skunk, three games', R.gamesWon(60), 3);

print(fails ? `${fails} FAILED` : 'All counting checks passed');
