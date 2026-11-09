// Screen parts around the table: score header, controls, status line,
// action buttons, footer, the end-of-hand / game-over sheet, pop-up sheets
// (like the rules), the menu and settings sheet, and the feedback email link.
import { CHOICES } from './settings.js';

// One score: big number with a small label under it.
export const scoreHTML = ({ label, value, cls = '' }) =>
  `<div class="sc${cls ? ' ' + cls : ''}"><b>${value}</b><span>${label}</span></div>`;

// Title on the left, scores on the right. scores: [{ label, value, cls }].
export function headerHTML(title, scores) {
  return `<header class="top">
      <div class="title">${title}</div>
      <div class="scores">
        ${scores.map(scoreHTML).join('\n        ')}
      </div>
    </header>`;
}

// A row of linked buttons, one pressed (e.g. Easy / Medium / Hard).
// options: [[value, label, disabledNote?]]. Each button gets data-<key>="value".
export function segHTML({ label, key, options, value }) {
  return `<div class="seg" role="group" aria-label="${label}">
        ${options.map(([k, l, off]) => `<button data-${key}="${k}" aria-pressed="${value === k}" ${off ? `disabled title="${off}"` : ''}>${l}</button>`).join('')}
      </div>`;
}

// Underlined text button for the menu. Tapping it sends data-act="<act>".
export const linkHTML = (act, label) => `<button class="link" data-act="${act}">${label}</button>`;

// The controls row under the header: something on the left, menu links on the right.
export function controlsHTML(left, links) {
  return `<div class="controls">
      ${left}
      <div class="menu">
        ${links.join('\n        ')}
      </div>
    </div>`;
}

// What's happening now, plus a smaller second line.
export function statusHTML(message, detail) {
  return `<div class="status" aria-live="polite">
      <div class="msg">${message || ''}</div>
      <div class="tricks">${detail || '&nbsp;'}</div>
    </div>`;
}

export const actionsHTML = inner => `<div class="actions">${inner}</div>`;
// Your hand. `count` (number of cards) lets the cards shrink to fit when there are many.
export const handHTML = (inner, count) =>
  `<div class="hand"${count ? ` style="--n:${count}"` : ''}>${inner}</div>`;

// Small line at the bottom: version and feedback link.
export const footHTML = (version, feedback) =>
  `<div class="foot"><span>v${version}</span><span aria-hidden="true">·</span><a href="${feedback}">Send feedback</a></div>`;

// End-of-hand / game-over sheet over the table, with the scores and one button.
// The button sends data-act="<act>".
export function resultSheetHTML({ title, scores, body, button, act = 'next' }) {
  return `<div class="ov"><div class="sheet" role="dialog" aria-modal="true">
      <h2>${title}</h2>
      <div class="fs">${scores.map(scoreHTML).join('')}</div>
      <p>${body}</p>
      <button class="btn pri" data-act="${act}">${button}</button></div></div>`;
}

// A pop-up sheet that lives outside the game area, so the game redrawing
// underneath doesn't close it. Closes on a [data-close] button, a tap on the
// dimmed background, or Escape, and puts focus back where it was.
export function createSheet(el) {
  let returnTo = null;
  function close() {
    if (el.hidden) return;
    el.hidden = true; el.innerHTML = '';
    if (returnTo && returnTo.isConnected) returnTo.focus();
  }
  el.addEventListener('click', e => {
    if (e.target.closest('[data-close]') || e.target.classList.contains('ov')) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !el.hidden) close(); });
  return {
    // `cls` adds a class to the sheet (e.g. 'rules' for a long scrolling one).
    // `labelledBy` is the id of its heading, for screen readers.
    open(inner, { cls = '', labelledBy = '' } = {}) {
      returnTo = document.activeElement;
      el.innerHTML = `<div class="ov"><div class="sheet${cls ? ' ' + cls : ''}" role="dialog" aria-modal="true"${labelledBy ? ` aria-labelledby="${labelledBy}"` : ''} tabindex="-1">${inner}</div></div>`;
      el.hidden = false;
      el.querySelector('.sheet').focus();
    },
    close,
    get isOpen() { return !el.hidden; }
  };
}

// mailto: link for "Send feedback", with version and device details filled in.
export function feedbackHref({ game, version, to = 'contact@rugbyhubby.com' }) {
  const standalone = window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  const body = [
    'What happened, or what would you change?', '', '', '',
    '---',
    `${game} version: ${version}`,
    `Opened from: ${standalone ? 'Home Screen app' : 'browser'}`,
    `Screen: ${screen.width}×${screen.height} @${window.devicePixelRatio}x`,
    `Device/browser: ${navigator.userAgent}`
  ].join('\n');
  return `mailto:${to}?subject=` + encodeURIComponent(`${game} feedback v${version}`) +
    '&body=' + encodeURIComponent(body);
}

// ---------- settings and menu ----------

const LABELS = {
  speed: { slow: 'Slow', normal: 'Normal', fast: 'Fast' },
  theme: { system: 'System', light: 'Light', dark: 'Dark' }
};

// Game speed and theme controls, shared by every game and the game list.
export function settingsHTML(settings) {
  const row = (key, title) => `<h3>${title}</h3>
      ${segHTML({ label: title, key, options: CHOICES[key].map(v => [v, LABELS[key][v]]), value: settings.get(key) })}`;
  return `<div class="set">${row('speed', 'Game speed')}${row('theme', 'Theme')}</div>`;
}

// Make the settings controls inside `el` work, and keep links marked
// data-carry="<page>" pointing at that page with the current settings.
export function bindSettings(el, settings) {
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-speed],[data-theme]');
    if (b) {
      const key = b.dataset.speed ? 'speed' : 'theme';
      settings.set(key, b.dataset[key]);
      el.querySelectorAll(`[data-${key}]`).forEach(x => x.setAttribute('aria-pressed', String(x.dataset[key] === settings.get(key))));
      el.querySelectorAll('a[data-carry]').forEach(x => { x.href = settings.link(x.dataset.carry); });
      return;
    }
    const a = e.target.closest('a[data-carry]');
    if (a) a.href = settings.link(a.dataset.carry);   // just before the browser follows it
  });
}

// Inside of a game's menu sheet: the game's own buttons, then settings,
// then a link back to the game list. items: [[act, label, primary?]].
export function menuHTML({ items, settings, allGames = '../' }) {
  return `<h2 id="menu-h">Menu</h2>
    <div class="menu-actions">${items.map(([act, label, pri]) => `<button class="btn${pri ? ' pri' : ''}" data-act="${act}">${label}</button>`).join('')}</div>
    ${settingsHTML(settings)}
    <div class="menu-foot"><a class="link" href="${settings.link(allGames)}" data-carry="${allGames}">‹ All games</a><button class="btn" data-close>Done</button></div>`;
}
