// Draws the Euchre screen from the game state, using the shared parts.
import { SUITS, SYM, SUIT_NAME as SNAME, isRed } from '../../../shared/deck.js';
import { cardHTML, miniFanHTML } from '../../../shared/cards.js';
import { seatHTML, meHTML, tableHTML, centerHTML, slotHTML, SLOTS_4 } from '../../../shared/table.js';
import { headerHTML, segHTML, linkHTML, controlsHTML, statusHTML, actionsHTML, handHTML, footHTML, resultSheetHTML } from '../../../shared/ui.js';
import { NAMES } from './rules.js';

export const DIFFICULTIES = [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard', 'Coming soon']];

function seatTag(S, p) {
  if (p === S.sitter) return 'Sitting out';
  if (p === S.maker && S.trump) return `Called ${SYM[S.trump]}${S.alone ? ' alone' : ''}`;
  return '';
}

function seat(S, p) {
  return seatHTML({
    face: p, name: NAMES[p], north: p === 2,
    turn: S.turn === p, out: p === S.sitter, dealer: S.dealer === p,
    said: S.said[p], tag: seatTag(S, p),
    fan: miniFanHTML(S.hands[p].length, { dealt: S.justDealt, delay: i => i * 90 + p * 20 })
  });
}

// The middle of the table: the turned-up card while bidding, then the trick.
function center(S) {
  let h = '';
  if (S.trump) h += `<div class="trump">Trump<b class="${isRed(S.trump) ? 'r' : ''}">${SYM[S.trump]}</b></div>`;
  if (S.phase === 'bid1') {
    h += `<div class="pile"><div class="stack">${cardHTML(null)}${cardHTML(null)}${cardHTML(S.upcard)}</div><div class="cap">Turned up<br>${S.dealer === 0 ? 'You dealt' : NAMES[S.dealer] + ' dealt'}</div></div>`;
  } else if (S.phase === 'bid2' || (S.phase === 'redeal')) {
    h += `<div class="pile"><div class="stack">${cardHTML(null)}${cardHTML(null)}${cardHTML(null)}</div><div class="cap">${SYM[S.turnedDown]} turned down</div></div>`;
  } else if ((S.phase === 'discard' || S.phase === 'called') && S.upcardTaken) {
    h += `<div class="pile"><div class="stack">${cardHTML(null)}${cardHTML(null)}${cardHTML(S.upcard)}</div><div class="cap">${S.dealer === 0 ? 'You picked it up' : NAMES[S.dealer] + ' picked it up'}</div></div>`;
  } else {
    for (const e of S.trick) {
      h += slotHTML(SLOTS_4[e.p], cardHTML(e.card, S.winner === e.p ? 'win' : '', 'tabindex="-1"'), e.card.id === S.lastPlayed);
    }
  }
  return centerHTML(h);
}

function actions(S) {
  if (S.turn === 0 && S.phase === 'bid1') {
    const lbl = S.dealer === 0 ? 'Pick it up' : 'Order up';
    return `<button class="btn pri" data-act="order">${lbl} ${SYM[S.upcard.s]}</button>
      <button class="btn" data-act="pass">Pass</button>
      <button class="btn tog" data-act="alone" aria-pressed="${S.aloneToggle}">Go alone</button>`;
  }
  if (S.turn === 0 && S.phase === 'bid2') {
    return SUITS.filter(s => s !== S.turnedDown).map(s =>
      `<button class="btn suit${isRed(s) ? ' r' : ''}" data-act="call" data-s="${s}" aria-label="Call ${SNAME[s]}">${SYM[s]}</button>`).join('') +
      `<button class="btn" data-act="pass">Pass</button>
       <button class="btn tog" data-act="alone" aria-pressed="${S.aloneToggle}">Go alone</button>`;
  }
  return '';
}

function hand(S, legal) {
  const myTurn = S.phase === 'play' && S.turn === 0;
  const L = myTurn ? legal(0) : [];
  return S.hands[0].map((c, i) => {
    let cls = '';
    if (S.phase === 'discard') cls = 'discard' + (c.id === S.upcard.id ? ' picked' : '');
    else if (myTurn) cls = L.includes(c) ? 'can' : 'no';
    if (S.justDealt) cls += ' dealt';
    const dis = (S.phase === 'discard' || (myTurn && L.includes(c))) ? '' : 'tabindex="-1"';
    return cardHTML(c, cls, `data-card="${c.id}" ${dis} style="animation-delay:${i * 90}ms"`);
  }).join('');
}

// The whole screen. opts: { legal, difficulty, version, feedback }
export function renderHTML(S, { legal, difficulty, version, feedback }) {
  if (!S.hands) return '';
  const showTricks = ['play', 'handEnd', 'gameOver'].includes(S.phase);
  const scores = [{ label: 'Us', value: S.score[0], cls: 'us' }, { label: 'Them', value: S.score[1] }];
  const myTag = seatTag(S, 0);
  return `
    ${headerHTML('Euchre', scores)}
    ${controlsHTML(
      segHTML({ label: 'Computer difficulty', key: 'diff', options: DIFFICULTIES, value: difficulty }),
      [linkHTML('rules', 'Rules'), linkHTML('new', 'New game')]
    )}
    ${tableHTML({
      north: seat(S, 2), west: seat(S, 1), east: seat(S, 3), center: center(S),
      south: meHTML({ turn: S.turn === 0, dealer: S.dealer === 0, tag: myTag })
    })}
    ${statusHTML(S.msg, showTricks ? `Tricks this hand: us ${S.tricks[0]}, them ${S.tricks[1]}` : '')}
    ${actionsHTML(actions(S))}
    ${handHTML(hand(S, legal), S.hands[0].length)}
    ${footHTML(version, feedback)}
    ${S.overlay ? resultSheetHTML({
      title: S.overlay.title, body: S.overlay.body, button: S.overlay.btn,
      scores: [{ label: 'Us', value: S.score[0] }, { label: 'Them', value: S.score[1] }]
    }) : ''}
  `;
}
