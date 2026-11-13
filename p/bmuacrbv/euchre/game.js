// Euchre game flow: dealing, the two bidding rounds, play and scoring.
// No drawing here: after each change it calls onChange() and view.js redraws.
import { makeDeck, shuffle, SUIT_NAME as SNAME, cardName } from '../../../shared/deck.js';
import { RANKS, NAMES, team, nextP, partnerOf, effSuit, power, legalCards, trickWinner } from './rules.js';
import * as bots from './bots.js';
import * as hard from './bots-hard.js';

// options:
//   timer         from shared/timing.js; spaces out computer moves
//   levelAtStart  () => 'easy' | 'medium' | 'hard': the level for a new game. It stays
//                 fixed until the next new game.
//   difficultyFor (seat) => level, to give seats different levels (simulator only)
//   onChange      called whenever something on screen should update
//   onEvent       called with a short note for every bid and card (used by the simulator)
export function createEuchre({ timer, levelAtStart = () => 'medium', difficultyFor = null, onChange = () => {}, onEvent = () => {} }) {
  const S = { score: [0, 0], dealer: 0, level: 'medium' };
  const levelFor = p => difficultyFor ? difficultyFor(p) : S.level;
  const later = (fn, ms) => timer.later(fn, ms);
  const changed = () => onChange(S);
  const who = p => p === 0 ? 'You' : NAMES[p];
  const verb = (p, a, b) => p === 0 ? a : b;
  const msg = t => { S.msg = t; };
  const activeCount = () => S.sitter == null ? 4 : 3;
  function nextActive(p) { let q = nextP(p); if (q === S.sitter) q = nextP(q); return q; }
  const legal = p => legalCards(S.hands[p], S.trick, S.trump);

  // Your hand, sorted by suit (trump first) and strength.
  function sortHuman() {
    const t = S.trump;
    let order = ['S', 'H', 'C', 'D'];
    if (t) { const i = order.indexOf(t); order = order.slice(i).concat(order.slice(0, i)); }
    S.hands[0].sort((a, b) => {
      const sa = order.indexOf(effSuit(a, t)), sb = order.indexOf(effSuit(b, t));
      if (sa !== sb) return sa - sb;
      return power(b, t, effSuit(b, t)) - power(a, t, effSuit(a, t));
    });
  }

  function newGame() {
    timer.cancelAll(); S.score = [0, 0]; S.overlay = null;
    S.level = levelAtStart();
    S.dealer = Math.floor(Math.random() * 4);
    newHand();
  }
  function newHand() {
    timer.cancelAll();
    const deck = shuffle(makeDeck(RANKS));
    S.hands = [[], [], [], []];
    let p = nextP(S.dealer);
    for (let i = 0; i < 20; i++) { S.hands[p].push(deck[i]); p = nextP(p); }
    S.upcard = deck[20];
    resetHand();
    msg(`${S.dealer === 0 ? 'You deal' : NAMES[S.dealer] + ' deals'}. The ${cardName(S.upcard)} is turned up.`);
    changed();
    later(step, 1000);
  }
  // Clear everything from the last hand (the cards are already dealt).
  function resetHand() {
    Object.assign(S, { trump: null, maker: null, alone: false, sitter: null, turnedDown: null, trick: [], tricks: [0, 0],
      said: {}, aloneToggle: false, upcardTaken: false, lastPlayed: null, winner: null, phase: 'bid1', turn: nextP(S.dealer), passes: 0, justDealt: true,
      history: [], discard: null });
    sortHuman();
  }
  // Lessons (euchre/learn/) deal set cards instead of shuffling. With `trump`, the
  // bidding is skipped: `maker` has already called it. With `hold`, play waits until
  // beginPlay() is called (so a lesson can explain things first).
  //   deal: { dealer, hands: [4 arrays of cards], upcard, trump?, maker?, hold? }
  function startHand({ dealer, hands, upcard, trump = null, maker = null, hold = false }) {
    timer.cancelAll(); S.overlay = null; S.dealer = dealer;
    S.hands = hands.map(h => h.map(c => ({ ...c })));
    S.upcard = { ...upcard };
    resetHand();
    if (!trump) {
      msg(`${S.dealer === 0 ? 'You deal' : NAMES[S.dealer] + ' deals'}. The ${cardName(S.upcard)} is turned up.`);
      changed();
      return later(step, 1000);
    }
    setTrump(trump, maker, false);
    S.phase = 'called'; S.turn = null;
    msg(`${who(maker)} ${verb(maker, 'call', 'calls')} ${SNAME[trump]}.`);
    changed();
    if (!hold) later(startPlay, 900);
  }
  // After the end-of-hand sheet: deal the next hand, or start over after game over.
  function next() {
    if (S.phase === 'gameOver') return newGame();
    S.overlay = null; S.dealer = nextP(S.dealer); newHand();
  }
  function step() {
    if (S.turn === 0 && S.phase === 'bid1') msg(`Your call: order up the ${SNAME[S.upcard.s].toLowerCase()}, or pass.`);
    if (S.turn === 0 && S.phase === 'bid2') msg('Your call: name a trump suit, or pass.');
    if (S.turn === 0 && S.phase === 'play') msg(S.trick.length ? 'Your turn. Tap a card to play.' : 'Your lead. Tap a card to play.');
    changed();
    if (['bid1', 'bid2', 'play'].includes(S.phase) && S.turn !== 0) later(botAct, S.phase === 'play' ? 650 : 850);
  }
  function setTrump(suit, p, alone) {
    S.trump = suit; S.maker = p; S.alone = !!alone;
    S.sitter = alone ? partnerOf(p) : null;
    sortHuman();
  }
  function bid1(p, order, alone) {
    onEvent('bid1:' + p + ':' + !!order + ':' + !!alone);
    if (!order) {
      S.said[p] = 'Pass'; S.passes++;
      msg(`${who(p)} ${verb(p, 'pass', 'passes')}.`);
      if (S.passes === 4) {
        S.phase = 'bid2'; S.turnedDown = S.upcard.s; S.passes = 0; S.said = {}; S.turn = nextP(S.dealer);
        msg(`Everyone passed. ${SNAME[S.turnedDown]} are out. Name another suit, or pass.`);
        changed(); return later(step, 1200);
      }
      S.turn = nextP(S.turn); return step();
    }
    setTrump(S.upcard.s, p, alone);
    S.said[p] = (p === S.dealer ? 'I’ll take it' : 'Order up') + (alone ? ', alone' : '');
    msg(`${who(p)} ${p === S.dealer ? verb(p, 'pick', 'picks') + ' it up' : verb(p, 'order', 'orders') + ' it up'}. ${SNAME[S.trump]} are trump${alone ? ', going alone' : ''}.`);
    S.turn = null;
    if (S.sitter !== S.dealer) {
      S.hands[S.dealer].push(S.upcard); S.upcardTaken = true;
      if (S.dealer === 0) {
        sortHuman(); S.phase = 'discard';
        msg(`${p === 0 ? 'You picked up' : who(p) + ' ordered you to pick up'} the ${cardName(S.upcard)} (raised in your hand). Tap any card to discard.`);
        return changed();
      }
      const d = bots.discardChoice(S.hands[S.dealer], S.trump);
      S.hands[S.dealer] = S.hands[S.dealer].filter(c => c !== d);
      S.discard = { p: S.dealer, card: d };
    }
    S.phase = 'called'; changed(); later(startPlay, 1100);
  }
  function bid2(p, suit, alone) {
    onEvent('bid2:' + p + ':' + suit + ':' + !!alone);
    if (!suit) {
      S.said[p] = 'Pass'; S.passes++;
      msg(`${who(p)} ${verb(p, 'pass', 'passes')}.`);
      if (S.passes === 4) {
        S.phase = 'redeal'; S.turn = null; msg('Nobody called trump. Redealing.');
        changed();
        return later(() => { S.dealer = nextP(S.dealer); newHand(); }, 1500);
      }
      S.turn = nextP(S.turn); return step();
    }
    setTrump(suit, p, alone);
    S.said[p] = SNAME[suit] + (alone ? ', alone' : '');
    msg(`${who(p)} ${verb(p, 'call', 'calls')} ${SNAME[suit]}${alone ? ' and ' + verb(p, 'go', 'goes') + ' alone' : ''}.`);
    S.turn = null; S.phase = 'called'; changed(); later(startPlay, 1100);
  }
  function discard(id) {
    S.discard = { p: 0, card: S.hands[0].find(c => c.id === id) };
    S.hands[0] = S.hands[0].filter(c => c.id !== id);
    S.phase = 'called'; msg('Discarded. Play begins.'); changed();
    later(startPlay, 600);
  }
  function startPlay() {
    S.phase = 'play'; S.said = {}; S.trick = [];
    let lead = nextP(S.dealer); if (lead === S.sitter) lead = nextP(lead);
    S.turn = lead;
    if (lead !== 0) msg(`${who(lead)} leads.`);
    step();
  }
  function play(p, card) {
    onEvent('play:' + p + ':' + card.id);
    S.hands[p] = S.hands[p].filter(c => c.id !== card.id);
    S.trick.push({ p, card }); S.lastPlayed = card.id;
    S.history.push({ p, card, led: effSuit(S.trick[0].card, S.trump) });   // every card played this hand
    if (S.trick.length === activeCount()) {
      const w = trickWinner(S.trick, S.trump);
      S.winner = w.p; S.tricks[team(w.p)]++; S.turn = null;
      msg(`${who(w.p)} ${verb(w.p, 'take', 'takes')} the trick.`);
      changed();
      return later(() => {
        S.trick = []; S.winner = null; S.lastPlayed = null;
        if (!S.hands[w.p].length) return endHand();
        S.turn = w.p; if (w.p !== 0) msg(`${who(w.p)} ${verb(w.p, 'lead', 'leads')}.`);
        step();
      }, 1300);
    }
    S.turn = nextActive(p);
    step();
  }
  function endHand() {
    const mt = team(S.maker), took = S.tricks[mt];
    let pts, tm, title;
    const us = mt === 0;
    if (took >= 3) {
      tm = mt; pts = took === 5 ? (S.alone ? 4 : 2) : 1;
      title = took === 5
        ? (us ? (S.alone ? 'Loner march!' : 'We marched!') : (S.alone ? 'They marched alone' : 'They marched'))
        : (us ? 'We made it' : 'They made it');
    }
    else { tm = 1 - mt; pts = 2; title = us ? 'We got euchred' : 'We euchred them!'; }
    S.score[tm] += pts;
    const body = `${who(S.maker)} called ${SNAME[S.trump]}${S.alone ? ' alone' : ''} and ${S.maker === 0 ? 'your team' : (team(S.maker) === 0 ? 'your team' : 'their team')} took ${took} of 5 tricks. ${tm === 0 ? 'Your team' : 'Their team'} scores ${pts}.`;
    S.phase = 'handEnd'; S.turn = null;
    if (S.score[tm] >= 10) {
      S.phase = 'gameOver';
      S.overlay = { title: tm === 0 ? 'You win' : 'They win', body: body + ` Game over.`, btn: 'Play again' };
    } else S.overlay = { title, body, btn: 'Deal next hand' };
    changed();
  }

  // A computer player's move, for whichever seat's turn it is.
  function botMove(p) {
    const level = levelFor(p);
    const b = level === 'hard' ? hard : bots;
    if (S.phase === 'bid1') { const d = b.bid1(S, p, level); return bid1(p, d.order, d.alone); }
    if (S.phase === 'bid2') { const d = b.bid2(S, p, level); return bid2(p, d.suit, d.alone); }
    if (S.phase === 'play') return play(p, b.playCard(S, p, level, activeCount()));
    if (S.phase === 'discard' && p === 0) return discard(bots.discardChoice(S.hands[0], S.trump).id);
  }
  function botAct() {
    const p = S.turn; if (p == null || p === 0) return;
    botMove(p);
  }

  // Your moves. Each one is ignored if it isn't allowed right now.
  const you = {
    toggleAlone() { if (S.turn !== 0) return; S.aloneToggle = !S.aloneToggle; changed(); },
    pass() { if (S.turn !== 0) return; return S.phase === 'bid1' ? bid1(0, false) : bid2(0, null); },
    order() { if (S.turn === 0 && S.phase === 'bid1') bid1(0, true, S.aloneToggle); },
    call(suit) { if (S.turn === 0 && S.phase === 'bid2') bid2(0, suit, S.aloneToggle); },
    discard(id) { if (S.phase === 'discard') discard(id); },
    play(id) {
      if (S.phase !== 'play' || S.turn !== 0) return;
      const card = legal(0).find(x => x.id === id);
      if (card) play(0, card);
    }
  };

  // startHand, beginPlay and resume are for the lessons (euchre/learn/); the game itself doesn't use them.
  // resume() carries on from the current state, e.g. after a lesson puts a card back.
  return { state: S, newGame, next, you, legal, botMove, startHand, beginPlay: startPlay, resume: step };
}
