// Plays Cribbage with both seats run by the computer, using the real game code.
import './sim-env.js';
import { seededRandom, fakeClock, fingerprint, normalizeHTML } from './sim-core.js';
import { createTimer } from '../shared/timing.js';
import { feedbackHref } from '../shared/ui.js';
import { createCribbage } from '../p/bmuacrbv/cribbage/game.js';
import { renderHTML } from '../p/bmuacrbv/cribbage/view.js';
import { VERSION } from '../p/bmuacrbv/cribbage/version.js';
import { WIN_AT, countHand } from '../p/bmuacrbv/cribbage/rules.js';

// options: us, them (levels for seat 0 and seat 1), render (fingerprint every screen)
export function cribbageGame({ us = 'medium', them = 'medium', render = false } = {}) {
  return function playOne(seed) {
    const clock = fakeClock();
    const timer = createTimer({ schedule: clock.schedule });
    const realRandom = Math.random;
    Math.random = seededRandom(seed);
    const moves = fingerprint(), screens = fingerprint();
    let game;
    const draw = render ? S => {
      screens.add(normalizeHTML(renderHTML(S, { legal: game.legal, version: VERSION,
        feedback: feedbackHref({ game: 'Cribbage', version: VERSION }) })));
      S.justDealt = false;
    } : () => {};
    // Keep a running total of every point scored, to check against the scores.
    const scored = [0, 0];
    game = createCribbage({
      timer, human: false, levelAtStart: () => us,
      difficultyFor: p => (p === 0 ? us : them),
      onChange: draw, onEvent: s => { moves.add(s); const m = /^score:(\d):(\d+)/.exec(s); if (m) scored[+m[1]] += +m[2]; }
    });
    const S = game.state;
    try {
      game.newGame();
      let hands = 1, guard = 0;
      for (;;) {
        if (++guard > 100000) return { stuck: 'too many steps', score: S.score, hands };
        if (clock.tick()) continue;
        if (S.phase === 'gameOver') break;
        if (S.phase === 'handEnd') {
          if (++hands > 200) return { stuck: 'too many hands', score: S.score, hands };
          checkHand(S); game.next(); continue;
        }
        return { stuck: `nothing to do in phase ${S.phase}, turn ${S.turn}`, score: S.score, hands };
      }
      if (S.score[S.winner] !== WIN_AT) return { stuck: `winner has ${S.score[S.winner]}`, score: S.score, hands };
      if (S.score.some((s, p) => p !== S.winner && s >= WIN_AT)) return { stuck: 'two winners', score: S.score, hands };
      for (let p = 0; p < 2; p++) if (Math.min(scored[p], WIN_AT) !== S.score[p]) return { stuck: `seat ${p} scored ${scored[p]} but shows ${S.score[p]}`, score: S.score, hands };
      const out = { score: [...S.score], hands, moves: moves.value, games: S.result.games };
      if (render) out.render = screens.value;
      return out;
    } finally {
      Math.random = realRandom;
    }
  };
}

// Every finished hand: all 8 cards pegged, a 4-card crib, hands and crib counted correctly.
function checkHand(S) {
  if (S.peg.played.length !== 8) throw new Error(`pegging ended after ${S.peg.played.length} cards`);
  if (S.hands.some(h => h.length)) throw new Error('pegging ended with cards left');
  if (S.crib.length !== 4) throw new Error(`crib has ${S.crib.length} cards`);
  const ids = new Set([...S.kept.flat(), ...S.crib, S.starter].map(c => c.id));
  if (ids.size !== 13) throw new Error('a card turned up twice');
  if (countHand(S.crib, S.starter, true).total > 29) throw new Error('impossible crib');
}
