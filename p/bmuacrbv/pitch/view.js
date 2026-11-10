// Draws the Pitch screen from the game state, using the shared parts.
import { SYM, isRed } from '../../../shared/deck.js';
import { cardHTML, miniFanHTML } from '../../../shared/cards.js';
import { seatHTML, meHTML, tableHTML, centerHTML, slotHTML, SLOTS_4 } from '../../../shared/table.js';
import { headerHTML, levelLabel, linkHTML, controlsHTML, statusHTML, actionsHTML, handHTML, footHTML, resultSheetHTML } from '../../../shared/ui.js';
import { NAMES, team, bidName, bidShort, MOON } from './rules.js';

const whose = p => p === 0 ? 'Your' : NAMES[p] + '’s';
const teamName = t => t === 0 ? 'us' : 'them';
const cardShort = c => `<span class="${isRed(c.s) ? 'r' : ''}">${c.r}${SYM[c.s]}</span>`;

function seatTag(S, p) {
  if (S.phase !== 'bid' && p === S.bidder) return `Bid ${bidShort(S.bid)}`;
  return '';
}

function seat(S, p) {
  return seatHTML({
    face: p, name: NAMES[p], north: p === 2,
    turn: S.turn === p, dealer: S.dealer === p,
    said: S.said[p], tag: seatTag(S, p),
    fan: miniFanHTML(S.hands[p].length, { dealt: S.justDealt, delay: i => i * 70 + p * 20 })
  });
}

// The middle of the table: the bid while bidding, then the trick.
function center(S) {
  let h = '';
  if (S.trump) h += `<div class="trump">Trump<b class="${isRed(S.trump) ? 'r' : ''}">${SYM[S.trump]}</b></div>`;
  if (S.phase === 'bid' || (S.phase === 'play' && !S.history.length)) {
    const cap = S.bid ? `${S.bidder === 0 ? 'Your' : NAMES[S.bidder] + '’s'} bid` : 'No bids yet';
    h += `<div class="pile"><div class="bigbid">${S.bid ? bidShort(S.bid) : '–'}</div><div class="cap">${cap}</div></div>`;
  } else {
    for (const e of S.trick) {
      h += slotHTML(SLOTS_4[e.p], cardHTML(e.card, S.winner === e.p ? 'win' : '', 'tabindex="-1"'), e.card.id === S.lastPlayed);
    }
  }
  return centerHTML(h);
}

function actions(S, bidOptions) {
  if (S.turn === 0 && S.phase === 'bid') {
    return bidOptions().map(b => b === S.bid
      ? `<button class="btn" data-act="bid" data-b="${b}" aria-label="Match ${bidName(b)} and take the bid">Take ${bidShort(b)}</button>`
      : `<button class="btn${b === MOON ? '' : ' num'}" data-act="bid" data-b="${b}" aria-label="Bid ${bidName(b)}">${bidShort(b)}</button>`).join('') +
      `<button class="btn" data-act="pass">Pass</button>`;
  }
  return '';
}

function hand(S, legal) {
  const myTurn = S.phase === 'play' && S.turn === 0;
  const L = myTurn ? legal(0) : [];
  return S.hands[0].map((c, i) => {
    let cls = '';
    if (myTurn) cls = L.includes(c) ? 'can' : 'no';
    if (S.justDealt) cls += ' dealt';
    const dis = (myTurn && L.includes(c)) ? '' : 'tabindex="-1"';
    return cardHTML(c, cls, `data-card="${c.id}" ${dis} style="animation-delay:${i * 70}ms"`);
  }).join('');
}

// The end-of-hand summary: who got each point, and what happened to the bid.
function summary(S) {
  const r = S.result;
  const line = (label, pt, detail) => `<span class="pt"><b>${label}</b> ${pt ? `${teamName(pt.team) === 'us' ? 'Us' : 'Them'}${detail ? ' · ' + detail : ''}` : detail}</span>`;
  const rows = [
    line('High', r.high, `${whose(r.high.p)} ${cardShort(r.high.card)}`),
    line('Low', r.low, `${whose(r.low.p)} ${cardShort(r.low.card)}`),
    line('Jack', r.jack, r.jack ? `${whose(r.jack.p)} jack, won by ${teamName(r.jack.team)}` : 'Not dealt this hand'),
    line('Game', r.game, r.game ? `${r.count[r.game.team]} to ${r.count[1 - r.game.team]}` : `Tied ${r.count[0]}–${r.count[1]}, nobody`)
  ];
  const bidTeam = r.bt === 0 ? 'Your team' : 'Their team';
  const got = r.points[r.bt];
  const verdict = S.bid === MOON
    ? (r.moonMade ? `${bidTeam} shot the moon and took every point.` : `${bidTeam} tried to shoot the moon and took ${got} of 4${r.jack ? '' : ' (nobody was dealt the Jack)'}: minus 4.`)
    : r.made ? `${bidTeam} bid ${S.bid} and took ${got}: ${r.bt === 0 ? 'we score' : 'they score'} ${got}.`
    : `${bidTeam} bid ${S.bid} but took only ${got}: minus ${S.bid}.`;
  const other = r.points[1 - r.bt] ? ` ${r.bt === 0 ? 'They' : 'We'} score ${r.points[1 - r.bt]}.` : '';
  return `<span class="pts">${rows.join('')}</span>${verdict}${other}`;
}

// The whole screen. opts: { legal, bidOptions, version, feedback }
export function renderHTML(S, { legal, bidOptions, version, feedback }) {
  if (!S.hands) return '';
  const scores = [{ label: 'Us', value: S.score[0], cls: 'us' }, { label: 'Them', value: S.score[1] }];
  const detail = S.phase === 'play' || S.phase === 'handEnd' || S.phase === 'gameOver'
    ? `Tricks: us ${S.tricks[0]}, them ${S.tricks[1]} · ${team(S.bidder) === 0 ? 'We' : 'They'} bid ${bidShort(S.bid)}` : 'First to 21 wins';
  return `
    ${headerHTML('Pitch', scores)}
    ${controlsHTML(`<span class="lvl">${levelLabel(S.level)} level</span>`, [linkHTML('menu', 'Menu')])}
    ${tableHTML({
      north: seat(S, 2), west: seat(S, 1), east: seat(S, 3), center: center(S),
      south: meHTML({ turn: S.turn === 0, dealer: S.dealer === 0, tag: seatTag(S, 0) })
    })}
    ${statusHTML(S.msg, detail)}
    ${actionsHTML(actions(S, bidOptions))}
    ${handHTML(hand(S, legal), S.hands[0].length)}
    ${footHTML(version, feedback)}
    ${S.overlay ? resultSheetHTML({
      title: S.overlay.title, body: summary(S), button: S.overlay.btn,
      scores: [{ label: 'Us', value: S.score[0] }, { label: 'Them', value: S.score[1] }]
    }) : ''}
  `;
}
