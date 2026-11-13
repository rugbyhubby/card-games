// Drawing pieces for the lessons: Dot's art, her mug and napkin, the big napkin,
// the kitchen and the Jack-jump ladder. Strings of HTML only; main.js wires them up.
import { SYM, isRed } from '../../../../shared/deck.js';

export const POSE_NAME = {
  sip: 'sipping coffee', lean: 'leaning in', nod: 'nodding', brow: 'raising an eyebrow', palm: 'face-palming',
  pin: 'holding a rolling pin', clap: 'slow clapping', smug: 'looking smug', tap: 'waiting on you'
};
// Dot's drawings, one per pose (art/dot-<pose>.png). See ip/grandma-dot/ for where they came from.
export const art = (pose, cls = '') => `<img class="${cls}" src="art/dot-${pose}.png" alt="Grandma Dot, ${POSE_NAME[pose] || ''}">`;

export const MUG = `<svg class="mug" viewBox="0 0 22 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
  <path d="M6.5 6q-2-2.5 0-5M10.5 6q2-2.5 0-5" stroke-width="1"/><path d="M15 11q5 0 5 4t-5 4"/><path d="M4 9h11v10q0 3-3 3h-5q-3 0-3-3z" class="paper"/></svg>`;

// The small napkin by her mug: one tally mark per putz play.
export function napkin(n, fresh = false) {
  let m = '';
  for (let i = 0; i < n; i++) m += `<path d="M${7 + i * 4} 10v14"${fresh && i === n - 1 ? ' class="new"' : ''}/>`;
  return `<svg class="napkin" viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" role="img" aria-label="Napkin: ${n} mark${n === 1 ? '' : 's'}">
    <path d="M2 4l34-2 2 29-35 1z" class="paper"/><path d="M5 7l5 5M33 5l-4 5" stroke-width=".8" stroke-dasharray="1.4 1.6"/>${m}</svg>`;
}

// The napkin up close: every mark so far and what it was for.
const HAND = `font-family="'Bradley Hand','Segoe Print','Comic Sans MS',cursive"`;
const WORD = ['', 'one', 'two', 'three', 'four', 'five'];
export function napkinShow(reasons, limit) {
  const n = reasons.length;
  const marks = reasons.map((_, i) => `<path d="M${26 + i * 11} 20v32"${i === n - 1 ? ' class="new"' : ''}/>`).join('');
  const lines = reasons.map((r, i) => `<text x="20" y="${84 + i * 24}" font-size="16" fill="currentColor" stroke="none" ${HAND}${i === n - 1 ? ' class="newt"' : ''}>${i + 1}. ${r}</text>`).join('');
  return `<div class="napshow" aria-live="polite"><svg viewBox="0 0 250 180" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" role="img" aria-label="Dot’s napkin: ${reasons.join(', ')}">
    <path d="M8 10l232-4 3 166-238 4z" class="paper"/><path d="M8 10l26 26M240 6l-24 26M5 176l26-24" stroke-width="1" stroke-dasharray="3 3"/>
    ${marks}<text x="140" y="42" font-size="15" fill="currentColor" stroke="none" ${HAND}>Dot’s napkin</text>
    ${lines}<text x="20" y="166" font-size="12" fill="currentColor" stroke="none" opacity=".6" font-family="system-ui">${limit} marks = kitchen</text></svg>
    <div class="ncap">That’s ${WORD[n] || n}.</div></div>`;
}

// The kitchen interlude: why you're there, Dot with her rolling pin, what she says.
export function kitchen({ why, line }) {
  return `<div class="kitchen" role="dialog" aria-label="The kitchen">
    <div class="why"><b>Why we’re here</b>${why}</div>
    <svg viewBox="0 0 320 128" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M10 22h190v34h-190zM73 22v34M137 22v34"/><circle cx="66" cy="40" r="1.5"/><circle cx="80" cy="40" r="1.5"/><circle cx="130" cy="40" r="1.5"/><circle cx="144" cy="40" r="1.5"/>
      <path d="M4 120h312"/><path d="M216 22h44v28h-44z M238 22v28"/>
      <ellipse cx="70" cy="110" rx="42" ry="9"/><path d="M38 104l64-6" stroke-width="5"/>
      <path d="M128 114h64v6h-64z"/><circle cx="140" cy="111" r="4.5"/><circle cx="155" cy="111" r="4.5"/><circle cx="170" cy="111" r="4.5"/><circle cx="184" cy="111" r="4.5"/>
      <path d="M120 98l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z"/>
      <text x="226" y="70" font-size="11" fill="currentColor" stroke="none" font-family="Georgia,serif">Dot’s kitchen</text>
    </svg>
    <div class="kdot">${art('pin')}</div>
    <div class="kline">${line}</div>
    <div class="kprog"><i></i></div>
    <div class="kskip">Tap to skip</div>
  </div>`;
}

// Lesson 1: the trump suit high to low. The two Jacks start where they "normally" sit
// and jump to the top (main.js adds the 'go' class to start the jump).
const CARD = (id, x, y, cls = '') => {
  const r = id.slice(0, -1), s = id.slice(-1);
  return `<div class="lcard ${isRed(s) ? 'r' : ''} ${cls}" data-c="${id}" style="--x:${x};--y:${y}">${r}<i>${SYM[s]}</i></div>`;
};
export function ladder(trump) {
  const left = { H: 'D', D: 'H', S: 'C', C: 'S' }[trump];
  const start = [['A', 0, 0], ['K', 1, 0], ['Q', 2, 0], ['J', 3, 0], ['10', 4, 0], ['9', 5, 0]].map(([r, x, y]) => [r + trump, x, y]);
  const end = ['J' + trump, 'J' + left, 'A' + trump, 'K' + trump, 'Q' + trump, '10' + trump, '9' + trump];
  const cards = [...start, ['J' + left, 5.4, 1.3]].map(([id, x, y]) => {
    const e = end.indexOf(id);
    return CARD(id, x, y, id[0] === 'J' ? 'jack' : '').replace('style="', `style="--ex:${e};`);
  }).join('');
  return `<div class="ladder"><span class="lab">Trump, high to low</span>${cards}<span class="boss">Right · Left bower</span></div>`;
}
