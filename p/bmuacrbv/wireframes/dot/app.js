// Grandma Dot wireframes: the sketch gallery (Part A), the tap-through screens
// (Part B), layout options and the decisions list. Fake data, nothing saved.
import { dotSVG, POSES, TAKE_INFO } from './dot.js';

const app = document.getElementById('app');
let take = 'art';                                 // which Dot the screens use: the drawn art, or sketch A/B/C (switch in the top bar)
let seq = null, idx = 0, timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const cancel = () => { timers.forEach(clearTimeout); timers = []; };

// ---------- small parts ----------
const RED = s => s === '♥' || s === '♦';
function cd(code, cls = '') {
  const s = code.slice(-1), r = code.slice(0, -1);
  return `<div class="cd ${RED(s) ? 'r' : ''} ${cls}" data-c="${code}">${r}<i>${s}</i><span class="p">${s}</span></div>`;
}
function napkin(n, fresh = false) {
  let m = '';
  for (let i = 0; i < n; i++) {
    const g = Math.floor(i / 5), k = i % 5, x = 7 + g * 16, cls = fresh && i === n - 1 ? ' class="new"' : '';
    m += k < 4 ? `<path d="M${x + k * 3} 10v14"${cls}/>` : `<path d="M${x - 2} 22l14-10"${cls}/>`;
  }
  return `<svg class="napkin" viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-label="Napkin tally: ${n}">
    <path d="M2 4l34-2 2 29-35 1z" class="occ"/><path d="M5 7l5 5M33 5l-4 5" stroke-width=".8" stroke-dasharray="1.4 1.6"/>${m}</svg>`;
}
const MUG = `<svg class="mugsm" viewBox="0 0 22 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
  <path d="M6.5 6q-2-2.5 0-5M10.5 6q2-2.5 0-5" stroke-width="1"/><path d="M15 11q5 0 5 4t-5 4"/><path d="M4 9h11v10q0 3-3 3h-5q-3 0-3-3z" class="occ"/></svg>`;
// The drawn art: one image per pose (art/dot-<pose>.png, cut from the sheet).
const POSE_NAME = Object.fromEntries(POSES.map(([k, n]) => [k, n]));
const artImg = (pose, cls = '') => `<img class="${cls}" src="art/dot-${pose}.png" alt="Grandma Dot: ${POSE_NAME[pose] || pose}">`;
// Dot in her seat: in a circle, cropped to head and shoulders.
const fig = (pose, cls = '') => take === 'art'
  ? `<div class="fig ring art ${cls}">${artImg(pose, 'crop')}</div>`
  : `<div class="fig ${cls}">${dotSVG(take, pose)}</div>`;
// Dot shown bigger (lesson picker, kitchen, warnings): the whole drawing.
const D = (pose, cls = '') => take === 'art' ? `<div class="dotfull ${cls}">${artImg(pose)}</div>` : dotSVG(take, pose);

// The napkin up close: marks so far, and what each one was for. Three marks and you
// go to the kitchen. Shown big for a moment, then it goes back by her mug.
const MARK_LIMIT = 3;
const HAND = "font-family=\"'Bradley Hand','Segoe Print','Comic Sans MS',cursive\"";
function bigNapkin(reasons) {
  const n = reasons.length;
  const marks = reasons.map((_, i) => `<path d="M${26 + i * 11} 20v32"${i === n - 1 ? ' class="new"' : ''}/>`).join('');
  const lines = reasons.map((r, i) => `<text x="20" y="${84 + i * 24}" font-size="16" fill="currentColor" stroke="none" ${HAND}${i === n - 1 ? ' class="newt"' : ''}>${i + 1}. ${r}</text>`).join('');
  return `<svg viewBox="0 0 250 180" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-label="Napkin: ${n} of ${MARK_LIMIT} marks">
    <path d="M8 10l232-4 3 166-238 4z" class="occ"/><path d="M8 10l26 26M240 6l-24 26M5 176l26-24" stroke-width="1" stroke-dasharray="3 3"/>
    ${marks}<text x="140" y="42" font-size="15" fill="currentColor" stroke="none" ${HAND}>Dot’s napkin</text>
    ${lines}<text x="22" y="166" font-size="12" fill="currentColor" stroke="none" opacity=".6" font-family="system-ui">${MARK_LIMIT} marks = kitchen</text></svg>`;
}
const WORD = ['', 'one', 'two', 'three', 'four'];
const napShow = reasons => `<div class="napshow">${bigNapkin(reasons)}<div class="ncap">That’s ${WORD[reasons.length]}.</div></div>`;

