// Settings shared by all games: computer difficulty, game speed and theme,
// plus Cribbage's counting choices.
//
// Nothing is saved on the phone or sent anywhere. Settings live in memory,
// and travel in the page link (the part after #) when you move between the
// game list and a game, e.g. euchre/#theme=dark&speed=fast. That part of a
// link never leaves the phone. Close the page and they're back to defaults.
//
// To save settings properly later, write a "store" with load() and save(values)
// and pass it to createSettings(). Nothing else needs to change.

export const DEFAULTS = Object.freeze({
  difficulty: 'medium',
  speed: 'normal',
  theme: 'system',
  muggins: 'on',        // Cribbage: you count your own hands. Only on Hard; Easy and Medium never use it.
  count: 'animate',     // Cribbage: show the count one combination at a time, or 'totals'
  mycount: 'level'      // Cribbage: who counts your hand: 'you', 'auto', or 'level' (automatic on Easy, you otherwise)
});

// Allowed values, in the order they're shown.
export const CHOICES = Object.freeze({
  difficulty: ['easy', 'medium', 'hard'],
  speed: ['slow', 'normal', 'fast'],
  theme: ['system', 'light', 'dark'],
  muggins: ['on', 'off'],
  count: ['animate', 'totals'],
  mycount: ['level', 'you', 'auto']
});

// How much longer (or shorter) computer pauses are at each speed.
export const SPEED_FACTOR = Object.freeze({ slow: 1.6, normal: 1, fast: 0.55 });

// Keeps nothing beyond this page visit.
export function memoryStore() {
  let saved = {};
  return { load: () => ({ ...saved }), save: values => { saved = { ...values }; } };
}

// Turn settings into "#theme=dark&speed=fast" (only the ones that aren't defaults).
export function settingsHash(values) {
  const parts = Object.keys(DEFAULTS)
    .filter(k => values[k] !== undefined && values[k] !== DEFAULTS[k])
    .map(k => `${k}=${values[k]}`);
  return parts.length ? '#' + parts.join('&') : '';
}

// Read settings from "#theme=dark&speed=fast", ignoring anything unknown.
export function readHash(hash) {
  const out = {};
  for (const part of String(hash || '').replace(/^#/, '').split('&')) {
    const [k, v] = part.split('=');
    if (CHOICES[k] && CHOICES[k].includes(v)) out[k] = v;
  }
  return out;
}

// Memory plus the page link: starts from the link, and keeps the link up to
// date (without adding to Back history) so links to other pages can carry it.
export function linkStore() {
  return {
    load: () => readHash(location.hash),
    save(values) {
      const url = location.pathname + location.search + settingsHash(values);
      try { history.replaceState(history.state, '', url); } catch (e) { /* not essential */ }
    }
  };
}

export function createSettings(defaults = DEFAULTS, store = memoryStore()) {
  let values = { ...defaults, ...store.load() };
  const listeners = new Set();
  return {
    get: key => values[key],
    all: () => ({ ...values }),
    set(key, value) {
      if (values[key] === value) return;
      values = { ...values, [key]: value };
      store.save(values);
      for (const fn of listeners) fn(key, value);
    },
    // Call fn(key, value) whenever a setting changes. Returns a function that stops it.
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    // A link to another page (e.g. the game list) that carries these settings.
    link: href => href.replace(/#.*$/, '') + settingsHash(values)
  };
}

// The settings for this page: in memory, starting from (and kept in) the link.
export const settings = createSettings(DEFAULTS, typeof location === 'undefined' ? memoryStore() : linkStore());
