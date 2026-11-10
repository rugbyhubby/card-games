// Cribbage page: connects the game to the screen, the board and your taps.
import { settings, SPEED_FACTOR } from '../../../shared/settings.js';
import { createTimer } from '../../../shared/timing.js';
import { followTheme } from '../../../shared/theme.js';
import { createSheet, feedbackHref, menuHTML, levelHTML, segHTML, bindSettings, addRotateNotice } from '../../../shared/ui.js';
import { createCribbage } from './game.js';
import { renderHTML } from './view.js';
import { createBoard } from './board.js';
import { rulesHTML, LEVEL_ABOUT } from './rules-text.js';
import { VERSION } from './version.js';

const speed = () => SPEED_FACTOR[settings.get('speed')] || 1;
// Muggins only exists on Hard (on unless you turn it off).
const mugginsFor = (level, m) => level === 'hard' && m === 'on';

const app = document.getElementById('app');
const timer = createTimer({ speed });
const board = createBoard({ stepMs: holes => Math.min(90, 1000 / holes) * speed() });
const game = createCribbage({
  timer,
  levelAtStart: () => settings.get('difficulty'),          // fixed for the whole game
  mugginsAtStart: () => mugginsFor(settings.get('difficulty'), settings.get('muggins')),
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
  return levelHTML(settings, S.level, LEVEL_ABOUT, { title: 'How well the computer plays', note: false }) +
    `<div class="set"><h3>Muggins</h3>
      ${segHTML({ label: 'Muggins', key: 'muggins', options: [['off', 'Off'], ['on', 'On']], value: mug })}
      <p class="note">Hard only. You count your own hands; miss points and the computer takes them.</p>
      <h3>Counting</h3>
      ${segHTML({ label: 'Counting', key: 'count', options: [['animate', 'Animate the count'], ['totals', 'Totals only']], value: settings.get('count') })}</div>`;
}
const openMenu = () => sheet.open(menuHTML({
  lead: cribbageSettings(),
  items: [['new', 'New game', true], ['rules', 'Rules']],
  settings, allGames: '../'
}), { labelledBy: 'menu-h' });
const openRules = () => sheet.open(rulesHTML, { cls: 'rules', labelledBy: 'rules-h' });

// A game counts as started once the cut for deal has happened, until it's over.
const inProgress = () => S.phase !== 'gameOver' && !(S.phase === 'cut' && !S.cut);
let pendingChange = null;

// Level and muggins: changing either during a game asks first, then starts a new game.
// Runs before bindSettings() sees the tap (capture), so nothing changes until you say so.
sheetEl.addEventListener('click', e => {
  const b = e.target.closest('[data-difficulty],[data-muggins],[data-count]');
  if (!b) return;
  e.stopPropagation();
  if (b.dataset.count) { settings.set('count', b.dataset.count); return openMenu(); }
  let want;
  if (b.dataset.difficulty) {
    if (b.dataset.difficulty === settings.get('difficulty')) return;
    want = { difficulty: b.dataset.difficulty, muggins: 'on' };          // picking a level resets muggins
  } else if (b.dataset.muggins === 'on') want = { difficulty: 'hard', muggins: 'on' };
  else want = { difficulty: settings.get('difficulty'), muggins: 'off' };
  const apply = () => { settings.set('difficulty', want.difficulty); settings.set('muggins', want.muggins); };
  const same = want.difficulty === S.level && mugginsFor(want.difficulty, want.muggins) === S.muggins;
  if (same) { apply(); return openMenu(); }
  if (!inProgress()) { apply(); sheet.close(); return game.newGame(); }
  pendingChange = apply;
  sheet.open(`<p class="ask" id="ask-h">Changing levels will start a new game. Continue?</p>
    <div class="ask-btns"><button class="btn" data-act="keep">Cancel</button><button class="btn pri" data-act="change">Continue</button></div>`, { labelledBy: 'ask-h' });
}, true);
bindSettings(sheetEl, settings);

sheetEl.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (!a) return;
  const act = a.dataset.act;
  if (act === 'new') { sheet.close(); game.newGame(); }
  if (act === 'rules') openRules();
  if (act === 'change') { if (pendingChange) pendingChange(); pendingChange = null; sheet.close(); game.newGame(); }
  if (act === 'keep') { pendingChange = null; openMenu(); }
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
