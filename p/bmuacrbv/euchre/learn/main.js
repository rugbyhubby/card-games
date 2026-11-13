// Learn Euchre with Grandma Dot: runs the lessons on top of the real Euchre game.
// The game (../game.js) plays the cards; this file walks you through each lesson,
// watches your plays (coach.js) and handles Dot's napkin, Hint, Take it back,
// "Why?", the kitchen and leaving. Nothing is saved: progress lasts while the page is open.
import { settings, SPEED_FACTOR } from '../../../../shared/settings.js';
import { createTimer } from '../../../../shared/timing.js';
import { followTheme } from '../../../../shared/theme.js';
import { createSheet, feedbackHref, bindSettings, addRotateNotice } from '../../../../shared/ui.js';
import { createEuchre } from '../game.js';
import * as hardBot from '../bots-hard.js';
import { grade } from './coach.js';
import { LESSONS } from './lessons.js';
import { pickerHTML, lessonHTML, leaveHTML, doneHTML } from './view.js';
import { napkinShow, kitchen } from './parts.js';
import { VERSION } from './version.js';

const MARK_LIMIT = 3;            // napkin marks in one lesson before the kitchen
const KITCHEN_MS = 3000;
const SLOW_MS = 20000;           // taking this long on your turn gets the table tap
const NAPKIN_MS = 3400;

// Dot's lines that aren't tied to one moment.
const HINT_LINES = [
  'A hint? Lou never needed a hint. He needed glasses.',
  'Fine. Look where I’m pointing.',
  'Again? I’ll put it on your tab.'
];
const KITCHEN_MARKS = { why: 'Three marks on one napkin. In one lesson.', lines: ['I brought you here so you can explain yourself.', 'Don’t you know Euchre is life?'] };
const KITCHEN_EUCHRED = { why: 'We called trump and got euchred.', lines: ['We got euchred. In my house.', 'Sit. Have a cookie. Then explain yourself.'] };

// ---------- a game whose computer moves can wait (for the kitchen) ----------
let paused = false;
let waiting = [];
const schedule = (fn, ms) => setTimeout(() => (paused ? waiting.push(fn) : fn()), ms);
const pause = () => { paused = true; };
const unpause = () => { paused = false; const w = waiting; waiting = []; w.forEach(f => f()); };

const app = document.getElementById('app');
const fx = document.getElementById('fx');
const timer = createTimer({ speed: () => SPEED_FACTOR[settings.get('speed')] || 1, schedule });
const game = createEuchre({
  timer,
  levelAtStart: () => 'medium',
  difficultyFor: p => (p === 2 ? 'hard' : 'medium'),   // Dot is a shark; the others play like regulars
  scriptBid: (S, p) => (L.lesson && L.lesson.deal.bids && L.lesson.deal.bids[p]) || null,
  onChange: () => { watch(); render(); },
  onEvent
});
const S = game.state;

// What the lesson screen shows besides the game itself.
const L = {
  screen: 'pick', done: new Set(), lesson: null, stepIdx: 0, step: null,
  pose: 'sip', say: '', sayCls: '', note: '', show: null,
  marks: [], totalMarks: 0, freshMark: false, whyReady: null,
  hint: null, hints: 0, canHint: true, canBack: false, backUsed: false,
  shake: null, quizRight: null, grot: false, finished: false
};
let snapshot = null, slowTimer = null, lastTurn = null;

function render() {
  if (L.screen === 'pick') {
    app.innerHTML = pickerHTML(L, { version: VERSION, feedback: feedbackHref({ game: 'Learn Euchre', version: VERSION }), allGames: settings.link('../../') });
    return;
  }
  app.innerHTML = lessonHTML(L, S, { legal: game.legal, version: VERSION, feedback: feedbackHref({ game: 'Learn Euchre', version: VERSION }) });
  S.justDealt = false;
  L.freshMark = false;
}
const say = (pose, text, cls = '') => { L.pose = pose; L.say = text; L.sayCls = cls; };

// ---------- lessons and their steps ----------
function startLesson(n) {
  const lesson = LESSONS.find(x => x.n === n && x.ready);
  if (!lesson) return;
  sheet.close(); clearFx(); unpause(); clearTimeout(slowTimer);
  Object.assign(L, { screen: 'lesson', lesson, stepIdx: 0, marks: [], totalMarks: 0, whyReady: null, hint: null, hints: 0,
    canHint: true, canBack: false, backUsed: false, shake: null, quizRight: null, finished: false, show: null, note: '' });
  snapshot = null; lastTurn = null;
  S.score = [0, 0];
  game.startHand(lesson.deal);
  runStep();
}
function runStep() {
  const st = L.lesson.steps[L.stepIdx];
  L.step = st; L.show = st.show || null; L.note = st.note || ''; L.msg = st.msg || ''; L.quizRight = null;
  say(st.pose, st.say);
  if (st.kind === 'bid') { L.advancing = false; game.resume(); }
  if (st.kind === 'play') {
    L.show = null; L.note = ''; L.msg = '';
    if (paused) unpause();                  // after your discard, play was waiting for this step
    else game.beginPlay();
  }
  render();
  if (st.show === 'ladder') setTimeout(() => { const el = app.querySelector('.ladder'); if (el) el.classList.add('go'); }, 900);
}
function nextStep() {
  if (L.stepIdx < L.lesson.steps.length - 1) { L.stepIdx++; runStep(); }
}
function quizAnswer(id) {
  const st = L.step, right = st.answer(S);
  if (id === right) {
    L.quizRight = id; say('nod', st.right); render();
    setTimeout(nextStep, 1600);
  } else {
    L.shake = id; say('brow', st.wrong); render();
    setTimeout(() => { L.shake = null; }, 400);
  }
}

