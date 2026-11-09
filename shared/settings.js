// Settings shared by all games: computer difficulty, game speed and theme.
//
// For now settings live in memory only: they reset when the page is closed or
// reloaded. Nothing is written to the phone or sent anywhere.
//
// To save them later, write a "store" with load() and save(values) and pass it
// to createSettings(). Nothing else needs to change.

export const DEFAULTS = Object.freeze({
  difficulty: 'medium',   // 'easy' | 'medium' | 'hard'
  speed: 'normal',        // 'slow' | 'normal' | 'fast'
  theme: 'system'         // 'system' | 'light' | 'dark'
});

// How much longer (or shorter) computer pauses are at each speed.
export const SPEED_FACTOR = Object.freeze({ slow: 1.6, normal: 1, fast: 0.55 });

// The default store: keeps nothing beyond this page visit.
export function memoryStore() {
  let saved = {};
  return { load: () => ({ ...saved }), save: values => { saved = { ...values }; } };
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
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
}

// The settings for this page.
export const settings = createSettings();
