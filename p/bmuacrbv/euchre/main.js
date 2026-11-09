// Euchre page: connects the game to the screen and to your taps.
import { settings, SPEED_FACTOR } from '../../../shared/settings.js';
import { createTimer } from '../../../shared/timing.js';
import { followTheme } from '../../../shared/theme.js';
import { createSheet, feedbackHref, menuHTML, bindSettings } from '../../../shared/ui.js';
import { createEuchre } from './game.js';
import { renderHTML } from './view.js';
import { rulesHTML } from './rules-text.js';
import { VERSION } from './version.js';

const app = document.getElementById('app');
const timer = createTimer({ speed: () => SPEED_FACTOR[settings.get('speed')] || 1 });
const game = createEuchre({
  timer,
  difficultyFor: () => settings.get('difficulty'),
  onChange: render
});
const S = game.state;

function render() {
  app.innerHTML = renderHTML(S, {
    legal: game.legal,
    difficulty: settings.get('difficulty'),
    version: VERSION,
    feedback: feedbackHref({ game: 'Euchre', version: VERSION })
  });
  S.justDealt = false;
}

followTheme(settings);
settings.onChange(key => { if (key === 'difficulty') render(); });

// Pop-up sheets (menu, rules) sit outside #app so the game's redraws don't close them.
const sheetEl = document.getElementById('sheet');
const sheet = createSheet(sheetEl);
bindSettings(sheetEl, settings);
const openMenu = () => sheet.open(menuHTML({
  items: [['new', 'New game', true], ['rules', 'Rules']],
  settings, allGames: '../'
}), { labelledBy: 'menu-h' });
const openRules = () => sheet.open(rulesHTML, { cls: 'rules', labelledBy: 'rules-h' });

sheetEl.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (!a) return;
  if (a.dataset.act === 'new') { sheet.close(); game.newGame(); }
  if (a.dataset.act === 'rules') openRules();
});

app.addEventListener('click', e => {
  const d = e.target.closest('[data-diff]');
  if (d && !d.disabled) return settings.set('difficulty', d.dataset.diff);
  const a = e.target.closest('[data-act]');
  if (a) {
    const act = a.dataset.act;
    if (act === 'menu') return openMenu();
    if (act === 'next') return game.next();
    if (act === 'alone') return game.you.toggleAlone();
    if (act === 'pass') return game.you.pass();
    if (act === 'order') return game.you.order();
    if (act === 'call') return game.you.call(a.dataset.s);
    return;
  }
  const c = e.target.closest('[data-card]');
  if (c) {
    if (S.phase === 'discard') return game.you.discard(c.dataset.card);
    return game.you.play(c.dataset.card);
  }
});

// Offline support.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

game.newGame();