// ---------- the Euchre table with Dot in the Partner seat ----------
// o: pose, say, sayCls, grot, tally, fresh, trick {N,W,E,S}, note, banner, center,
//    hand [codes], hc {code: class}, faceUp {N,W,E}, msg, scores, n (lesson), hint, back,
//    dotCls, layout {bar: 'top'|'bottom'|'split', napkin: 'mug'|'bar'}, size, ring, extra
function T(o) {
  const L = { bar: 'top', napkin: 'mug', ...(o.layout || {}) };
  const tally = napkin(o.tally ?? 0, o.fresh);
  const dots = Array.from({ length: 6 }, (_, i) => `<i class="${i < (o.n || 1) ? 'on' : ''}"></i>`).join('');
  const hintBtn = `<button class="pill ${o.hint || ''}" data-hint>Hint</button>`;
  const backBtn = `<button class="pill ${o.back || ''}" data-back>${o.backLabel || 'Take it back'}</button>`;
  const bar = `<div class="lbar ${L.bar}"><span class="lx">${o.barLabel || `Lesson <b>${o.n || 1}</b> of 6`}</span>${o.barLabel ? '' : `<span class="pr">${dots}</span>`}
    ${L.napkin === 'bar' ? tally : ''}<span class="grow"></span>${hintBtn}${backBtn}</div>`;
  const side = (name, cards) => `<div class="side"><i class="av"></i>${name}${cards ? `<div class="vh">${cards.map(c => cd(c, 'sm ' + ((o.hc || {})[c] || ''))).join('')}</div>` : ''}</div>`;
  const tr = o.trick || {};
  const slots = ['N', 'W', 'E', 'S'].filter(k => tr[k]).map(k => `<div class="slot ${k}">${cd(tr[k], (o.tc || {})[k] || '')}</div>`).join('');
  const hand = (o.hand || []).map(c => {
    const h = cd(c, (o.hc || {})[c] || '');
    return o.arrow === c ? `<span style="position:relative;display:flex">${h}<span class="arrow" style="left:50%;margin-left:-9px;top:-38px">↓</span></span>` : h;
  }).join('');
  const sc = o.scores || [3, 5];
  return `<div class="ph" style="--dot:${o.size || 50}px">
    <div class="hd"><span class="t">Euchre</span><div class="s"><div><b>${sc[0]}</b><span>Us</span></div><div><b>${sc[1]}</b><span>Them</span></div></div></div>
    <div class="ctl"><span>${L.bar === 'split' ? `Lesson <b style="color:var(--ink)">${o.n || 1}</b> of 6 · Learn with Grandma Dot` : 'Learn with Grandma Dot'}</span><u data-leave>Leave</u></div>
    ${L.bar === 'top' ? bar : ''}
    <div class="north">
      <div class="props">${L.napkin === 'mug' ? tally : ''}${MUG}</div>
      <div class="dseat ${o.dotCls || ''}" data-dot>${fig(o.pose || 'sip', (o.ring ?? true) ? 'ring' : '')}<span class="tag ${o.grot ? 'grot' : ''}">${o.grot ? 'Grot' : 'Grandma Dot'}</span>
        ${o.faceUp && o.faceUp.N ? `<div class="dhand">${o.faceUp.N.map(c => cd(c, 'sm ' + ((o.hc || {})[c] || ''))).join('')}</div>` : ''}</div>
      ${o.say ? `<div class="say ${o.sayCls || ''}">${o.say}</div>` : '<div></div>'}
    </div>
    <div class="mid">${side('West', o.faceUp && o.faceUp.W)}
      <div class="trick">${o.trump === null ? '' : `<div class="trumpb">Trump<b class="${RED(o.trump || '♥') ? 'r' : ''}">${o.trump || '♥'}</b></div>`}${slots}${o.center || ''}${o.note ? `<div class="note">${o.note}</div>` : ''}${o.banner ? `<div class="banner">${o.banner}</div>` : ''}</div>
      ${side('East', o.faceUp && o.faceUp.E)}</div>
    <div class="me">${L.bar === 'split' ? hintBtn : ''}<i></i>You${L.bar === 'split' ? backBtn : ''}</div>
    <div class="msg">${o.msg || ''}</div>
    ${L.bar === 'bottom' ? bar : ''}
    <div class="hand">${hand}</div>
    ${o.extra || ''}
  </div>`;
}

// ---------- screens ----------
const TRUMP_GLOW = { 'A♥': 'glow', '10♥': 'glow', 'J♦': 'glow', 'J♥': 'glow', 'Q♥': 'glow', 'K♥': 'glow', '9♥': 'glow' };
const L1 = { hand: ['J♦', 'A♥', '10♥', 'K♣', '9♠'], faceUp: { N: ['J♥', 'Q♥', 'A♣', 'K♠', '10♦'], W: ['K♥', '9♥', 'A♠', 'Q♣', '9♦'], E: ['A♦', 'K♦', '10♣', 'J♠', 'Q♠'] }, n: 1, scores: [0, 0], tally: 0 };
const PUTZ = { n: 3, scores: [4, 5], tally: 0, trick: { N: 'A♣', E: '9♣' }, hand: ['9♥', '10♠', 'K♦', 'Q♥', 'A♦'] };
const PUTZ_END = { ...PUTZ, trick: { N: 'A♣', E: '9♣', S: '9♥' }, hand: ['10♠', 'K♦', 'Q♥', 'A♦'], tally: 1, pose: 'palm', say: 'You trumped my ace. I’ve disowned grandkids for less.' };
// Why you're in the kitchen, and what Dot says there. Three seconds, tap to skip.
const KITCHEN = {
  marks: { why: 'Three marks on one napkin. In one lesson.', lines: ['I brought you here so you can explain yourself.', 'Don’t you know Euchre is life?'] },
  euchred: { why: 'We called trump and got euchred.', lines: ['We got euchred. In my house.', 'Sit. Have a cookie. Then explain yourself.'] }
};
const KITCHEN_SECS = 3;

