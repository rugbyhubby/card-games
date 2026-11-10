// Draws the Cribbage screen from the game state, using the shared parts.
//
//   Cribbage                       You  Computer      scores
//   Medium level                              Menu
//   [ board, lying across the table ]                (main.js mounts it in .board-slot)
//            Computer  [crib]                         crib sits by the dealer
//   [deck/starter]  [ pegging area: cards, count ]
//   status line, buttons
//   You  [crib]
//   your hand
import { cardHTML, backHTML, miniFanHTML } from '../../../shared/cards.js';
import { seatHTML, meHTML, bubbleHTML } from '../../../shared/table.js';
import { headerHTML, levelLabel, linkHTML, controlsHTML, statusHTML, actionsHTML, handHTML, footHTML, resultSheetHTML } from '../../../shared/ui.js';
import { SETUP, NAMES, SKUNK, DOUBLE_SKUNK } from './rules.js';
import { PEG_COLOR } from './board.js';

const dot = seat => `<i class="pdot" style="background:${PEG_COLOR[seat]}"></i>`;
const pile = (n, cls = '', top = '') => `<div class="pile ${cls}">${Array.from({ length: Math.min(n, 4) }, () => backHTML('sm')).join('')}${top}</div>`;

function crib(S, seat) {
  if (S.dealer !== seat || !S.crib || !S.crib.length || S.phase === 'cut') return '';
  return `<div class="stk">${pile(S.crib.length)}<span>${seat === 0 ? 'Your crib' : 'Crib'}</span></div>`;
}

// The deck, with the starter on top once it's turned. Tappable when it's your cut.
function deck(S, yourCut) {
  const top = S.starter ? cardHTML(S.starter, 'sm', 'tabindex="-1"') : '';
  const inner = pile(2, '', top);
  const label = S.starter ? 'Starter' : 'Deck';
  return yourCut
    ? `<button class="stk tapdeck" data-act="cut" aria-label="Cut the deck">${inner}<span>Tap to cut</span></button>`
    : `<div class="stk">${inner}<span>${label}</span></div>`;
}

const bubble = (S, seat) => bubbleHTML(S.said[seat] || '') + (S.pts[seat] ? `<div class="bubble pts">${S.pts[seat]}</div>` : '');

// The middle of the table.
function center(S) {
  if (S.phase === 'cut') {
    if (!S.cut) return `<button class="tapdeck big" data-act="cut" aria-label="Cut the deck">${pile(4)}<span>Tap the deck to cut</span></button>`;
    return `<div class="cuts">${S.cut.map((c, p) => `<div class="stk">${cardHTML(c, p === S.dealer ? 'win' : '', 'tabindex="-1"')}<span>${NAMES[p]}</span></div>`).join('')}</div>`;
  }
  if (S.count && (S.phase === 'count' || S.phase === 'claim')) return countArea(S);
  if (S.phase === 'handEnd' && S.handLog.length) {
    return `<div class="cl">This hand</div><div class="log">${S.handLog.map(l => `<div>${l.label} <b>${l.pts}</b>${l.note ? `<small>${l.note}</small>` : ''}</div>`).join('')}</div>`;
  }
  if (S.peg && (S.phase === 'peg' || S.phase === 'handEnd' || S.phase === 'gameOver') && S.peg.played.length) {
    const P = S.peg;
    let row = '', round = 0;
    for (const e of P.played) {
      if (e.round !== round) { row += '<span class="gap"></span>'; round = e.round; }
      const cls = `pc ${e.p === 0 ? 'you' : 'them'}${e.round < P.round ? ' old' : ''}${(P.hl || []).includes(e.card.id) && e.round === P.round ? ' win' : ''}`;
      row += cardHTML(e.card, cls, 'tabindex="-1"');
    }
    return `<div class="played">${row}</div><div class="cnt">Count <b>${P.count}</b></div>`;
  }
  if (S.phase === 'discard') return `<div class="cnt">${S.ready && S.ready[0] ? 'Waiting for Computer…' : `Choose ${SETUP[S.n].toCrib} for the crib`}</div>`;
  if (S.phase === 'peg') return `<div class="cnt">Count <b>0</b></div>`;
  return '';
}

// Counting: the cards and starter, the combination being said, and (muggins) your claims.
function countArea(S) {
  const C = S.count, claiming = S.phase === 'claim';
  const cls = c => [C.hl.includes(c.id) ? 'win' : '', claiming && S.claim.sel.includes(c.id) ? 'sel' : ''].join(' ');
  const card = c => cardHTML(c, 'sm ' + cls(c), claiming ? `data-card="${c.id}"` : 'tabindex="-1"');
  let h = `<div class="cl">${C.label}</div><div class="cards">${C.cards.map(card).join('')}<span class="gap"></span>${card(S.starter)}</div>`;
  if (S.phase === 'claim') {
    const cl = S.claim;
    h += `<div class="claims">${cl.claims.map((x, i) => `<button class="chip" data-act="unclaim" data-i="${i}" aria-label="Remove">${KIND[x.kind]} ${x.pts} ×</button>`).join('') || '<span class="hint">Tap cards that score together, then what they make.</span>'}</div>`;
  } else {
    h += `<div class="say">${C.say || '&nbsp;'}</div>`;
    const res = S.claim && S.claim.result && S.claim.claims.length && C.owner === 0 ? S.claim.claims : null;
    if (res) h += `<div class="claims">${res.map(x => `<span class="chip${x.ok ? '' : ' bad'}">${KIND[x.kind]} ${x.pts}</span>`).join('')}</div>`;
  }
  return h;
}
const KIND = { fifteen: '15', pair: 'Pair', run: 'Run', flush: 'Flush', nibs: 'Nibs' };

