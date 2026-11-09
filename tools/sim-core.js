// Simulation helpers shared by the command-line and browser runners.
// Nothing here is loaded by the live games.

// Repeatable "random" numbers: the same seed always gives the same shuffles,
// so a game can be replayed exactly and compared before/after a change.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A pretend clock. The games wait between computer moves; here those waits
// happen instantly, in the same order they would in real time.
export function fakeClock() {
  let now = 0, seq = 0;
  const queue = [];
  return {
    schedule(fn, ms) { queue.push({ at: now + ms, seq: seq++, fn }); },
    // Run the next waiting callback. Returns false when nothing is waiting.
    tick() {
      if (!queue.length) return false;
      let i = 0;
      for (let j = 1; j < queue.length; j++) {
        const a = queue[j], b = queue[i];
        if (a.at < b.at || (a.at === b.at && a.seq < b.seq)) i = j;
      }
      const [next] = queue.splice(i, 1);
      now = next.at;
      next.fn();
      return true;
    },
    get pending() { return queue.length; },
    get now() { return now; },
    clear() { queue.length = 0; }
  };
}

// Short fingerprint of a list of strings, to compare long move logs cheaply.
export function fingerprint() {
  let h = 0x811c9dc5;
  return {
    add(s) {
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
      h ^= 10; h = Math.imul(h, 0x01000193);
    },
    get value() { return (h >>> 0).toString(16).padStart(8, '0'); }
  };
}

// Make rendered HTML comparable: ignore whitespace layout, the version number
// and the feedback link.
export function normalizeHTML(html) {
  return html
    .replace(/mailto:[^"]*/g, 'mailto:FEEDBACK')     // holds device details that differ per computer
    .replace(/ style="--n:\d+"/g, '')                // card-count hint on the hand (added in v0.2.1)
    .replace(/v?\d+\.\d+\.\d+/g, 'VER')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .replace(/="\s+/g, '="')
    .replace(/\s+"/g, '"')
    .replace(/\s+>/g, '>')
    .trim();
}

// Play `count` games with `playOne(seed)` and collect the results.
// playOne returns { score:[us,them], hands, moves, render? } or throws.
export function runGames(playOne, { count, firstSeed = 1, onProgress } = {}) {
  const games = [], problems = [];
  const t0 = Date.now();
  for (let i = 0; i < count; i++) {
    const seed = firstSeed + i;
    try {
      const r = playOne(seed);
      games.push({ seed, ...r });
      if (r.stuck) problems.push(`Game ${seed}: stuck (${r.stuck})`);
    } catch (err) {
      problems.push(`Game ${seed}: error: ${err && err.message || err}`);
      games.push({ seed, error: String(err && err.message || err) });
    }
    if (onProgress && (i + 1) % 50 === 0) onProgress(i + 1, count);
  }
  const done = games.filter(g => !g.error && !g.stuck);
  const usWins = done.filter(g => g.score[0] > g.score[1]).length;
  return {
    games, problems,
    summary: {
      played: count,
      finished: done.length,
      usWins,
      themWins: done.length - usWins,
      usWinRate: done.length ? usWins / done.length : 0,
      avgHands: done.length ? done.reduce((s, g) => s + g.hands, 0) / done.length : 0,
      seconds: (Date.now() - t0) / 1000
    }
  };
}

// Compare two runs game by game. Returns a list of differences (empty = identical).
export function compareRuns(a, b) {
  const diffs = [];
  const bySeed = new Map(b.map(g => [g.seed, g]));
  for (const g of a) {
    const o = bySeed.get(g.seed);
    if (!o) { diffs.push(`Game ${g.seed}: missing from the other run`); continue; }
    for (const k of ['score', 'hands', 'moves', 'render']) {
      if (g[k] === undefined || o[k] === undefined) continue;
      if (JSON.stringify(g[k]) !== JSON.stringify(o[k])) diffs.push(`Game ${g.seed}: ${k} differs (${JSON.stringify(o[k])} → ${JSON.stringify(g[k])})`);
    }
  }
  return diffs;
}

// 95% margin of error for a win rate, so "61%" comes with "± 2%".
export function margin(rate, n) {
  return n ? 1.96 * Math.sqrt(rate * (1 - rate) / n) : 0;
}
