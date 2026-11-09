// Pitch game flow: dealing, one round of bidding, play and scoring.
// No drawing here: after each change it calls onChange() and view.js redraws.
import { makeDeck, shuffle, SUIT_NAME as SNAME, cardName } from '../../../shared/deck.js';
import { NAMES, team, nextP, RANK, MOON, BIDS, bidName, WIN_AT, legalCards, trickWinner, scoreHand } from './rules.js';
import * as bots from './bots.js';
import * as hard from './bots-hard.js';

// options:
//   timer         from shared/timing.js; spaces out computer moves
//   levelAtStart  () => 'easy' | 'medium' | 'hard': the level for a new game (fixed until the next)
//   difficultyFor (seat) => level, to give seats different levels (simulator only)
//   onChange      called whenever something on screen should update
//   onEvent       called with a short note for every bid and card (used by the simulator)
export function createPitch({ timer, levelAtStart = () => 'medium', difficultyFor = null, onChange = () => {}, onEvent = () => {} }) {
  const S = { score: [0, 0], dealer: 0, level: 'medium' };
  const levelFor = p => difficultyFor ? difficultyFor(p) : S.level;
  const later = (fn, ms) => timer.later(fn, ms);
  const changed = () => onChange(S);
  const who = p => p === 0 ? 'You' : NAMES[p];
  const verb = (p, a, b) => p === 0 ? a : b;
  const msg = t => { S.msg = t; };
  const legal = p => legalCards(S.hands[p], S.trick, S.trump);

  // Your hand: by suit (trump first once it's known), high to low.
  function sortHuman() {
    let order = ['S', 'H', 'C', 'D'];
    if (S.trump) { const i = order.indexOf(S.trump); order = order.slice(i).concat(order.slice(0, i)); }
    S.hands[0].sort((a, b) => order.indexOf(a.s) - order.indexOf(b.s) || RANK[b.r] - RANK[a.r]);
  }

  function newGame() {
    timer.cancelAll(); S.score = [0, 0]; S.overlay = null; S.winnerTeam = null;
    S.level = levelAtStart();
    S.dealer = Math.floor(Math.random() * 4);
    newHand();
  }
  function newHand() {
    timer.cancelAll();
    const deck = shuffle(makeDeck());
    S.hands = [[], [], [], []];
    let p = nextP(S.dealer);
    for (let i = 0; i < 24; i++) { S.hands[p].push(deck[i]); p = nextP(p); }
    Object.assign(S, { phase: 'bid', turn: nextP(S.dealer), bid: 0, bidder: null, bidsIn: 0, said: {},
      trump: null, trick: [], history: [], won: [[], []], tricks: [0, 0], lastPlayed: null, winner: null,
      result: null, justDealt: true });
    sortHuman();
    msg(`${S.dealer === 0 ? 'You deal' : NAMES[S.dealer] + ' deals'}. Bidding starts with ${who(nextP(S.dealer))}.`);
    changed();
    later(step, 900);
  }
  // After the end-of-hand sheet: deal the next hand, or start over after game over.
  function next() {
    if (S.phase === 'gameOver') return newGame();
    S.overlay = null; S.dealer = nextP(S.dealer); newHand();
  }
  function step() {
    if (S.turn === 0 && S.phase === 'bid') msg(S.bid ? `Your bid: beat ${bidName(S.bid)}, or pass.` : 'Your bid: 2 or more, or pass.');
    if (S.turn === 0 && S.phase === 'play') {
      msg(!S.trump ? 'You won the bid. Lead a card: its suit becomes trump.'
        : S.trick.length ? 'Your turn. Tap a card to play.' : 'Your lead. Tap a card to play.');
    }
    changed();
    if ((S.phase === 'bid' || S.phase === 'play') && S.turn !== 0) later(botAct, S.phase === 'play' ? 650 : 850);
  }

  // Bids allowed for whoever is bidding now.
  const bidOptions = () => BIDS.filter(b => b > S.bid);

  function placeBid(p, amount) {
    onEvent('bid:' + p + ':' + amount);
    if (amount && amount > S.bid) {
      S.bid = amount; S.bidder = p; S.said[p] = bidName(amount);
      msg(`${who(p)} ${verb(p, 'bid', 'bids')} ${bidName(amount)}.`);
    } else {
      S.said[p] = 'Pass';
      msg(`${who(p)} ${verb(p, 'pass', 'passes')}.`);
    }
    S.bidsIn++;
    if (S.bidsIn < 4) { S.turn = nextP(S.turn); return step(); }
    // Everyone has bid once.
    if (S.bidder == null) {                                              // all passed: dealer is stuck
      S.bid = 2; S.bidder = S.dealer; S.said[S.dealer] = 'Stuck at 2';
      msg(`Everyone passed, so ${S.dealer === 0 ? 'you are' : NAMES[S.dealer] + ' is'} stuck with a bid of 2.`);
    } else {
      msg(`${who(S.bidder)} won the bid at ${bidName(S.bid)}. ${S.bidder === 0 ? 'Your' : 'Their'} first card sets trump.`);
    }
    S.phase = 'play'; S.turn = null; changed();
    later(() => { S.said = {}; S.turn = S.bidder; step(); }, 1300);
  }

  function play(p, card) {
    onEvent('play:' + p + ':' + card.id);
    if (!S.trump) { S.trump = card.s; sortHuman(); }                      // the bidder's first card sets trump
    S.hands[p] = S.hands[p].filter(c => c.id !== card.id);
    S.trick.push({ p, card }); S.lastPlayed = card.id;
    S.history.push({ p, card, led: S.trick[0].card.s });
    if (S.trick.length === 1 && S.history.length === 1) msg(`${who(p)} ${verb(p, 'lead', 'leads')} the ${cardName(card)}. ${SNAME[S.trump]} are trump.`);
    if (S.trick.length === 4) {
      const w = trickWinner(S.trick, S.trump);
      S.winner = w.p; S.tricks[team(w.p)]++; S.won[team(w.p)].push(...S.trick.map(e => e.card)); S.turn = null;
      msg(`${who(w.p)} ${verb(w.p, 'take', 'takes')} the trick.`);
      changed();
      return later(() => {
        S.trick = []; S.winner = null; S.lastPlayed = null;
        if (!S.hands[w.p].length) return endHand();
        S.turn = w.p; if (w.p !== 0) msg(`${who(w.p)} ${verb(w.p, 'lead', 'leads')}.`);
        step();
      }, 1300);
    }
    S.turn = nextP(p);
    step();
  }

  function endHand() {
    const r = scoreHand(S.history, S.won, S.trump);
    const bt = team(S.bidder), ot = 1 - bt;
    const before = [...S.score];
    let made, moonMade = false;
    if (S.bid === MOON) {
      moonMade = r.points[bt] === r.available;
      made = moonMade;
      if (!moonMade) S.score[bt] -= 4;
    } else {
      made = r.points[bt] >= S.bid;
      S.score[bt] += made ? r.points[bt] : -S.bid;
    }
    S.score[ot] += r.points[ot];
    S.result = { ...r, bt, made, moonMade, before };

    // Who has won? The bidding team goes out first.
    let winner = null;
    if (moonMade) winner = bt;
    else if (S.score[bt] >= WIN_AT) winner = bt;
    else if (S.score[ot] >= WIN_AT) winner = ot;

    const us = bt === 0;
    const title = moonMade ? (us ? 'We shot the moon!' : 'They shot the moon')
      : made ? (us ? 'We made our bid' : 'They made their bid')
      : (us ? 'We were set' : 'We set them!');
    S.phase = winner == null ? 'handEnd' : 'gameOver';
    S.winnerTeam = winner;
    S.turn = null;
    S.overlay = winner == null ? { title, btn: 'Deal next hand' }
      : { title: winner === 0 ? 'You win' : 'They win', btn: 'Play again' };
    changed();
  }

  // A computer player's move, for whichever seat's turn it is.
  function botMove(p) {
    const level = levelFor(p);
    const b = level === 'hard' ? hard : bots;
    if (S.phase === 'bid') return placeBid(p, b.bid(S, p, level, bidOptions()));
    if (S.phase === 'play') return play(p, b.playCard(S, p, level));
  }
  function botAct() {
    const p = S.turn; if (p == null || p === 0) return;
    botMove(p);
  }

  // Your moves. Each one is ignored if it isn't allowed right now.
  const you = {
    bid(amount) { if (S.phase === 'bid' && S.turn === 0 && bidOptions().includes(amount)) placeBid(0, amount); },
    pass() { if (S.phase === 'bid' && S.turn === 0) placeBid(0, 0); },
    play(id) {
      if (S.phase !== 'play' || S.turn !== 0) return;
      const card = legal(0).find(x => x.id === id);
      if (card) play(0, card);
    }
  };

  return { state: S, newGame, next, you, legal, botMove, bidOptions };
}
