// Command-line simulator. Run it with tools/simulate.sh (see tools/README.md).
//
//   --game NAME      euchre | pitch | cribbage (default euchre)
//   --games N        how many games (default 300)
//   --us LEVEL       your team's difficulty: easy | medium | hard (default medium)
//   --them LEVEL     the other team's difficulty (default: same as --us)
//   --seed N         first seed; game i uses seed N+i (default 1)
//   --render         also check every screen drawn (for before/after checks)
//   --compare FILE   compare game by game with a saved run; report any difference
//   --save FILE      save this run's results
import { runGames, compareRuns, margin } from './sim-core.js';
import { euchreGame } from './euchre-sim.js';
import { pitchGame } from './pitch-sim.js';
import { cribbageGame } from './cribbage-sim.js';

const args = globalThis.arguments || [];
const opt = { game: 'euchre', games: 300, us: 'medium', them: null, seed: 1, render: false, compare: null, save: null };
for (let i = 0; i < args.length; i++) {
  const a = args[i].replace(/^--/, '');
  if (a === 'render') opt.render = true;
  else if (a in opt) opt[a] = args[++i];
  else { print(`Unknown option: ${args[i]}`); throw new Error('bad option'); }
}
opt.games = +opt.games; opt.seed = +opt.seed; opt.them = opt.them || opt.us;

const GAMES = { euchre: ['Euchre', euchreGame], pitch: ['Pitch', pitchGame], cribbage: ['Cribbage', cribbageGame] };
if (!GAMES[opt.game]) { print(`Unknown game: ${opt.game}`); throw new Error('bad game'); }
const [gameName, makeGame] = GAMES[opt.game];
print(`Playing ${opt.games} games of ${gameName}: us ${opt.us}, them ${opt.them}, seeds ${opt.seed}–${opt.seed + opt.games - 1}${opt.render ? ', checking screens' : ''}`);
const run = runGames(makeGame({ us: opt.us, them: opt.them, render: opt.render }), {
  count: opt.games, firstSeed: opt.seed,
  onProgress: (n, total) => { if (n % 500 === 0 && n < total) print(`  ${n} games…`); }
});
const s = run.summary;
const pct = x => (100 * x).toFixed(1) + '%';
print(`Finished: ${s.finished} of ${s.played}   errors or stuck: ${run.problems.length}`);
print(`Us (${opt.us}) won ${s.usWins}, them (${opt.them}) won ${s.themWins}: us ${pct(s.usWinRate)} ± ${pct(margin(s.usWinRate, s.finished))}`);
print(`Average hands per game: ${s.avgHands.toFixed(1)}   time: ${s.seconds.toFixed(1)}s`);
run.problems.slice(0, 20).forEach(p => print('  ' + p));

let ok = run.problems.length === 0;
if (opt.compare) {
  const other = JSON.parse(readFile(opt.compare));
  const diffs = compareRuns(run.games, other.games);
  if (diffs.length) { ok = false; print(`DIFFERENT from ${opt.compare} in ${diffs.length} places:`); diffs.slice(0, 20).forEach(d => print('  ' + d)); }
  else print(`Identical to ${opt.compare}: same moves${opt.render ? ', same screens' : ''} and same scores in every game.`);
}
if (opt.save) {
  writeFile(opt.save, JSON.stringify({ us: opt.us, them: opt.them, summary: s, games: run.games }));
  print(`Saved to ${opt.save}`);
}
print(ok ? 'RESULT: OK' : 'RESULT: PROBLEMS FOUND');
if (!ok) throw new Error('simulation found problems'); // makes the command report failure
