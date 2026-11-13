// Draws the lessons: the lesson picker, and the Euchre table with Grandma Dot in
// the Partner seat, the lesson bar, her napkin and the coaching extras.
// The table itself (trick, trump badge, bidding buttons) comes from Euchre's own view.
import { cardHTML, miniFanHTML } from '../../../../shared/cards.js';
import { seatHTML, meHTML, tableHTML } from '../../../../shared/table.js';
import { headerHTML, statusHTML, actionsHTML, handHTML, footHTML } from '../../../../shared/ui.js';
import { effSuit } from '../rules.js';
import { center, actions as euchreActions, seatTag } from '../view.js';
import { NAMES } from '../rules.js';
import { LESSONS } from './lessons.js';
import { art, MUG, napkin, ladder } from './parts.js';

// ---------- the lesson picker ----------
export function pickerHTML(L, { version, feedback, allGames }) {
  const next = LESSONS.find(x => x.ready && !L.done.has(x.n));
  const row = x => {
    const done = L.done.has(x.n), isNext = next && next.n === x.n;
    const cls = !x.ready ? 'soon' : done ? 'done' : isNext ? 'next' : '';
    const tail = !x.ready ? 'Coming soon' : done ? 'Again' : isNext ? 'Start ›' : 'Start';
    return `<li><button class="lesson ${cls}" data-lesson="${x.n}"${x.ready ? '' : ' disabled'}>
      <span class="n">${done ? '✓' : x.n}</span><span class="t">${x.title}<small>${x.sub}</small></span><em>${tail}</em></button></li>`;
  };
  return `
    <header class="top"><div class="title">Learn Euchre</div></header>
    <div class="controls"><a class="link" href="${allGames}" data-carry="${allGames.split('#')[0]}">‹ All games</a><span></span></div>
    <div class="greet"><div class="dotbig">${art('sip')}</div>
      <div class="say">Where were we? Don’t tell me. Pick a lesson.</div></div>
    <ol class="lessons">${LESSONS.map(row).join('')}
      <li><button class="lesson soon" disabled><span class="n star">★</span><span class="t">Graduation game<small>Win a full game with Dot to graduate</small></span><em>After 6</em></button></li></ol>
    <p class="fine">Progress lasts while this page is open. Dot’s memory isn’t what it used to be.</p>
    ${footHTML(version, feedback)}`;
}

// ---------- the lesson table ----------
function dotSeat(L, S) {
  const turn = S.turn === 2, dealer = S.dealer === 2;
  const faceUp = L.lesson.faceUp && S.hands[2].length;
  const glow = c => L.show === 'trump' || L.show === 'ladder' ? (effSuit(c, S.trump) === S.trump ? 'glow' : '') : '';
  return `<div class="dotseat${turn ? ' turn' : ''}">
    <div class="props">${napkin(L.marks.length, L.freshMark)}${MUG}</div>
    <button class="dfig${L.whyReady ? ' askme' : ''}" data-act="dot" aria-label="Grandma Dot${L.whyReady ? ': tap to ask why' : ''}">${art(L.pose, 'crop')}</button>
    <span class="dname">${L.grot ? 'Grot' : 'Grandma Dot'}${dealer ? ' <span class="dl">Dealer</span>' : ''}</span>
    <span class="tag">${seatTag(S, 2)}</span>
    ${faceUp ? `<div class="upfan">${S.hands[2].map(c => cardHTML(c, 'sm ' + glow(c), 'tabindex="-1"')).join('')}</div>` : ''}
    ${L.say ? `<div class="say${L.sayCls ? ' ' + L.sayCls : ''}" aria-live="polite">${L.say}</div>` : ''}
  </div>`;
}

function seat(L, S, p) {
  const faceUp = L.lesson.faceUp && S.hands[p].length;
  const glow = c => L.show ? (effSuit(c, S.trump) === S.trump ? 'glow' : '') : '';
  return seatHTML({
    face: p, name: NAMES[p], turn: S.turn === p, dealer: S.dealer === p, said: S.said[p], tag: seatTag(S, p),
    fan: faceUp ? `<div class="upfan v">${S.hands[p].map(c => cardHTML(c, 'sm ' + glow(c), 'tabindex="-1"')).join('')}</div>`
      : miniFanHTML(S.hands[p].length, { dealt: S.justDealt })
  });
}

