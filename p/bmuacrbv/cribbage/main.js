// Cribbage page: connects the game to the screen, the board and your taps.
import { settings, SPEED_FACTOR } from '../../../shared/settings.js';
import { createTimer } from '../../../shared/timing.js';
import { followTheme } from '../../../shared/theme.js';
import { createSheet, feedbackHref, menuHTML, levelHTML, segHTML, bindSettings, askBeforeLevelChange, addRotateNotice } from '../../../shared/ui.js';
import { createCribbage } from './game.js';
import { renderHTML } from './view.js';
import { createBoard } from './board.js';
import { rulesHTML, LEVEL_ABOUT } from './rules-text.js';
import { VERSION } from './version.js';

const speed = () => SPEED_FACTOR[settings.get('speed')] || 1;
// Muggins only exists on Hard, when you count and the missed-points reminder is off.
const mugginsFor = (level, m, mine = settings.get('mycount'), rem = settings.get('remind')) =>
  level === 'hard' && m === 'on' && mine !== 'auto' && rem === 'off';
// Who counts your hand and crib: you, or automatic. 'level' means automatic on Easy, you otherwise.
const youCountFor = (level, mine) => mine === 'you' || (mine === 'level' && level !== 'easy');

const app = document.getElementById('app');
const timer = createTimer({ speed });
const board = createBoard({ stepMs: holes => Math.min(90, 1000 / holes) * speed() });
const game = createCribbage({
  timer,
  levelAtStart: () => settings.get('difficulty'),          // fixed for the whole game
  mugginsAtStart: () => mugginsFor(settings.get('difficulty'), settings.get('muggins')),
  youCount: () => youCountFor(S.level, settings.get('mycount')),
  remind: () => settings.get('remind') === 'on',
  animate: () => settings.get('count') === 'animate',
  onChange: render
});
const S = game.state;

function render() {
  app.innerHTML = renderHTML(S, {
    legal: game.legal,
    version: VERSION,
    feedback: feedbackHref({ game: 'Cribbage', version: VERSION })
  });
  S.justDealt = false;
  // The board lives outside the redraws, so pegs can keep moving while the screen updates.
  const slot = app.querySelector('.board-slot');
  if (slot) { slot.appendChild(board.el); board.update(S.pegs); }
}

followTheme(settings);
addRotateNotice('Cribbage');

// ---------- Menu ----------
const sheetEl = document.getElementById('sheet');
const sheet = createSheet(sheetEl);

function cribbageSettings() {
  const mug = mugginsFor(settings.get('difficulty'), settings.get('muggins')) ? 'on' : 'off';
  const mine = mug === 'on' || youCountFor(settings.get('difficulty'), settings.get('mycount')) ? 'you' : 'auto';
  return levelHTML(settings, LEVEL_ABOUT, { title: 'How well the computer plays' }) +
    `<div class="set"><h3>Counting your hand and crib</h3>
      ${segHTML({ label: 'Counting your hand and crib', key: 'mycount', options: [['you', 'You count'], ['auto', 'Automatic']], value: mine })}
      <p class="note">Easy counts for you to start with.</p>
      <h3>Missed points</h3>
      ${segHTML({ label: 'Missed points', key: 'remind', options: [['on', 'Tell me'], ['off', 'Don’t tell me']], value: mug === 'on' ? 'off' : settings.get('remind') })}
      <p class="note">When you count: “Tell me” says how many points you missed, so you can keep looking. Points still missed are lost.</p>
      <h3>Muggins</h3>
      ${segHTML({ label: 'Muggins', key: 'muggins', options: [['off', 'Off'], ['on', 'On']], value: mug })}
      <p class="note">Hard only, no reminders: the computer takes the points you miss.</p>
      <h3>Showing the count</h3>
      ${segHTML({ label: 'Showing the count', key: 'count', options: [['animate', 'One at a time'], ['totals', 'Totals only']], value: settings.get('count') })}</div>`;
}
const openMenu = () => sheet.open(menuHTML({
  lead: cribbageSettings(),
  items: [['new', 'New game', true], ['rules', 'Rules']],
  settings, allGames: '../'
}), { labelledBy: 'menu-h' });
const openRules = () => sheet.open(rulesHTML, { cls: 'rules', labelledBy: 'rules-h' });

// A game counts as started once the cut for deal has happened, until it's over.
const inProgress = () => S.phase !== 'gameOver' && !(S.phase === 'cut' && !S.cut);

// How the count is shown, who counts, and the reminder change right away: no new game needed.
// (Except Automatic or "Tell me" in a muggins game: that ends muggins, a rules change, asked below.)
sheetEl.addEventListener('click', e => {
  const b = e.target.closest('[data-count],[data-mycount],[data-remind]');
  if (!b) return;
  if (S.muggins && (b.dataset.mycount === 'auto' || b.dataset.remind === 'on')) return;
  e.stopPropagation();
  if (b.dataset.count) settings.set('count', b.dataset.count);
  if (b.dataset.remind) settings.set('remind', b.dataset.remind);
  if (b.dataset.mycount) settings.set('mycount', b.dataset.mycount);
  if (b.dataset.mycount === 'auto' || b.dataset.remind === 'on') settings.set('muggins', 'off');
  openMenu();
}, true);
// Level and muggins: changing either during a game asks first, then starts a new game.
askBeforeLevelChange({
  el: sheetEl, sheet, settings, inProgress, openMenu, newGame: () => game.newGame(),
  pick: b => {
    if (b.dataset.difficulty) return b.dataset.difficulty === settings.get('difficulty') ? null
      : { difficulty: b.dataset.difficulty, muggins: 'off', mycount: 'level', remind: 'on' };   // a new level resets counting
    if (b.dataset.muggins === 'on') return { difficulty: 'hard', muggins: 'on', mycount: 'you', remind: 'off' };   // muggins: Hard, you count, no reminders
    if (b.dataset.mycount === 'auto') return { difficulty: settings.get('difficulty'), muggins: 'off', mycount: 'auto' };
    if (b.dataset.remind === 'on') return { difficulty: settings.get('difficulty'), muggins: 'off', remind: 'on' };
    if (b.dataset.muggins === 'off') return { difficulty: settings.get('difficulty'), muggins: 'off' };
    return null;
  },
  matches: w => w.difficulty === S.level && mugginsFor(w.difficulty, w.muggins, w.mycount || settings.get('mycount'), w.remind || settings.get('remind')) === S.muggins
});
bindSettings(sheetEl, settings);

sheetEl.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (!a) return;
  const act = a.dataset.act;
  if (act === 'new') { sheet.close(); game.newGame(); }
  if (act === 'rules') openRules();
});

// ---------- the table ----------
app.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (a) {
    if (a.disabled) return;
    const act = a.dataset.act;
    if (act === 'menu') return openMenu();
    if (act === 'next') return game.next();
    if (act === 'cut') return game.you.cut();
    if (act === 'crib') return game.you.crib();
    if (act === 'go') return game.you.go();
    if (act === 'claim') return game.you.claim(a.dataset.k);
    if (act === 'unclaim') return game.you.unclaim(+a.dataset.i);
    if (act === 'done') return game.you.done();
    return;
  }
  const c = e.target.closest('[data-card]');
  if (c) {
    if (S.phase === 'discard') return game.you.pick(c.dataset.card);
    if (S.phase === 'claim') return game.you.select(c.dataset.card);
    return game.you.play(c.dataset.card);
  }
  if (S.phase === 'count') game.skip();          // tap anywhere to skip to the total
});

// Offline support.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

game.newGame();
