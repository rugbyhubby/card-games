// Pitch page: connects the game to the screen and to your taps.
import { settings, SPEED_FACTOR } from '../../../shared/settings.js';
import { createTimer } from '../../../shared/timing.js';
import { followTheme } from '../../../shared/theme.js';
import { createSheet, feedbackHref, menuHTML, levelHTML, bindSettings, askBeforeLevelChange, addRotateNotice } from '../../../shared/ui.js';
import { createPitch } from './game.js';
import { renderHTML } from './view.js';
import { rulesHTML, LEVEL_ABOUT } from './rules-text.js';
import { VERSION } from './version.js';

const app = document.getElementById('app');
let started = false;
const timer = createTimer({ speed: () => SPEED_FACTOR[settings.get('speed')] || 1 });
const game = createPitch({
  timer,
  levelAtStart: () => settings.get('difficulty'),   // chosen in the Menu; fixed for the whole game
  onChange: render,
  onEvent: () => { started = true; }                // any bid or card means the game is under way
});
const S = game.state;

function render() {
  app.innerHTML = renderHTML(S, {
    legal: game.legal,
    bidOptions: game.bidOptions,
    version: VERSION,
    feedback: feedbackHref({ game: 'Pitch', version: VERSION })
  });
  S.justDealt = false;
  if (S.phase === 'gameOver') started = false;
}

followTheme(settings);
addRotateNotice('Pitch');

// Pop-up sheets (menu, rules) sit outside #app so the game's redraws don't close them.
const sheetEl = document.getElementById('sheet');
const sheet = createSheet(sheetEl);
const openMenu = () => sheet.open(menuHTML({
  lead: levelHTML(settings, LEVEL_ABOUT),
  items: [['new', 'New game', true], ['rules', 'Rules']],
  settings, allGames: '../'
}), { labelledBy: 'menu-h' });
const openRules = () => sheet.open(rulesHTML, { cls: 'rules', labelledBy: 'rules-h' });
const newGame = () => { started = false; game.newGame(); };

// Changing the level during a game asks first, then starts a new game.
askBeforeLevelChange({
  el: sheetEl, sheet, settings, openMenu, newGame,
  matches: w => w.difficulty === S.level,
  inProgress: () => started && S.phase !== 'gameOver'
});
bindSettings(sheetEl, settings);

sheetEl.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (!a) return;
  if (a.dataset.act === 'new') { sheet.close(); newGame(); }
  if (a.dataset.act === 'rules') openRules();
});

app.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (a) {
    const act = a.dataset.act;
    if (act === 'menu') return openMenu();
    if (act === 'next') return game.next();
    if (act === 'bid') return game.you.bid(+a.dataset.b);
    if (act === 'pass') return game.you.pass();
    return;
  }
  const c = e.target.closest('[data-card]');
  if (c) game.you.play(c.dataset.card);
});

// Offline support.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

newGame();
