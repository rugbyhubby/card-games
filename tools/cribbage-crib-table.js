// Works out the average crib score for every pair of discarded ranks, by
// playing out many random cribs. The result is pasted into
// p/<slug>/cribbage/bots-hard.js (CRIB). Run from the card-games folder:
//   /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tools/cribbage-crib-table.js
import { makeDeck } from '../shared/deck.js';
import { countHand } from '../p/bmuacrbv/cribbage/rules.js';
import { seededRandom } from './sim-core.js';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const rnd = seededRandom(12345);
const SAMPLES = 6000;
const rows = [];
for (let i = 0; i < 13; i++) {
  const row = [];
  for (let j = 0; j < 13; j++) {
    if (j < i) { row.push(rows[j][i]); continue; }
    // Two discards of these ranks, in different suits (same suit barely matters).
    const a = { r: RANKS[i], s: 'S', id: RANKS[i] + 'S' }, b = { r: RANKS[j], s: 'H', id: RANKS[j] + 'H' };
    const rest = makeDeck().filter(c => c.id !== a.id && c.id !== b.id);
    let total = 0;
    for (let k = 0; k < SAMPLES; k++) {
      const pick = new Set();
      while (pick.size < 3) pick.add(Math.floor(rnd() * rest.length));
      const [x, y, st] = [...pick].map(q => rest[q]);
      total += countHand([a, b, x, y], st, true).total;
    }
    row.push(Math.round(total / SAMPLES * 100) / 100);
  }
  rows.push(row);
}
print('// Average crib score by the two ranks discarded (A..K), from tools/cribbage-crib-table.js');
print('const CRIB = [');
rows.forEach(r => print('  [' + r.join(', ') + '],'));
print('];');
