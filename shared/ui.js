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
  difficulty: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
  speed: { slow: 'Slow', normal: 'Normal', fast: 'Fast' },
  theme: { system: 'System', light: 'Light', dark: 'Dark' }
};

// Game speed and theme controls, shared by every game and the game list.
export function settingsHTML(settings) {
  const row = (key, title) => `<h3>${title}</h3>
      ${segHTML({ label: title, key, options: CHOICES[key].map(v => [v, LABELS[key][v]]), value: settings.get(key) })}`;
  return `<div class="set">${row('speed', 'Game speed')}${row('theme', 'Theme')}</div>`;
}

// Computer level, for a game's menu. Changing it during a game asks first and
// then starts a new game (see askBeforeLevelChange below).
export const levelLabel = level => LABELS.difficulty[level] || level;
// `about` gives each level a one-line, plain-language description: { easy, medium, hard }.
export function levelHTML(settings, about = {}, { title = 'How well the computers play' } = {}) {
  const chosen = settings.get('difficulty');
  return `<div class="set"><h3>${title}</h3>
      ${segHTML({ label: title, key: 'difficulty', options: CHOICES.difficulty.map(v => [v, LABELS.difficulty[v]]), value: chosen })}
      ${CHOICES.difficulty.filter(v => about[v]).map(v => `<p class="about" data-level-about="${v}"${v === chosen ? '' : ' hidden'}>${about[v]}</p>`).join('')}</div>`;
}

// Changing the level in a game's menu. If a game is under way it asks
// "Changing levels will start a new game. Continue?" first; Cancel goes back
// to the menu with nothing changed, Continue starts a new game on the new level.
//   el, sheet     the menu's sheet element and createSheet() for it
//   pick(button)  the settings a tapped button asks for, e.g. { difficulty: 'hard' }, or null
//                 if it isn't a level button (default: the Easy / Medium / Hard buttons)
//   matches(want) true if the game on screen already uses those settings (nothing to do)
//   inProgress()  true once a game has really started and isn't over
//   openMenu()    redraws the menu; newGame() starts a new game
// Listens before bindSettings() does, so nothing changes until you say so.
export function askBeforeLevelChange({ el, sheet, settings, matches, inProgress, openMenu, newGame,
  pick = b => b.dataset.difficulty ? { difficulty: b.dataset.difficulty } : null }) {
  let pending = null;
  const apply = want => Object.entries(want).forEach(([k, v]) => settings.set(k, v));
  el.addEventListener('click', e => {
    const ask = e.target.closest('[data-ask]');
    if (ask) {
      e.stopPropagation();
      const want = pending; pending = null;
      if (ask.dataset.ask === 'change' && want) { apply(want); sheet.close(); return newGame(); }
      return openMenu();
    }
    const b = e.target.closest('button');
    const want = b && pick(b);
    if (!want) return;
    e.stopPropagation();
    if (matches(want)) { apply(want); return openMenu(); }
    if (!inProgress()) { apply(want); sheet.close(); return newGame(); }
    pending = want;
    sheet.open(`<p class="ask" id="ask-h">Changing levels will start a new game. Continue?</p>
      <div class="ask-btns"><button class="btn" data-ask="keep">Cancel</button><button class="btn pri" data-ask="change">Continue</button></div>`, { labelledBy: 'ask-h' });
  }, true);
}

// Make the settings controls inside `el` work, and keep links marked
// data-carry="<page>" pointing at that page with the current settings.
export function bindSettings(el, settings) {
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-speed],[data-theme],[data-difficulty]');
    if (b) {
      const key = ['speed', 'theme', 'difficulty'].find(k => b.dataset[k]);
      settings.set(key, b.dataset[key]);
      el.querySelectorAll(`[data-${key}]`).forEach(x => x.setAttribute('aria-pressed', String(x.dataset[key] === settings.get(key))));
      el.querySelectorAll('a[data-carry]').forEach(x => { x.href = settings.link(x.dataset.carry); });
      el.querySelectorAll('[data-level-about]').forEach(n => { n.hidden = n.dataset.levelAbout !== settings.get('difficulty'); });
      return;
    }
    const a = e.target.closest('a[data-carry]');
    if (a) a.href = settings.link(a.dataset.carry);   // just before the browser follows it
  });
}

// Inside of a game's menu sheet: optional `lead` (e.g. levelHTML()), the game's
// own buttons, then settings, then a link back to the game list.
// items: [[act, label, primary?]].
export function menuHTML({ items, settings, allGames = '../', lead = '' }) {
  return `<h2 id="menu-h">Menu</h2>
    ${lead}
    <div class="menu-actions">${items.map(([act, label, pri]) => `<button class="btn${pri ? ' pri' : ''}" data-act="${act}">${label}</button>`).join('')}</div>
    ${settingsHTML(settings)}
    <div class="menu-foot"><a class="link" href="${settings.link(allGames)}" data-carry="${allGames}">‹ All games</a><button class="btn" data-close>Done</button></div>`;
}

// ---------- phone held sideways ----------

// Card tables need the phone upright. When a phone is turned sideways (short
// and wide), this covers the game with a "turn your phone upright" note; the
// game reappears as soon as it's turned back. iPads and computers never see it.
// The showing and hiding is done by parts.css, so it reacts instantly.
export function addRotateNotice(game) {
  if (document.querySelector('.rotate')) return;
  const el = document.createElement('div');
  el.className = 'rotate';
  el.innerHTML = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="20" y="8" width="24" height="44" rx="4"/><path d="M29 46h6"/>
      <path d="M50 22a20 20 0 0 1 2 18"/><path d="M48 38l4 3 3-4"/></svg>
    <h2>Turn your phone upright</h2>
    <p>${game} is made to be played with your phone held upright.</p>`;
  document.body.appendChild(el);
}