function gameList(style = 'A') {
  const euchre = style === 'A'
    ? `<div class="grow-row"><div class="nm"><b>Euchre</b><small>4 players, with a partner. Call trump and take at least 3 of 5 tricks.</small></div><u style="font-size:14px">Rules</u><span class="btn pri" style="padding:7px 16px">Play</span></div>
    <button class="learn hot" style="border-bottom-width:1.5px">${fig('sip')}<span style="flex:1;text-align:left"><b>Learn with Grandma Dot</b><small>6 short lessons. She’s your partner. Good luck.</small></span>›</button>`
    : `<div class="grow-row"><div class="nm"><b>Euchre</b><small>4 players, with a partner. Call trump and take at least 3 of 5 tricks.</small></div><u style="font-size:14px">Rules</u><u class="hint-ring" style="font-size:14px;padding:2px 4px">Learn</u><span class="btn pri" style="padding:7px 16px">Play</span></div>`;
  return `<div class="gl"><h1>Card Games <u>Settings</u></h1>
    ${euchre}
    <div class="grow-row"><div class="nm"><b>Pitch</b><small>4 players, with a partner. Bid, set trump, and win High, Low, Jack and Game.</small></div><u style="font-size:14px">Rules</u><span class="btn pri" style="padding:7px 16px">Play</span></div>
    <div class="grow-row"><div class="nm"><b>Cribbage</b><small>2 players, you vs the computer. Score 15s, pairs and runs; first to 121.</small></div><u style="font-size:14px">Rules</u><span class="btn pri" style="padding:7px 16px">Play</span></div>
    <div class="grow-row soon"><div class="nm"><b>Nertz</b><small><i>Coming soon</i></small></div></div></div>`;
}
function picker() {
  const L = [['The bowers', 'Why two Jacks run the show', 'done'], ['Follow suit', 'What you’re allowed to play', 'done'], ['Partner’s tricks', 'Don’t trump your partner’s ace', 'next'],
    ['Calling trump', 'When to order it up, when to pass', ''], ['Going alone', 'Dot sits out. She’ll be watching.', ''], ['Defense', 'How to euchre the other team', '']];
  return `<div class="pick"><div class="ctl" style="font-size:13px"><u>‹ Card Games</u><span></span></div>
    <h1 class="serif" style="font-weight:400;font-size:28px;margin:4px 0 0">Learn Euchre</h1>
    <div class="top"><div class="dseat"><div class="fig" style="width:110px">${D('sip')}</div><span class="tag">Grandma Dot</span></div>
      <div class="say">Where were we? Don’t tell me. Pick a lesson.</div></div>
    <ol>${L.map(([t, s, st], i) => `<li class="${st}"><span class="n">${st === 'done' ? '✓' : i + 1}</span><span>${t}<small>${s}</small></span><em>${st === 'next' ? 'Next ›' : st === 'done' ? 'Again' : ''}</em></li>`).join('')}
      <li><span class="n" style="border-style:dashed">★</span><span>Graduation game<small>Win a full game with Dot to graduate</small></span><em>After 6</em></li></ol>
    <p style="font-size:12px;color:var(--mute);margin-top:10px">Lessons may grow into levels later.</p></div>`;
}