function actions(S, legal) {
  const cfg = SETUP[S.n];
  if (S.phase === 'discard' && !S.ready[0]) {
    const ok = S.sel.length === cfg.toCrib;
    return `<button class="btn pri" data-act="crib"${ok ? '' : ' disabled'}>Send to ${S.dealer === 0 ? 'your' : 'Computer’s'} crib</button>`;
  }
  if (S.phase === 'starter' && (S.dealer + 1) % S.n === 0) return '<button class="btn pri" data-act="cut">Cut</button>';
  if (S.phase === 'peg' && S.turn === 0 && !legal(0).length) return '<button class="btn pri" data-act="go">Go</button>';
  if (S.phase === 'claim') {
    const cl = S.claim;
    const off = cl.sel.length ? '' : ' disabled';
    return Object.entries(KIND).map(([k, l]) => `<button class="btn kind" data-act="claim" data-k="${k}"${off}>${l}</button>`).join('') +
      '<button class="btn pri" data-act="done">Done</button>';
  }
  if (S.phase === 'handEnd') return '<button class="btn pri" data-act="next">Next hand</button>';
  return '';
}

function hand(S, legal) {
  const cards = S.hands ? S.hands[0] : [];
  const myPeg = S.phase === 'peg' && S.turn === 0;
  const L = myPeg ? legal(0) : [];
  const discarding = S.phase === 'discard' && !S.ready[0];
  return cards.map((c, i) => {
    let cls = '';
    if (discarding) cls = 'discard' + (S.sel.includes(c.id) ? ' picked' : '');
    else if (myPeg) cls = L.includes(c) ? 'can' : 'no';
    if (S.justDealt) cls += ' dealt';
    const tab = discarding || (myPeg && L.includes(c)) ? '' : 'tabindex="-1"';
    return cardHTML(c, cls, `data-card="${c.id}" ${tab} style="animation-delay:${i * 80}ms"`);
  }).join('');
}

function detail(S) {
  if (S.phase === 'count' && S.count && !S.count.done && S.count.items.length) return 'Tap to skip to the total';
  if (S.phase === 'claim') return `Claimed so far: ${S.claim.claims.reduce((t, x) => t + x.pts, 0)}`;
  return 'First to 121 wins';
}

function gameOverBody(S) {
  const r = S.result, w = r.winner === 0;
  const skunk = r.games === 3 ? `${w ? 'Computer' : 'You'} finished under ${DOUBLE_SKUNK}: a double skunk, so this win counts as 3 games.`
    : r.games === 2 ? `${w ? 'Computer' : 'You'} finished under ${SKUNK}: a skunk, so this win counts as 2 games.` : '';
  return `${skunk}<span class="tally">Games won this visit<b>You ${S.tally[0]} · Computer ${S.tally[1]}</b></span>`;
}

// The whole screen. opts: { legal, version, feedback }
export function renderHTML(S, { legal, version, feedback }) {
  if (!S.hands) return '';
  const scores = [{ label: dot(0) + 'You', value: S.score[0], cls: 'us' }, { label: dot(1) + 'Computer', value: S.score[1] }];
  const yourCut = S.phase === 'starter' && (S.dealer + 1) % S.n === 0;
  const title = S.overlay && S.overlay.title + (S.result.games === 3 ? ', double skunk!' : S.result.games === 2 ? ', with a skunk!' : '');
  return `
    ${headerHTML('Cribbage', scores)}
    ${controlsHTML(`<span class="lvl">${levelLabel(S.level)} level${S.muggins ? ' · Muggins' : ''}</span>`, [linkHTML('menu', 'Menu')])}
    <div class="board-slot" aria-label="Board: you ${S.score[0]}, Computer ${S.score[1]}"></div>
    <div class="toprow">
      ${seatHTML({ face: 1, name: 'Computer', north: true, turn: S.turn === 1, dealer: S.dealer === 1 && S.phase !== 'cut', said: S.said[1] || S.pts[1] || '', fan: miniFanHTML(S.hands[1] ? S.hands[1].length : 0, { dealt: S.justDealt }) })}
      ${crib(S, 1)}
    </div>
    <div class="mid">
      <div class="side">${S.phase === 'cut' ? '' : deck(S, yourCut)}</div>
      <div class="pa${S.phase === 'count' && S.count && !S.count.done ? ' skip' : ''}">${center(S)}</div>
    </div>
    ${statusHTML(S.msg, detail(S))}
    ${actionsHTML(actions(S, legal))}
    <div class="merow">${bubble(S, 0)}${meHTML({ turn: S.turn === 0, dealer: S.dealer === 0 && S.phase !== 'cut' })}${crib(S, 0)}</div>
    ${handHTML(hand(S, legal), S.hands[0].length)}
    ${footHTML(version, feedback)}
    ${S.overlay ? resultSheetHTML({
      title, body: gameOverBody(S), button: S.overlay.btn,
      scores: [{ label: 'You', value: S.score[0] }, { label: 'Computer', value: S.score[1] }]
    }) : ''}
  `;
}
