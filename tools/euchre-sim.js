// Plays Euchre with every seat run by the computer, using the real game code.
import './sim-env.js';
import { seededRandom, fakeClock, fingerprint, normalizeHTML } from './sim-core.js';
import { createTimer } from '../shared/timing.js';
import { feedbackHref } from '../shared/ui.js';
import { createEuchre } from '../p/bmuacrbv/euchre/game.js';
import { renderHTML } from '../p/bmuacrbv/euchre/view.js';
import { VERSION } from '../p/bmuacrbv/euchre/version.js';

// options:
//   us, them   difficulty for your team (seats 0 and 2) and the other team (1 and 3)
//   render     also fingerprint every screen drawn (slower; for before/after checks)
export function euchreGame({ us = 'medium', them = 'medium', render = false } = {}) {
  return function playOne(seed) {
    const clock = fakeClock();
    const timer = createTimer({ schedule: clock.schedule });
    const realRandom = Math.random;
    Math.random = seededRandom(seed);
    const moves = fingerprint(), screens = fingerprint();
    let game;
    const draw = render ? S => {
      screens.add(normalizeHTML(renderHTML(S, {
        legal: game.legal, difficulty: us, version: VERSION,
        feedback: feedbackHref({ game: 'Euchre', version: VERSION })
      })));
      S.justDealt = false;
    } : () => {};
    game = createEuchre({
      timer,
      difficultyFor: p => (p % 2 === 0 ? us : them),
      onChange: draw,
      onEvent: s => moves.add(s)
    });
    const S = game.state;
    try {
      game.newGame();
      let hands = 1, guard = 0;
      for (;;) {
        if (++guard > 50000) return { stuck: 'too many steps', score: S.score, hands };
        if (clock.tick()) continue;               // let the computer players' pauses play out
        if (S.phase === 'gameOver') break;
        if (S.phase === 'handEnd') {              // tap "Deal next hand"
          if (++hands > 500) return { stuck: 'too many hands', score: S.score, hands };
          game.next(); continue;
        }
        // Waiting on seat 0 ("you"): let the computer decide for you.
        if (S.phase === 'discard' || (S.turn === 0 && ['bid1', 'bid2', 'play'].includes(S.phase))) { game.botMove(0); continue; }
        return { stuck: `nothing to do in phase ${S.phase}, turn ${S.turn}`, score: S.score, hands };
      }
      const problem = checkFinal(S);
      if (problem) return { stuck: problem, score: S.score, hands };
      const out = { score: [...S.score], hands, moves: moves.value };
      if (render) out.render = screens.value;
      return out;
    } finally {
      Math.random = realRandom;
    }
  };
}

// A finished game should have exactly one team at 10 or more, and every hand
// played out (except the partner sitting out when someone went alone).
function checkFinal(S) {
  const winners = S.score.filter(x => x >= 10).length;
  if (winners !== 1) return `game ended with score ${S.score}`;
  if (S.hands.some((h, p) => h.length && p !== S.sitter)) return 'game ended with cards still in hand';
  return '';
}