// ---------- watching the game ----------
// Called on every change: notices your turn starting (for the slow-player tap) and the hand ending.
function watch() {
  if (L.screen !== 'lesson') return;
  const yourTurn = S.phase === 'play' && S.turn === 0;
  if (yourTurn && lastTurn !== 'you') {
    clearTimeout(slowTimer);
    slowTimer = setTimeout(() => { if (S.turn === 0 && S.phase === 'play' && !paused) { say('tap', 'Any time now. I’m not getting younger.'); render(); } }, SLOW_MS);
  }
  if (!yourTurn) clearTimeout(slowTimer);
  lastTurn = yourTurn ? 'you' : 'other';
  // The bidding is over and you (the dealer) have to discard: on to that step.
  if (L.step && L.step.kind === 'bid' && S.phase === 'discard' && !L.advancing) { L.advancing = true; L.advanceTimer = setTimeout(nextStep, 1800); }
  if ((S.phase === 'handEnd' || S.phase === 'gameOver') && !L.finished) { L.finished = true; L.canBack = false; L.canHint = false; setTimeout(finishLesson, 900); }
}
// Other players' cards: Dot looks pleased with herself when she plays a bower.
function onEvent(e) {
  const [kind, p, id] = e.split(':');
  if (kind === 'bid1' && p === '2' && id === 'true') say('lean', 'Pick it up.');
  if (kind === 'play' && p === '2' && id[0] === 'J' && S.trump && (id[1] === S.trump || id === 'J' + { H: 'D', D: 'H', S: 'C', C: 'S' }[S.trump])) say('smug', '');
}

function finishLesson() {
  const ours = S.maker != null && S.maker % 2 === 0;
  const euchred = ours && S.tricks[0] < 3;
  const end = () => {
    L.done.add(L.lesson.n);
    const clean = L.totalMarks === 0;
    sheet.open(doneHTML(L, {
      title: `Lesson ${L.lesson.n} done`,
      pose: clean ? 'clap' : 'nod',
      line: clean ? 'Okay, that was good. Don’t let it go to your head.' : 'Not bad. Not good either. Next.',
      body: `We took ${S.tricks[0]} of 5 tricks. Napkin marks: ${L.totalMarks}.`
    }), { labelledBy: 'done-h', cls: 'dotsheet' });
  };
  if (euchred) { say('pin', 'Euchred? Kitchen. Bring your excuses.'); render(); setTimeout(() => goKitchen(KITCHEN_EUCHRED, end), 1500); }
  else end();
}