function handCards(L, S, legal) {
  const myTurn = S.phase === 'play' && S.turn === 0;
  const allowed = myTurn ? legal(0) : [];
  const quiz = L.step && L.step.kind === 'quiz';
  return S.hands[0].map((c, i) => {
    let cls = '';
    if (S.phase === 'discard') cls = 'discard' + (c.id === S.upcard.id ? ' picked' : '');
    else if (quiz) cls = 'can';
    else if (myTurn) cls = allowed.includes(c) ? 'can' : 'no';
    if ((L.show === 'trump' || L.show === 'ladder') && effSuit(c, S.trump) === S.trump) cls += ' glow';
    if (L.hint === c.id || L.quizRight === c.id) cls += ' glow hinted';
    if (L.shake === c.id) cls += ' shake';
    if (S.justDealt) cls += ' dealt';
    const tab = cls.includes('can') || S.phase === 'discard' ? '' : 'tabindex="-1"';
    const arrow = L.hint === c.id ? '<span class="arrow" aria-hidden="true">↓</span>' : '';
    return `<span class="hc">${arrow}${cardHTML(c, cls, `data-card="${c.id}" ${tab} style="animation-delay:${i * 90}ms"`)}</span>`;
  }).join('');
}

function lessonBar(L) {
  const n = L.lesson.n;
  const dots = LESSONS.map(x => `<i class="${x.n <= n ? 'on' : ''}"></i>`).join('');
  const playing = L.step && L.step.kind === 'play';
  return `<div class="lbar"><span class="lx">Lesson <b>${n}</b> of ${LESSONS.length}</span><span class="pr" aria-hidden="true">${dots}</span><span class="grow"></span>
    <button class="pill" data-act="hint"${playing && L.canHint ? '' : ' disabled'}>Hint</button>
    <button class="pill" data-act="back"${L.canBack ? '' : ' disabled'}>${L.backUsed ? 'Used this hand' : 'Take it back'}</button></div>`;
}

function stepButtons(L, S) {
  const st = L.step;
  if (!st) return '';
  if (st.kind === 'say') return '<button class="btn pri" data-act="next">Next</button>';
  if (st.kind === 'play') return euchreActions(S);
  return '';
}

export function lessonHTML(L, S, { legal, version, feedback }) {
  if (!S.hands) return '';
  const scores = [{ label: 'Us', value: S.score[0], cls: 'us' }, { label: 'Them', value: S.score[1] }];
  const showTricks = ['play', 'handEnd', 'gameOver'].includes(S.phase);
  // When you're the dealer and pick up the turned-up card, it's in your hand: don't also
  // show it in the middle (the lesson pauses here, so it would sit there through the explanation).
  let mid = center(S.dealer === 0 && S.upcardTaken ? { ...S, upcardTaken: false } : S);
  if (L.show === 'ladder') mid = mid.replace(/<\/div>\s*$/, `${ladder(S.trump)}</div>`);
  if (L.show === 'trump' || L.show === 'ladder') mid = mid.replace('<div class="center">', '<div class="center"><div class="banner">' + (S.trump === 'H' ? 'Hearts' : S.trump === 'D' ? 'Diamonds' : S.trump === 'S' ? 'Spades' : 'Clubs') + ' are trump</div>');
  return `
    ${headerHTML('Euchre', scores)}
    <div class="controls"><span class="lvl">Learn with Grandma Dot · ${L.lesson.title}</span><div class="menu"><button class="link" data-act="leave">Leave</button></div></div>
    ${lessonBar(L)}
    ${tableHTML({ north: dotSeat(L, S), west: seat(L, S, 1), east: seat(L, S, 3), center: mid,
      south: meHTML({ turn: S.turn === 0, dealer: S.dealer === 0, tag: seatTag(S, 0) }) })}
    ${statusHTML((L.msg || S.msg || '').replace(/\bPartner\b/g, 'Dot'), L.note || (showTricks ? `Tricks this hand: us ${S.tricks[0]}, them ${S.tricks[1]}` : ''))}
    ${actionsHTML(stepButtons(L, S))}
    ${handHTML(handCards(L, S, legal), S.hands[0].length)}
    ${footHTML(version, feedback)}
  `;
}

// Sheets over the table: leaving mid-lesson, and the end of a lesson.
export function leaveHTML() {
  return `<div class="dotpic">${art('brow')}</div>
    <p class="sayline" id="leave-h">Leave now and I’ll forget all of this. I’m old, not patient.</p>
    <div class="ask-btns"><button class="btn pri" data-close>Stay</button><button class="btn" data-act="quit">Leave</button></div>`;
}
export function doneHTML(L, { title, line, pose, body }) {
  const nextReady = LESSONS.find(x => x.ready && x.n > L.lesson.n);
  return `<div class="dotpic">${art(pose)}</div>
    <h2 id="done-h">${title}</h2>
    <p class="sayline">${line}</p><p>${body}</p>
    <div class="ask-btns">${nextReady ? `<button class="btn pri" data-act="lesson" data-n="${nextReady.n}">Lesson ${nextReady.n}</button>` : ''}
      <button class="btn${nextReady ? '' : ' pri'}" data-act="again">Again</button><button class="btn" data-act="quit">All lessons</button></div>`;
}
