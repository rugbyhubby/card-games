// Card drawings: faces, backs and the small backs shown in opponents' hands.
// Cards stay white with black and red suits in both light and dark themes (see parts.css).
import { SYM, isRed, cardName } from './deck.js';

// A face-up card (a button, so it can be tapped). With no card, a face-down back.
// `cls` adds classes (e.g. 'can', 'win'); `attrs` adds attributes (e.g. data-card="9H").
export function cardHTML(c, cls = '', attrs = '') {
  if (!c) return backHTML(cls, attrs);
  const red = isRed(c.s) ? ' red' : '';
  return `<button class="card${red} ${cls}" ${attrs} aria-label="${cardName(c)}"><span class="ix">${c.r}<i>${SYM[c.s]}</i></span><span class="pip">${SYM[c.s]}</span></button>`;
}

export function backHTML(cls = '', attrs = '') {
  return `<div class="card back ${cls}" ${attrs}></div>`;
}

// A row of `count` small card backs, for a seat's hand.
// `dealt` plays the dealing animation; `delay(i)` staggers it in milliseconds.
export function miniFanHTML(count, { dealt = false, delay = i => i * 90 } = {}) {
  let h = '';
  for (let i = 0; i < count; i++) h += `<div class="mini${dealt ? ' dealt' : ''}" style="animation-delay:${delay(i)}ms"></div>`;
  return h;
}