// ---------- your moves ----------
function tapCard(id) {
  if (L.step && L.step.kind === 'quiz') return quizAnswer(id);
  // Your discard as dealer (also if you tap before the lesson has moved on from the bidding).
  if (S.phase === 'discard' && L.step && (L.step.kind === 'discard' || L.step.kind === 'bid')) {
    const di = L.lesson.steps.findIndex(x => x.kind === 'discard');
    if (di >= 0) {
      clearTimeout(L.advanceTimer);
      pause();                                // hold the first lead until the lesson is ready to play
      game.you.discard(id);
      L.stepIdx = di;
      return setTimeout(nextStep, 700);
    }
  }
  if (paused) return;
  if (S.phase === 'discard') return game.you.discard(id);
  if (S.phase !== 'play' || S.turn !== 0 || !L.step || L.step.kind !== 'play') return;
  const card = S.hands[0].find(c => c.id === id);
  if (!card) return;
  if (!game.legal(0).includes(card)) return illegal(card);
  const g = grade(S, card, L.lesson.n);
  if (!L.backUsed) snapshot = structuredClone(S);
  L.hint = null; L.whyReady = null; L.note = ''; clearTimeout(slowTimer);
  say('sip', '');
  L.canBack = !L.backUsed;
  game.you.play(id);
  react(g);
}
function react(g) {
  if (!g) return render();
  if (g.kind === 'good') { say('clap', 'Okay, that was good. Don’t let it go to your head.'); L.note = g.why; render(); return; }
  // A putz play: the napkin comes out.
  L.marks.push(g.mark); L.totalMarks++; L.freshMark = true; L.whyReady = g.why;
  say('palm', g.say); render();
  fx.innerHTML = napkinShow(L.marks, MARK_LIMIT);
  if (L.marks.length >= MARK_LIMIT) {
    pause();
    setTimeout(() => { say('pin', 'Kitchen. Now. We’re making sugar cookies and talking about that.'); render(); }, 1200);
    setTimeout(() => goKitchen(KITCHEN_MARKS, () => { L.marks = []; say('sip', 'Fresh napkin. Don’t make me use it.'); render(); }), NAPKIN_MS);
  } else setTimeout(() => { if (fx.querySelector('.napshow')) fx.innerHTML = ''; }, NAPKIN_MS);
}
function illegal(card) {
  L.shake = card.id; say('brow', 'Follow suit, sweetheart. It’s not a suggestion.'); render();
  setTimeout(() => { L.shake = null; }, 400);
  if (fx.querySelector('.rule')) return;
  fx.innerHTML = '<div class="rule" role="note"><b>Rule</b>Follow suit: if you have the suit that was led, you must play it.</div>';
  requestAnimationFrame(() => requestAnimationFrame(() => fx.querySelector('.rule')?.classList.add('in')));
  setTimeout(() => fx.querySelector('.rule')?.classList.remove('in'), 2600);
  setTimeout(() => { if (fx.querySelector('.rule')) fx.innerHTML = ''; }, 3200);
}
function hint() {
  if (S.phase !== 'play' || S.turn !== 0 || paused) return;
  const c = hardBot.playCard(S, 0);
  L.hint = c.id;
  say('lean', HINT_LINES[L.hints++ % HINT_LINES.length]);
  render();
}
function takeBack() {
  if (!L.canBack || !snapshot) return;
  timer.cancelAll(); clearFx(); unpause();
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, structuredClone(snapshot));
  snapshot = null; L.backUsed = true; L.canBack = false; L.whyReady = null; L.hint = null; L.finished = false;
  say('brow', 'Fine, take it back. You’re on dish duty.');      // the napkin mark stays: she saw it
  lastTurn = null;
  game.resume();
}
function askWhy() {
  if (!L.whyReady) return;
  say('lean', '<b>Why?</b> ' + L.whyReady, 'why'); L.whyReady = null; render();
}

// ---------- the kitchen ----------
let kitchenDone = null;
function goKitchen({ why, lines }, then) {
  pause();
  fx.innerHTML = kitchen({ why, line: lines[0] });
  const k = fx.querySelector('.kitchen');
  k.style.setProperty('--kms', KITCHEN_MS + 'ms');
  const t1 = setTimeout(() => { const el = fx.querySelector('.kline'); if (el) el.textContent = lines[1] || lines[0]; }, KITCHEN_MS / 2);
  const t2 = setTimeout(leave, KITCHEN_MS);
  function leave() { clearTimeout(t1); clearTimeout(t2); kitchenDone = null; clearFx(); unpause(); then(); }
  kitchenDone = leave;
}
fx.addEventListener('click', () => { if (kitchenDone) kitchenDone(); });
function clearFx() { fx.innerHTML = ''; }

// ---------- taps ----------
followTheme(settings);
addRotateNotice('Euchre');
bindSettings(app, settings);
const sheetEl = document.getElementById('sheet');
const sheet = createSheet(sheetEl);

function leaveLesson() {
  timer.cancelAll(); clearFx(); unpause(); clearTimeout(slowTimer);
  sheet.close(); L.screen = 'pick'; L.step = null; render(); window.scrollTo(0, 0);
}
sheetEl.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (!a) return;
  if (a.dataset.act === 'quit') leaveLesson();
  if (a.dataset.act === 'again') startLesson(L.lesson.n);
  if (a.dataset.act === 'lesson') startLesson(+a.dataset.n);
});
app.addEventListener('click', e => {
  const pick = e.target.closest('[data-lesson]');
  if (pick && !pick.disabled) return startLesson(+pick.dataset.lesson);
  const a = e.target.closest('[data-act]');
  if (a) {
    if (a.disabled) return;
    const act = a.dataset.act;
    if (act === 'leave') return L.finished ? leaveLesson() : sheet.open(leaveHTML(), { labelledBy: 'leave-h', cls: 'dotsheet' });
    if (act === 'next') return nextStep();
    if (act === 'hint') return hint();
    if (act === 'back') return takeBack();
    if (act === 'dot') return askWhy();
    if (paused) return;
    if (act === 'pass') return game.you.pass();
    if (act === 'order') return game.you.order();
    if (act === 'call') return game.you.call(a.dataset.s);
    if (act === 'alone') return game.you.toggleAlone();
    return;
  }
  const c = e.target.closest('[data-card]');
  if (c) tapCard(c.dataset.card);
});

// Offline: this page has its own helper (sw.js in this folder).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

render();