// The trump ladder for lesson 1: Jacks jump from their places to the top.
function ladder() {
  const start = [['A♥', 0, 0], ['K♥', 1, 0], ['Q♥', 2, 0], ['J♥', 3, 0], ['10♥', 4, 0], ['9♥', 5, 0], ['J♦', 5.6, 1.35]];
  return `<div class="ladder" id="lad"><span class="lab">Trump, high to low</span>
    ${start.map(([c, x, y]) => cd(c, 'sm').replace('class="cd', `style="left:${x * 28}px;top:${y * 30}px" class="cd`)).join('')}
    <span class="boss" style="left:-2px">Right · Left bower</span></div>`;
}
function jump(stage) {
  const end = ['J♥', 'J♦', 'A♥', 'K♥', 'Q♥', '10♥', '9♥'];
  stage.querySelectorAll('#lad .cd').forEach(el => {
    const i = end.indexOf(el.dataset.c);
    el.style.left = i * 28 + 'px'; el.style.top = '0px';
    if (el.dataset.c[0] === 'J') el.classList.add('hop', 'glow');
  });
  stage.querySelector('#lad').classList.add('done');
}

function kitchen(k) {
  return `<div class="kitchen" id="kit">
    <div class="why"><b>Why we’re here</b>${KITCHEN[k].why}</div>
    <svg viewBox="0 0 320 128" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-label="Dot's kitchen">
      <path d="M10 22h190v34h-190zM73 22v34M137 22v34"/><circle cx="66" cy="40" r="1.5"/><circle cx="80" cy="40" r="1.5"/><circle cx="130" cy="40" r="1.5"/><circle cx="144" cy="40" r="1.5"/>
      <path d="M4 120h312"/>
      <path d="M216 22h44v28h-44z M238 22v28"/>
      <ellipse cx="70" cy="110" rx="42" ry="9"/><path d="M38 104l64-6" stroke-width="5" class="occ"/>
      <path d="M128 114h64v6h-64z"/><circle cx="140" cy="111" r="4.5"/><circle cx="155" cy="111" r="4.5"/><circle cx="170" cy="111" r="4.5"/><circle cx="184" cy="111" r="4.5"/>
      <path d="M120 98l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z"/>
      <text x="226" y="70" font-size="11" fill="currentColor" stroke="none" font-family="Georgia,serif">Dot’s kitchen</text>
    </svg>
    <div style="width:160px;margin-top:-6px">${D('pin', 'bare')}</div>
    <div class="line serif" id="kline">${KITCHEN[k].lines[0]}</div>
    <div class="prog"><i id="kprog"></i></div>
    <div class="skip">Tap to skip</div>
  </div>`;
}
function kitchenFrame(k, cap) {
  return { cap, html: () => T({ n: 4, scores: [4, 7], tally: 0, hand: [], pose: 'pin', extra: kitchen(k) }),
    after: st => {
      const f = seq.frames[idx];
      f.kitchen = true;
      runKitchen(st, k, () => { if (seq && seq.frames[idx] === f && f.kitchen) next(); });
    } };
}
function runKitchen(stage, k, done) {
  const bar = stage.querySelector('#kprog'), line = stage.querySelector('#kline');
  const L = KITCHEN[k].lines;
  bar.style.animation = `fill ${KITCHEN_SECS}s linear forwards`;
  L.forEach((t, i) => later(() => { line.textContent = t; }, i * KITCHEN_SECS * 1000 / L.length));
  later(done, KITCHEN_SECS * 1000);
}

const SEQ = {
  1: { title: '1 · Entry', frames: [
    { cap: '<b>The game list.</b> A full-width “Learn with Grandma Dot” button under Euchre, with a tiny Dot.', html: () => gameList('A') },
    { cap: '<b>The lesson picker.</b> Six lessons. Two done, the next one marked. Dot greets you.', html: picker }
  ] },
  2: { title: '2 · Lesson 1: the bower jump', frames: [
    { cap: '<b>Lesson 1.</b> Every hand is face up, just this once. Nobody has named trump yet.', html: () => T({ ...L1, trump: null, note: 'Nobody has named trump yet', pose: 'sip', say: 'Look at everyone’s cards. Just this once.' }) },
    { cap: '<b>Hearts are trump.</b> Every trump card glows, including the J♦: the other red Jack counts as a heart now.', html: () => T({ ...L1, hc: TRUMP_GLOW, banner: 'Hearts are trump', pose: 'lean' }) },
    { cap: '<b>The jump.</b> Both Jacks hop to the top of the trump suit: right bower, then left bower.', html: () => T({ ...L1, hc: TRUMP_GLOW, center: ladder(), pose: 'lean', say: 'Jacks are the bosses. Both of them. Don’t ask, just watch.' }),
      after: st => later(() => jump(st), 900) }
  ] },
  3: { title: '3 · Lesson 2: follow suit', frames: [
    { cap: '<b>Follow suit.</b> West led the K♠. Tap the <b>Q♣</b> (you’re not allowed to: you have a spade).', manual: true,
      html: () => T({ n: 2, scores: [1, 0], tally: 0, trick: { W: 'K♠', N: 'A♠', E: '10♠' }, hand: ['9♠', 'Q♣', 'A♦', '10♥', 'K♥'], hc: { 'Q♣': 'try' }, pose: 'sip', msg: 'Your turn.' }),
      after: st => st.querySelector('[data-c="Q♣"]').addEventListener('click', e => {
        e.stopPropagation();
        st.innerHTML = T({ n: 2, scores: [1, 0], tally: 0, trick: { W: 'K♠', N: 'A♠', E: '10♠' }, hand: ['9♠', 'Q♣', 'A♦', '10♥', 'K♥'], hc: { 'Q♣': 'dim shake', '9♠': 'glow' }, pose: 'brow', say: 'Follow suit, sweetheart. It’s not a suggestion.', msg: 'Your turn.',
          extra: '<div class="rule" id="rule"><b>Rule</b>Follow suit: if you have the suit that was led, you must play it.</div>' });
        later(() => st.querySelector('#rule').classList.add('in'), 60);
        later(() => st.querySelector('#rule').classList.remove('in'), 2600);
        document.querySelector('.cap').innerHTML = '<b>It dims and shakes</b>, the rule card slides in from the edge and away, and Dot raises an eyebrow. The 9♠ (the card you can play) glows.<span class="tap">Tap anywhere to continue.</span>';
        seq.frames[idx].manual = false;
      }) }
  ] },
  4: { title: '4 · Putz reaction', frames: [
    { cap: '<b>Lesson 3.</b> Dot leads the A♣ and it’s winning. You have no clubs. Watch what you play…', html: () => T({ ...PUTZ, tally: 0, hc: { '9♥': 'up' }, pose: 'sip' }),
      after: st => later(() => {
        st.innerHTML = T({ ...PUTZ_END, fresh: true, extra: napShow(['Trumped my ace']) });
        document.querySelector('.cap').innerHTML = '<b>You trumped her ace.</b> Face-palm. Her napkin comes out big: a mark, and what it’s for. Then it goes back by her mug. Three marks in a lesson and you’re going to the kitchen.<span class="tap">Tap anywhere to continue.</span>';
      }, 1100) },
  ] },
  5: { title: '5 · “Why?”', frames: [
    { cap: '<b>Ask why.</b> After a putz play, Dot glows. <b>Tap Dot</b> for a one-line explanation.', manual: true,
      html: () => T({ ...PUTZ_END, dotCls: 'tapme', say: '' }),
      after: st => st.querySelector('[data-dot]').addEventListener('click', e => {
        e.stopPropagation();
        st.innerHTML = T({ ...PUTZ_END, pose: 'lean', sayCls: 'why', say: '<b>Why?</b> My ace was already winning. Now we’ve wasted your trump.' });
        seq.frames[idx].manual = false;
        document.querySelector('.cap .tap')?.remove();
        document.querySelector('.cap').insertAdjacentHTML('beforeend', '<span class="tap">Tap anywhere to continue.</span>');
      }) }
  ] },
  6: { title: '6 · Take it back', frames: [
    { cap: '<b>Once per hand</b> you can take a card back. Tap <b>Take it back</b>.', manual: true,
      html: () => T({ ...PUTZ_END, back: 'hot', say: '' }),
      after: st => st.querySelector('[data-back]').addEventListener('click', e => {
        e.stopPropagation();
        st.innerHTML = T({ ...PUTZ, tally: 1, hand: ['9♥', '10♠', 'K♦', 'Q♥', 'A♦'], hc: { '9♥': 'up' }, back: 'off', backLabel: 'Used this hand', pose: 'brow', say: 'Fine, take it back. You’re on dish duty.' });
        seq.frames[idx].manual = false;
        document.querySelector('.cap').innerHTML = '<b>The 9♥ comes back</b> to your hand. Once per hand: the button is used up until the next deal. The napkin mark stays (she saw it). Dish duty is just a joke.<span class="tap">Tap anywhere to continue.</span>';
      }) }
  ] },
  7: { title: '7 · Catastrophe', frames: [
    { cap: '<b>Way 1 into the kitchen: the third napkin mark.</b> Two marks already this lesson. Dot’s K♣ is winning, and you trump it…', html: () => T({ n: 3, scores: [4, 7], tally: 2, trick: { N: 'K♣', E: '10♣' }, hand: ['9♥', 'A♦', 'Q♠'], hc: { '9♥': 'up' }, pose: 'brow' }),
      after: st => later(() => {
        st.innerHTML = T({ n: 3, scores: [4, 7], tally: 3, fresh: true, trick: { N: 'K♣', E: '10♣', S: '9♥' }, hand: ['A♦', 'Q♠'], pose: 'pin', say: 'Kitchen. Now. We’re making sugar cookies and talking about that.',
          extra: napShow(['Trumped my ace', 'Passed with 3 trump', 'Trumped my king. Again.']) });
        document.querySelector('.cap').innerHTML = '<b>Mark three.</b> The napkin shows all three reasons, then the rolling pin comes out.<span class="tap">Tap anywhere to continue.</span>';
      }, 1100) },
    kitchenFrame('marks', '<b>The kitchen, 3 seconds.</b> It says why you’re there. Tap to skip.'),
    { cap: '<b>Back at the table, with a fresh napkin.</b> The marks start over.', html: () => T({ n: 3, scores: [4, 7], tally: 0, hand: ['K♥', 'A♣', '9♦', 'J♠', 'Q♣'], pose: 'sip', say: 'Fresh napkin. Don’t make me use it.' }) },
    { cap: '<b>Way 2 into the kitchen: getting euchred.</b> We called hearts and took only two tricks. (No napkin mark: the kitchen is enough.)', html: () => T({ n: 4, scores: [4, 9], tally: 1, trick: { S: 'Q♥', W: 'A♠', N: '9♦', E: '9♠' }, banner: 'Euchred. They score 2.', hand: [], pose: 'pin', say: 'Euchred? Kitchen. Bring your excuses.' }) },
    kitchenFrame('euchred', '<b>The kitchen again</b>, with a different reason. Tap to skip.'),
    { cap: '<b>Back at the table.</b>', html: () => T({ n: 4, scores: [4, 9], tally: 1, hand: ['A♥', 'K♣', '10♦', 'Q♠', '9♣'], pose: 'sip', say: 'Better. Deal.' }) }
  ] },
  8: { title: '8 · Great play', frames: [
    { cap: '<b>A genuinely good play.</b> You led the right bower and pulled two trumps out of their hands.', html: () => T({ n: 5, scores: [6, 7], tally: 1, trick: { S: 'J♥', W: '9♥', N: '10♣', E: 'Q♥' }, tc: { S: 'glow' }, hand: ['A♥', 'K♠', 'Q♦', '10♦'], pose: 'clap', say: 'Okay, that was good. Don’t let it go to your head.' }) }
  ] },
  9: { title: '9 · Hint', frames: [
    { cap: '<b>Taking too long.</b> After a while Dot starts tapping the table. (Extra line, not in your brief.)', html: () => T({ n: 5, scores: [6, 7], tally: 1, trick: { W: '9♠', N: 'Q♠', E: 'K♠' }, hand: ['A♠', '10♠', 'J♣', 'K♦', '9♥'], pose: 'tap', say: 'Any time now. I’m not getting younger.', msg: 'Your turn.' }) },
    { cap: '<b>You tap Hint.</b> Dot leans in, an arrow points at the card she suggests, and it glows. Hints are unlimited and free; she just has a new remark each time.', html: () => T({ n: 5, scores: [6, 7], tally: 1, trick: { W: '9♠', N: 'Q♠', E: 'K♠' }, hand: ['A♠', '10♠', 'J♣', 'K♦', '9♥'], hc: { 'A♠': 'glow' }, arrow: 'A♠', hint: 'hot', pose: 'lean', say: 'A hint? Lou never needed a hint. He needed glasses.', msg: 'Your turn.' }) }
  ] },
  10: { title: '10 · Leaving mid-lesson', frames: [
    { cap: '<b>You tap Leave</b> in the middle of a lesson. Dot warns you first.', manual: true,
      html: () => T({ ...PUTZ, tally: 1, pose: 'sip', extra: `<div class="ov"><div class="sheet"><div style="width:110px;margin:0 auto">${D('brow', 'bare')}</div>
        <p class="serif" style="font-size:19px;margin:6px 0 14px">Leave now and I’ll forget all of this. I’m old, not patient.</p>
        <div class="btns"><button class="btn pri" data-x="stay">Stay</button><button class="btn" data-x="leave">Leave</button></div>
        <p style="font-size:11.5px;color:var(--mute);margin:10px 0 0">Stay closes this. Leave goes back to the lesson picker.</p></div></div>` }),
      after: st => st.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); if (b.dataset.x === 'stay') { st.querySelector('.ov').remove(); seq.frames[idx].manual = false; } else { st.innerHTML = picker(); seq.frames[idx].manual = false; } })) }
  ] },
  11: { title: '11 · Graduation', frames: [
    { cap: '<b>The graduation game.</b> After the six lessons, a full game with Dot. You win it: that’s graduation.', html: () => T({ barLabel: '<b>Graduation game</b> · first to 10', scores: [10, 7], tally: 1, trick: { S: 'A♥', W: '9♥', N: 'J♣', E: '10♥' }, banner: 'We win, 10 to 7', hand: [], pose: 'clap', say: 'We won. Don’t get used to it.' }) },
    { cap: '<b>The certificate</b>, signed Grot.', html: () => T({ barLabel: '<b>Graduation game</b> · first to 10', scores: [10, 7], tally: 1, trump: null, pose: 'smug', hand: [], extra: `<div class="ov"><div class="cert">
        <h2>Certificate of Euchre</h2><div class="sub">Big table privileges</div>
        <div class="who">You</div>
        <p>Grot says you can sit at the big table.</p>
        <div class="sig"><div class="seal">6 of 6<br>lessons</div><div>Napkin marks: 7<br>(we don’t talk about it)</div><div><b>Grot</b>signed</div></div></div></div>` }) },
    { cap: '<b>Her name tag changes to Grot.</b> From now on, that’s what it says.', html: () => T({ barLabel: 'Play with Grot', scores: [0, 0], tally: 0, trump: null, pose: 'smug', grot: true, hand: ['A♥', 'K♣', 'Q♠', '10♦', '9♣'], say: 'You can call me Grot now. Don’t make me regret it.' }) }
  ] },
  L: { title: 'Lesson bar options', frames: [
    { cap: '<b>Option 1 (your pick):</b> lesson bar right under the header. The napkin sits by Dot’s mug.', html: () => T({ ...PUTZ_END, say: '' }) },
    { cap: '<b>Option 2:</b> lesson bar just above your hand, napkin inside the bar. Buttons are close to your thumb.', html: () => T({ ...PUTZ_END, say: '', layout: { bar: 'bottom', napkin: 'bar' } }) },
    { cap: '<b>Option 3:</b> no bar. “Lesson 3 of 6” on the line under the header; Hint and Take it back on either side of “You”.', html: () => T({ ...PUTZ_END, say: '', layout: { bar: 'split' } }) }
  ] },
  S: { title: 'Dot’s size and frame', frames: [
    { cap: '<b>Same size as the other players</b> (50px), inside a circle like them. Your pick: the screens use this now.', html: () => T({ ...PUTZ_END, size: 50, ring: true }) },
    { cap: '<b>About 1.4×</b> (70px), no circle.', html: () => T({ ...PUTZ_END, size: 70 }) },
    { cap: '<b>About 1.7×</b> (84px), no circle.', html: () => T({ ...PUTZ_END, size: 84 }) },
    { cap: '<b>About 2×</b> (100px). She takes over the top of the table.', html: () => T({ ...PUTZ_END, size: 100 }) }
  ] }
};
SEQ.all = { title: 'All screens', frames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].flatMap(k => SEQ[k].frames.map(f => ({ ...f, cap: `<span style="color:var(--capink)">${SEQ[k].title}</span><br>` + f.cap }))) };

const DECIDED = [
  ['Which Dot', 'A, the church-basement classic.'],
  ['Her size', 'Same as the other players, in a circle.'],
  ['Lesson bar', 'Under the header. Trump shows in the corner of the table, like the live game.'],
  ['“Why?”', 'Tap Dot after a putz play.'],
  ['The six lessons', 'The bowers, follow suit, partner’s tricks, calling trump, going alone, defense.'],
  ['Graduating', 'Win your first full game with Dot, after the six lessons.'],
  ['The napkin', 'One mark per putz play. Each time, the napkin comes out big with the reason written on it, then goes back by her mug.'],
  ['Kitchen', '3 seconds, tap to skip, says why you’re there. Getting euchred sends you there too.'],
  ['Game-list button', 'A full-width “Learn with Grandma Dot” button under Euchre.'],
  ['Kitchen after napkin marks', '3 marks in one lesson, then a fresh napkin.'],
  ['Getting euchred', 'Sends you to the kitchen, with no napkin mark.'],
  ['Her lines', 'Keep all: the lines in your brief plus the ones I added.'],
  ['Hint', 'Unlimited and free. Dot has a new remark each time.'],
  ['Take it back', 'Once per hand. The napkin mark stays. Dish duty is just a joke.'],
  ['Saving progress', 'Later. Idea for then: “We’re back to this again? Haven’t you learned anything?”'],
  ['A more finished Dot', 'You’re looking for an image service where you keep the rights. The sketches here stand in until then.'],
  ['Keep it flexible', 'Lessons may become levels later; the lesson bar can say anything (it already says “Graduation game”).']
];
const DECISIONS = [];   // everything for Step 1 is decided

// ---------- pages ----------
function chrome(title, back = true) {
  return `<div class="bar">${back ? '<button class="b" data-nav="back">‹</button>' : ''}<span class="where">${title}</span>
    <span class="tk">${['art', 'A', 'B', 'C'].map(k => `<button data-take="${k}" class="${k === take ? 'on' : ''}">${k === 'art' ? 'Art' : k}</button>`).join('')}</span>
    <button class="b" data-nav="theme" aria-label="Light or dark">◐</button>${back ? '<button class="b" data-nav="home">✕</button>' : ''}</div>`;
}
function home() {
  cancel(); seq = null;
  const item = (k, t, s) => `<a href="#${k}"><b>${k}</b><span>${t}<small>${s}</small></span></a>`;
  app.innerHTML = `${chrome('Grandma Dot wireframes', false)}<div class="home"><h1>Grandma Dot</h1>
    <p>Rough on purpose: sketches, gray boxes, fake cards, no rules running. Tap anywhere on a screen to go to the next. The A · B · C switch at the top changes which Dot the screens use; ◐ flips light and dark.</p>
    <div class="hero"><div style="width:150px">${artImg('sip', 'heroart')}</div></div>
    <h2>Part A</h2>${item('A', 'Dot', 'The drawn Dot in nine poses, plus the first sketches')}
    <h2>Part B · Tap-through</h2>
    ${item('all', 'All screens in order', 'Screens 1 to 11, one after another')}
    ${item('1', 'Entry', 'Game-list button and the lesson picker')}
    ${item('2', 'Lesson 1: the bower jump', 'Hands face up, trump glows, Jacks jump')}
    ${item('3', 'Lesson 2: follow suit', 'Tap a card you can’t play')}
    ${item('4', 'Putz reaction', 'Trumping Dot’s ace; the napkin comes out with the reason')}
    ${item('5', '“Why?”', 'Tap Dot for the reason')}
    ${item('6', 'Take it back', 'Once per hand; dish duty')}
    ${item('7', 'Catastrophe', 'Two ways into the kitchen: the third napkin mark, or getting euchred')}
    ${item('8', 'Great play', 'Slow clap')}
    ${item('9', 'Hint', 'Lou needed glasses; an arrow to the card')}
    ${item('10', 'Leaving mid-lesson', 'Stay or Leave')}
    ${item('11', 'Graduation', 'Win a full game with her, then the certificate and the Grot tag')}
    <h2>Options to compare</h2>
    ${item('L', 'Lesson bar placement', 'Decided: under the header')}
    ${item('S', 'Dot’s size and frame', 'Decided: same as the others')}
    <h2>Your call</h2>
    ${item('?', 'Decisions', DECISIONS.length ? DECISIONS.length + ' still open, ' + DECIDED.length + ' decided' : 'All ' + DECIDED.length + ' decided')}
    </div>`;
}
function gallery() {
  cancel(); seq = null;
  app.innerHTML = `${chrome('Part A · Dot')}<div class="gal">
    <h2 class="serif" style="font-weight:400;font-size:24px;margin:4px 0 2px">The drawn Dot</h2>
    <p style="font-size:12.5px;color:var(--mute);margin:0 0 8px">Based on sketch A. Used in the screens. Tap one to see it big.</p>
    <div class="row">${POSES.map(([k, name]) => `<button class="cell art" data-big="art:${k}">${artImg(k)}<span>${name}</span></button>`).join('')}</div>
    <h2 class="serif" style="font-weight:400;font-size:24px;margin:22px 0 6px">The first sketches</h2>
    <div class="takes">${['A', 'B', 'C'].map(k => { const [n, ...rest] = TAKE_INFO[k].name.split(' · '); return `<div><b>${n}</b>${rest.join(' · ')}<br><small>${TAKE_INFO[k].about}</small></div>`; }).join('')}</div>
    ${POSES.map(([k, name, when]) => `<h3>${name}<small>${when}</small></h3>
      <div class="row">${['A', 'B', 'C'].map(t => `<button class="cell" data-big="${t}:${k}"><i>${t}</i>${dotSVG(t, k, { label: `Dot ${t}, ${name}` })}</button>`).join('')}</div>`).join('')}
    <p style="font-size:12px;color:var(--mute);margin-top:18px">All three have glasses on a chain (the dotted line), a cardigan, set hair and a coffee mug. The mug is in every pose: in her hand, or on the table.</p></div>`;
}
function decisions() {
  cancel(); seq = null;
  app.innerHTML = `${chrome('Decisions')}<div class="home"><h1>Your call</h1>
    <h2>Still open</h2>
    ${DECISIONS.length ? '' : '<p>Nothing. Step 1 is fully decided.</p>'}
    ${DECISIONS.map(([t, q], i) => `<a style="display:block"><b style="display:inline;font-size:16px">${i + 1}. ${t}</b><small style="font-size:14px;color:var(--ink);margin-top:4px">${q}</small></a>`).join('')}
    <h2>Decided</h2>
    ${DECIDED.map(([t, q]) => `<a style="display:block"><b style="display:inline;font-size:15px">✓ ${t}</b><small style="font-size:13.5px;margin-top:3px">${q}</small></a>`).join('')}</div>`;
}
function show() {
  cancel();
  const f = seq.frames[idx];
  app.innerHTML = `${chrome(`${seq.title} · ${idx + 1}/${seq.frames.length}`)}
    <div class="cap">${f.cap}${f.manual ? '' : '<span class="tap">Tap anywhere to continue.</span>'}</div>
    <div id="stage" style="position:relative;flex:1;display:flex;flex-direction:column">${f.html()}</div>`;
  if (f.after) f.after(document.getElementById('stage'));
}
function next() {
  if (!seq) return;
  if (idx < seq.frames.length - 1) { idx++; show(); window.scrollTo(0, 0); } else location.hash = '';
}

app.addEventListener('click', e => {
  const t = e.target.closest('[data-take]');
  if (t) { take = t.dataset.take; return route(true); }
  const n = e.target.closest('[data-nav]');
  if (n) {
    if (n.dataset.nav === 'home') location.hash = '';
    if (n.dataset.nav === 'back') { if (seq && idx > 0) { idx--; show(); } else location.hash = ''; }
    if (n.dataset.nav === 'theme') {
      const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    }
    return;
  }
  const b = e.target.closest('[data-big]');
  if (b) {
    const [tk, k] = b.dataset.big.split(':'), P = POSES.find(x => x[0] === k);
    document.body.insertAdjacentHTML('beforeend', `<div class="big" data-close><div>${tk === 'art' ? D(k) : dotSVG(tk, k)}<b style="color:var(--ink)">${tk === 'art' ? 'Dot' : 'Dot ' + tk} · ${P[1]}</b><br>${P[2]}<br><br>Tap to close</div></div>`);
    return;
  }
  if (!seq || !e.target.closest('#stage, .cap')) return;
  if (seq.frames[idx].manual) return;
  if (seq.frames[idx].kitchen) seq.frames[idx].kitchen = false;
  next();
});
document.body.addEventListener('click', e => { const c = e.target.closest('.big[data-close]'); if (c) c.remove(); });

// Re-renders keep the same screen (used by the A/B/C switch).
function route(keep = false) {
  const k = decodeURIComponent(location.hash.slice(1));
  if (k === '?') return decisions();
  if (k === 'A') return gallery();
  if (SEQ[k]) {
    if (!(keep && seq === SEQ[k])) { seq = SEQ[k]; idx = 0; }
    seq.frames.forEach(f => { if (f.after && f.manual === false && f._wasManual) f.manual = true; });
    return show();
  }
  home();
}
// Interactive frames start out waiting for their tap each time you open them.
Object.values(SEQ).forEach(s => s.frames.forEach(f => { if (f.manual) f._wasManual = true; }));
window.addEventListener('hashchange', () => { Object.values(SEQ).forEach(s => s.frames.forEach(f => { if (f._wasManual) f.manual = true; })); route(); });
route();
