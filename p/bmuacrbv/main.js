// Game list page: settings sheet, links that carry settings into a game, offline support.
import { settings } from '../../shared/settings.js';
import { followTheme } from '../../shared/theme.js';
import { createSheet, settingsHTML, bindSettings, feedbackHref } from '../../shared/ui.js';
import { VERSION } from './version.js';

followTheme(settings);

const app = document.getElementById('app');
bindSettings(app, settings);   // game links carry your settings into the game

// Keep the game links' addresses current too (for long-press "Open in new tab").
const refreshLinks = () => app.querySelectorAll('a[data-carry]').forEach(a => { a.href = settings.link(a.dataset.carry); });
refreshLinks();
settings.onChange(refreshLinks);

document.getElementById('ver').textContent = 'v' + VERSION;
document.getElementById('fb').href = feedbackHref({ game: 'Card Games', version: VERSION });

const sheetEl = document.getElementById('sheet');
const sheet = createSheet(sheetEl);
bindSettings(sheetEl, settings);
app.addEventListener('click', e => {
  if (e.target.closest('[data-act="settings"]')) {
    sheet.open(`<h2 id="settings-h">Settings</h2>${settingsHTML(settings)}
      <div class="done"><button class="btn pri" data-close>Done</button></div>`, { labelledBy: 'settings-h' });
  }
});

// Offline support: this page's helper, plus each game's own, so a game opened
// from here works offline even if it was never opened on its own.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.register('euchre/sw.js', { scope: 'euchre/' }).catch(() => {});
    navigator.serviceWorker.register('pitch/sw.js', { scope: 'pitch/' }).catch(() => {});
  });
}
