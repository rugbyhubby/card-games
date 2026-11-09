// Checks Pitch's card rules against hand-made examples. Run from the card-games folder:
//   /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tools/pitch-rules-check.js
import * as R from '../p/bmuacrbv/pitch/rules.js';
const c = id => ({ r: id.slice(0, -1), s: id.slice(-1), id });
const ids = cs => cs.map(x => x.id).join(' ');
let fails = 0; const check = (name, got, want) => { const ok = got === want; if (!ok) fails++; print(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : '   (wanted ' + want + ')'}`); };
const hand = ['10S', '3S', 'KH', '2H', '9C'].map(c);   // hearts are trump
const trickSpadeLed = [{ p: 1, card: c('AS') }];
check('spades led, I have spades + hearts(trump) + a club: may play spades or hearts, not the club', ids(R.legalCards(hand, trickSpadeLed, 'H')), '10S 3S KH 2H');
check('diamonds led, I have none: anything', ids(R.legalCards(hand, [{ p: 1, card: c('KD') }], 'H')), '10S 3S KH 2H 9C');
check('trump led, I have trump: trumps only', ids(R.legalCards(hand, [{ p: 1, card: c('AH') }], 'H')), 'KH 2H');
check('a low trump beats the ace of the suit led', R.trickWinner([{ p: 1, card: c('AS') }, { p: 2, card: c('2H') }], 'H').p, 2);
check('off-suit card cannot win', R.trickWinner([{ p: 1, card: c('5S') }, { p: 2, card: c('AC') }], 'H').p, 1);
const played = [{ p: 0, card: c('AH') }, { p: 1, card: c('2H') }, { p: 2, card: c('JH') }, { p: 3, card: c('10S') }];
const s = R.scoreHand(played, [[c('AH'), c('2H'), c('JH'), c('10S')], []], 'H');
check('Low goes to the player who played it, even though their team lost the trick', s.low.team, 1);
check('Jack goes to the team that won its trick', s.jack.team, 0);
check('Game count: A(4)+J(1)+10(10)', s.count[0], 15);
const noJack = R.scoreHand([{ p: 0, card: c('AH') }, { p: 1, card: c('3H') }], [[c('AH'), c('3H')], []], 'H');
check('No jack dealt: 3 points available', noJack.available, 3);
const tie = R.scoreHand([{ p: 0, card: c('10S') }, { p: 1, card: c('10C') }], [[c('10S')], [c('10C')]], 'S');
check('Game tied: nobody gets it', String(tie.game), 'null');
print(fails ? `${fails} FAILED` : 'All rule checks passed');
