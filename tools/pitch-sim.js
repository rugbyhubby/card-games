// Plays Pitch with every seat run by the computer, using the real game code.
import './sim-env.js';
import { seededRandom, fakeClock, fingerprint, normalizeHTML } from './sim-core.js';
import { createTimer } from '../shared/timing.js';
import { feedbackHref } from '../shared/ui.js';
import { createPitch } from '../p/bmuacrbv/pitch/game.js';
import { renderHTML } from '../p/bmuacrbv/pitch/view.js';
import { VERSION } from '../p/bmuacrbv/pitch/version.js';
import { WIN_AT } from '../p/bmuacrbv/pitch/rules.js';

// options: us, them (levels for seats 0+2 and 1+3), render (fingerprint every screen)
export function pitchGame({ us = 'medium', them = 'medium', render = false } = {}) {
  return function playOne(seed) {
    const clock = fakeClock();
    const timer = createTimer({ schedule: clock.schedule });
    const realRandom = Math.random;
    Math.random = seededRandom(seed);
    const moves = fingerprint(), screens = fingerprint();
    let game;
    const draw = render ? S => {
      screens.add(normalizeHTML(renderHTML(S, { legal: game.legal, bidOptions: game.bidOptions, version: VERSION,
        feedback: feedbackHref({ game: 'Pitch', version: VERSION }) })));
      S.justDealt = false;
    } : () => {};
    game = createPitch({
      timer, levelAtStart: () => us,
      difficultyFor: p => (p % 2 === 0 ? us : them),
      onChange: draw, onEvent: s => moves.add(s)
    });
    const S = game.state;
    try {
      game.newGame();
      let hands = 1, guard = 0;
      for (;;) {
        if (++guard > 50000) return { stuck: 'too many steps', score: S.score, hands };
        if (clock.tick()) continue;
        if (S.phase === 'gameOver') break;
        if (S.phase === 'handEnd') {
          if (++hands > 500) return { stuck: 'too many hands', score: S.score, hands };
          checkHand(S); game.next(); continue;
        }
        if (S.turn === 0 && (S.phase === 'bid' || S.phase === 'play')) { game.botMove(0); continue; }
        return { stuck: `nothing to do in phase ${S.phase}, turn ${S.turn}`, score: S.score, hands };
      }
      checkHand(S);
      if (S.winnerTeam == null) return { stuck: 'game over without a winner', score: S.score, hands };
      if (!S.result.moonMade && S.score[S.winnerTeam] < WIN_AT) return { stuck: `winner has only ${S.score[S.winnerTeam]}`, score: S.score, hands };
      // The simulator counts "us" as the winner when score[0] > score[1]; make that match the real winner.
      const score = S.winnerTeam === 0 ? [Math.max(S.score[0], S.score[1] + 1), S.score[1]] : [S.score[0], Math.max(S.score[1], S.score[0] + 1)];
      const out = { score, realScore: [...S.score], hands, moves: moves.value };
      if (render) out.render = screens.value;
      return out;
    } finally {
      Math.random = realRandom;
    }
  };
}

// Every hand: 24 cards played, all hands empty, points add up.
function checkHand(S) {
  if (S.history.length !== 24) throw new Error(`hand ended after ${S.history.length} cards`);
  if (S.hands.some(h => h.length)) throw new Error('hand ended with cards left');
  const r = S.result;
  if (r.points[0] + r.points[1] > r.available) throw new Error('more points than available');
  if (r.count[0] + r.count[1] !== S.history.reduce((s, e) => s + ({ '10': 10, A: 4, K: 3, Q: 2, J: 1 }[e.card.r] || 0), 0)) throw new Error('game count mismatch');
}
