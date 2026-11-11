// Cribbage game flow: the cut for first deal, dealing, the crib, the starter,
// pegging, counting (by you, or automatic) and the end of the game.
// No drawing here: after each change it calls onChange() and view.js redraws.
//
// Seat 0 is you, seat 1 the computer. The number of players comes from `players`
// and the deal sizes from rules.js SETUP, so a third seat can be added later.
import { makeDeck, shuffle, cardName } from '../../../shared/deck.js';
import { SETUP, NAMES, WIN_AT, order, value, countHand, heels, playable, pegPoints, pegLabel, sayCount, gamesWon, cardWord } from './rules.js';
import * as bots from './bots.js';
import * as hard from './bots-hard.js';

// options:
//   timer          from shared/timing.js; spaces out computer moves
//   levelAtStart   () => 'easy' | 'medium' | 'hard', fixed for the whole game
//   mugginsAtStart () => true | false: Computer takes points you miss (Hard only); you always count
//   youCount       () => true if you count your own hand and crib (checked each time; false = automatic)
//   remind         () => true to say how many points you missed (once) before scoring, so you can keep looking
//   animate        () => true to show the count one combination at a time
//   difficultyFor  (seat) => level, to give seats different levels (simulator only)
//   human          false: the computer plays your seat too (simulator)
//   onChange       called whenever something on screen should update
//   onEvent        called with a short note for every move (used by the simulator)
export function createCribbage({ timer, levelAtStart = () => 'medium', mugginsAtStart = () => false, youCount = () => false, remind = () => false, animate = () => true,
  difficultyFor = null, human = true, players = 2, onChange = () => {}, onEvent = () => {} }) {
  const n = players, SET = SETUP[n];
  const S = { n, score: Array(n).fill(0), pegs: Array.from({ length: n }, () => [0, 0]), tally: Array(n).fill(0), level: 'medium', phase: 'none', countToken: 0 };
  const levelFor = p => difficultyFor ? difficultyFor(p) : S.level;
  const isBot = p => !human || p !== 0;
  const later = (fn, ms) => timer.later(fn, ms);
  const changed = () => onChange(S);
  const next = p => (p + 1) % n;
  const who = p => NAMES[p];
  const verb = (p, a, b) => p === 0 ? a : b;
  const msg = t => { S.msg = t; };
  const brain = p => levelFor(p) === 'hard' ? hard : bots;

  // Your hand, low to high (Ace low), then by suit.
  const sortHand = h => h.sort((a, b) => order(a) - order(b) || 'SHCD'.indexOf(a.s) - 'SHCD'.indexOf(b.s));

  // Add points; leapfrog the pegs. Returns true if that ends the game.
  function addScore(p, pts, label) {
    if (S.phase === 'gameOver' || pts <= 0) return S.phase === 'gameOver';
    onEvent(`score:${p}:${pts}`);
    S.score[p] = Math.min(WIN_AT, S.score[p] + pts);
    S.pegs[p] = [S.pegs[p][1], S.score[p]];
    if (label) S.pts = { ...S.pts, [p]: label };
    if (S.score[p] >= WIN_AT) { endGame(p); return true; }
    return false;
  }

  function endGame(w) {
    timer.cancelAll();
    S.countToken++;
    const loser = S.score.map((s, p) => p).filter(p => p !== w).reduce((a, b) => S.score[a] <= S.score[b] ? a : b);
    const games = gamesWon(S.score[loser]);
    S.tally[w] += games;
    S.phase = 'gameOver'; S.turn = null; S.winner = w;
    S.result = { winner: w, loserScore: S.score[loser], games };
    msg(w === 0 ? 'You reach 121!' : 'Computer reaches 121.');
    changed();
    // Let the last peg move finish before the game-over sheet.
    later(() => { S.overlay = { title: w === 0 ? 'You win' : 'Computer wins', btn: 'Play again' }; changed(); }, 1500);
  }

  function newGame() {
    timer.cancelAll();
    Object.assign(S, { score: Array(n).fill(0), pegs: Array.from({ length: n }, () => [0, 0]), overlay: null, result: null, winner: null,
      level: levelAtStart(), muggins: human && mugginsAtStart(), phase: 'cut', cut: null, hands: Array.from({ length: n }, () => []),
      crib: [], starter: null, peg: null, count: null, claim: null, said: {}, pts: {}, sel: [], turn: null, discarded: [] });
    S.countToken++;
    msg('Cut the deck for the first deal. Low card deals.');
    changed();
    if (!human) later(cutForDeal, 300);
  }

  // Each player cuts; the lowest card deals first (cut again on a tie).
  function cutForDeal() {
    if (S.phase !== 'cut' || S.cut) return;
    const deck = shuffle(makeDeck());
    let cut;
    do { cut = Array.from({ length: n }, () => deck.splice(Math.floor(Math.random() * deck.length), 1)[0]); }
    while (new Set(cut.map(order)).size < n);
    S.cut = cut;
    S.dealer = cut.reduce((lo, c, p) => order(c) < order(cut[lo]) ? p : lo, 0);
    onEvent('cut:' + cut.map(c => c.id).join(','));
    msg(`${S.dealer === 0 ? 'You cut' : 'Computer cuts'} the lower card, so ${S.dealer === 0 ? 'you deal' : 'Computer deals'} first.`);
    changed();
    later(newHand, 1800);
  }

  function newHand() {
    const deck = shuffle(makeDeck());
    S.hands = Array.from({ length: n }, () => []);
    for (let i = 0; i < SET.hand; i++) for (let k = 1; k <= n; k++) S.hands[(S.dealer + k) % n].push(deck.pop());
    Object.assign(S, { phase: 'discard', deck, crib: [], starter: null, kept: null, cut: null, count: null, claim: null, said: {}, pts: {},
      sel: [], turn: null, handLog: [], ready: Array(n).fill(false), discarded: Array.from({ length: n }, () => []), justDealt: true,
      peg: { count: 0, seq: [], played: [], round: 0, go: [], last: null } });
    sortHand(S.hands[0]);
    msg(`Choose ${SET.toCrib} cards for ${S.dealer === 0 ? 'your' : 'Computer’s'} crib.`);
    changed();
    later(() => {
      for (let p = 0; p < n; p++) if (isBot(p)) toCrib(p, brain(p).discard(S, p, levelFor(p)));
    }, 900);
  }

  function toCrib(p, cards) {
    if (S.phase !== 'discard' || S.ready[p]) return;
    onEvent(`crib:${p}:${cards.map(c => c.id).join(',')}`);
    const ids = new Set(cards.map(c => c.id));
    S.hands[p] = S.hands[p].filter(c => !ids.has(c.id));
    S.discarded[p] = cards;
    S.crib.push(...cards);
    S.ready[p] = true;
    if (p === 0) S.sel = [];
    if (!S.ready.every(Boolean)) { changed(); return; }
    for (let i = 0; i < SET.deckToCrib; i++) S.crib.push(S.deck.pop());
    S.phase = 'starter';
    const cutter = next(S.dealer);
    msg(isBot(cutter) ? 'Computer cuts the deck for the starter.' : 'Cut the deck for the starter card.');
    changed();
    if (isBot(cutter)) later(turnStarter, 1000);
  }

  // The player after the dealer cuts; the starter is turned up. A Jack: his heels.
  function turnStarter() {
    if (S.phase !== 'starter') return;
    S.starter = S.deck.splice(Math.floor(Math.random() * S.deck.length), 1)[0];
    S.kept = S.hands.map(h => [...h]);
    onEvent('starter:' + S.starter.id);
    msg(`The starter is the ${cardName(S.starter)}.`);
    S.phase = 'peg';
    if (heels(S.starter)) {
      msg(`A Jack! ${S.dealer === 0 ? 'You peg' : 'Computer pegs'} 2 for his heels.`);
      if (addScore(S.dealer, heels(S.starter), 'His heels for 2')) return;
    }
    changed();
    later(() => { S.pts = {}; S.turn = next(S.dealer); pegStep(); }, 1500);
  }

  // ---------- pegging ----------
  const legal = p => S.peg ? playable(S.hands[p] || [], S.peg.count) : [];

  function pegStep() {
    const p = S.turn;
    if (!isBot(p)) {
      msg(legal(0).length ? (S.peg.count ? 'Your turn. Tap a card to play.' : 'Your lead. Tap a card to play.') : 'You can’t play without going over 31. Say Go.');
      changed();
      return;
    }
    changed();
    later(() => {
      if (S.phase !== 'peg' || S.turn !== p) return;
      const L = legal(p);
      if (!L.length) return sayGo(p);
      playCard(p, brain(p).peg(S, p, levelFor(p), L));
    }, 850);
  }

  function playCard(p, card) {
    onEvent(`play:${p}:${card.id}`);
    const P = S.peg;
    S.hands[p] = S.hands[p].filter(c => c.id !== card.id);
    P.seq.push(card); P.count += value(card); P.last = p;
    P.played.push({ p, card, round: P.round });
    S.lastPlayed = card.id; S.said = {}; S.pts = {};
    msg(`${who(p)} ${verb(p, 'play', 'plays')} ${cardWord(card)}. Count ${P.count}.`);
    const got = pegPoints(P.seq);
    // The cards that made the score light up: a pair or run's cards, or just this card for 15 / 31.
    let lit = 1;
    for (const part of got.parts) {
      const m = /Run of (\d)/.exec(part.name);
      if (m) lit = Math.max(lit, +m[1]);
      else if (part.pts >= 2 && !/^(Fifteen|31)$/.test(part.name)) lit = Math.max(lit, { 2: 2, 6: 3, 12: 4 }[part.pts]);
    }
    P.hl = got.pts ? P.seq.slice(-lit).map(c => c.id) : [];
    if (got.pts) {
      msg(`${who(p)}: ${pegLabel(got).replace(/^./, ch => ch.toLowerCase()).replace(/^(\d)/, '$1')}.`);
      if (addScore(p, got.pts, pegLabel(got))) return;
    }
    S.turn = null;
    changed();
    if (P.count === 31) return later(() => resetRound(p), 1300);
    later(() => nextPegTurn(p), 250);
  }

  function sayGo(p) {
    onEvent(`go:${p}`);
    S.peg.go.push(p);
    S.said = { ...S.said, [p]: 'Go' }; S.pts = {};
    msg(`${who(p)} ${verb(p, 'say', 'says')} go.`);
    S.turn = null;
    changed();
    later(() => nextPegTurn(p), p === 0 ? 300 : 700);
  }

  // Whose turn next: the next player who still has cards and hasn't said go
  // (which can be the same player). If nobody can go on, the round ends.
  function nextPegTurn(after) {
    if (S.phase !== 'peg') return;
    if (S.hands.every(h => !h.length)) return endRound(true);
    for (let k = 1; k <= n; k++) {
      const q = (after + k) % n;
      if (S.hands[q].length && !S.peg.go.includes(q)) { S.turn = q; return pegStep(); }
    }
    endRound(false);
  }

  // Nobody can play: the last player to play gets 1 (for the go, or the last
  // card), unless they just hit 31.
  function endRound(allOut) {
    const P = S.peg, last = P.last;
    S.turn = null;
    if (P.count > 0 && P.count < 31 && last != null) {
      const label = allOut ? 'Last card for 1' : 'Go for 1';
      msg(`${who(last)}: ${label.toLowerCase()}.`);
      if (addScore(last, 1, label)) return;
    }
    changed();
    later(() => allOut ? finishPegging() : resetRound(last), 1300);
  }

  function resetRound(last) {
    if (S.phase !== 'peg') return;
    Object.assign(S.peg, { count: 0, seq: [], go: [], round: S.peg.round + 1 });
    S.said = {}; S.pts = {};
    if (S.hands.every(h => !h.length)) return finishPegging();
    msg('The count goes back to 0.');
    nextPegTurn(last);
  }

  // ---------- counting ----------
  function finishPegging() {
    S.phase = 'count'; S.turn = null; S.said = {}; S.pts = {};
    S.stages = [];
    for (let k = 1; k <= n; k++) { const p = (S.dealer + k) % n; S.stages.push({ owner: p, crib: false }); }
    S.stages.push({ owner: S.dealer, crib: true });
    S.stage = 0;
    msg('Pegging is over. Now the hands are counted.');
    changed();
    later(runStage, 1100);
  }

  const stageLabel = st => st.crib ? (st.owner === 0 ? 'Your crib' : 'Computer’s crib') : (st.owner === 0 ? 'Your hand' : 'Computer’s hand');

  function runStage() {
    if (S.phase !== 'count') return;
    const st = S.stages[S.stage];
    if (!st) return endHand();
    const cards = st.crib ? S.crib : S.kept[st.owner];
    const bd = countHand(cards, S.starter, st.crib);
    S.said = {}; S.pts = {};
    S.count = { label: stageLabel(st), owner: st.owner, crib: st.crib, cards: [...cards], hl: [], say: '', items: bd.items, total: bd.total, done: false };
    if (st.owner === 0 && human && (S.muggins || youCount())) {
      S.phase = 'claim';
      S.claim = { sel: [], claims: [] };
      msg(`Count ${st.crib ? 'your crib' : 'your hand'}: tap cards that score together, then what they make.`);
      changed();
      return;
    }
    msg(`Counting ${S.count.label.replace('Your', 'your')}.`);
    showCount(bd.items, () => scoreStage(st.owner, bd.total));
  }

  // Show the count: one combination at a time (about 1.2 s each, following game
  // speed), or the total at once. Tapping skips to the total (see skip()).
  let finishCount = null;
  function showCount(items, done, force = false) {
    const token = ++S.countToken;
    const C = S.count;
    const finish = () => {
      if (token !== S.countToken || C.done) return;
      finishCount = null;
      C.hl = []; C.done = true; C.say = sayCount(items) + (items.length ? ` (${C.total})` : '');
      changed();
      later(() => { if (token === S.countToken) done(); }, 1300);
    };
    finishCount = finish;
    if ((!animate() && !force) || !items.length) return finish();
    let i = 0;
    const stepCount = () => {
      if (token !== S.countToken) return;
      if (i >= items.length) return later(finish, 500);
      C.hl = items[i].ids; C.say = sayCount(items, ++i);
      changed();
      later(stepCount, 1200);
    };
    changed();
    later(stepCount, 500);
  }
  function skip() { if (finishCount) finishCount(); }

  function scoreStage(owner, pts) {
    const label = S.count.label;
    S.handLog.push({ label, pts });
    if (pts) { if (addScore(owner, pts, `${label}: ${pts}`)) return; }
    else S.pts = { [owner]: 'Nineteen' };
    msg(pts ? `${label}: ${pts}.` : `${label}: nineteen (nothing).`);
    changed();
    later(nextStage, 1300);
  }
  function nextStage() { S.stage++; S.pts = {}; runStage(); }

  // ---------- your own count ----------
  // You show every score: select the cards and name what they make (15, pair, run,
  // flush, nibs). Nothing is checked until Done. A wrong claim scores nothing;
  // anything you missed is lost, or with muggins Computer takes it ("Muggins!").
  const CLAIM_PTS = { fifteen: () => 2, pair: () => 2, run: k => k, flush: k => k, nibs: () => 1 };
  function checkClaims() {
    const C = S.count, left = [...C.items];
    let got = 0;
    for (const cl of S.claim.claims) {
      const key = [...cl.ids].sort().join();
      const i = left.findIndex(it => it.kind === cl.kind && [...it.ids].sort().join() === key);
      cl.ok = i >= 0;
      if (cl.ok) { got += left[i].pts; left.splice(i, 1); }
    }
    return got;
  }
  function doneClaim() {
    if (S.phase !== 'claim') return;
    const C = S.count, real = C.total;
    const mine = checkClaims(), missed = real - mine;
    const pl = k => `${k} point${k > 1 ? 's' : ''}`;
    if (missed && !S.muggins && remind() && !S.claim.warned) {   // one reminder, then Done scores what you have
      S.claim.warned = true;
      msg(`You missed ${pl(missed)}. Keep looking, or tap Done to score ${mine}.`);
      changed();
      return;
    }
    S.claim.result = { mine, missed };
    onEvent(`claim:${mine}:${missed}`);
    S.phase = 'count';
    if (!missed) {
      C.done = true; C.hl = []; C.say = `${sayCount(C.items)} Right!`;
      msg(`You count ${real}. Correct.`);
      changed();
      return later(() => scoreStage(0, real), 1300);
    }
    if (!S.muggins) {                       // no muggins: points you miss are simply lost
      msg(`You counted ${mine}. Here’s the full count: ${real}.`);
      S.handLog.push({ label: C.label, pts: mine, note: `Missed ${missed}` });
      return showCount(C.items, () => {
        if (mine && addScore(0, mine, `${C.label}: ${mine}`)) return;
        msg(`You missed ${pl(missed)}. You score ${mine}.`);
        changed();
        later(nextStage, 1800);
      }, true);
    }
    S.said = { 1: 'Muggins!' };
    msg(`Muggins! You claimed ${mine}. Computer shows you the full count.`);
    S.handLog.push({ label: C.label, pts: mine, note: `Computer took ${missed} (muggins)` });
    showCount(C.items, () => {
      if (mine && addScore(0, mine, `${C.label}: ${mine}`)) return;
      if (addScore(1, missed, `Muggins! +${missed}`)) return;
      msg(`Muggins! Computer takes the ${pl(missed)} you missed.`);
      changed();
      later(nextStage, 1800);
    }, true);
  }

  function endHand() {
    S.phase = 'handEnd'; S.count = null; S.turn = null; S.said = {}; S.pts = {};
    msg('Hand over. Next deal goes to ' + (next(S.dealer) === 0 ? 'you.' : 'Computer.'));
    changed();
  }
  // After a hand, or after game over.
  function nextHand() {
    if (S.phase === 'gameOver') return newGame();
    if (S.phase !== 'handEnd') return;
    S.dealer = next(S.dealer);
    newHand();
  }

  // ---------- your moves (each is ignored if it isn't allowed right now) ----------
  const you = {
    cut() {
      if (S.phase === 'cut' && !S.cut) cutForDeal();
      else if (S.phase === 'starter' && next(S.dealer) === 0) turnStarter();
    },
    pick(id) {          // choosing cards for the crib
      if (S.phase !== 'discard' || S.ready[0]) return;
      if (S.sel.includes(id)) S.sel = S.sel.filter(x => x !== id);
      else S.sel = [...S.sel, id].slice(-SET.toCrib);
      changed();
    },
    crib() {
      if (S.phase !== 'discard' || S.ready[0] || S.sel.length !== SET.toCrib) return;
      toCrib(0, S.hands[0].filter(c => S.sel.includes(c.id)));
    },
    play(id) {
      if (S.phase !== 'peg' || S.turn !== 0) return;
      const c = legal(0).find(x => x.id === id);
      if (c) playCard(0, c);
    },
    go() { if (S.phase === 'peg' && S.turn === 0 && !legal(0).length) sayGo(0); },
    // counting your own hand
    select(id) {
      if (S.phase !== 'claim') return;
      const sel = S.claim.sel;
      S.claim.sel = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id];
      changed();
    },
    claim(kind) {
      if (S.phase !== 'claim' || !S.claim.sel.length || !CLAIM_PTS[kind]) return;
      S.claim.claims.push({ kind, ids: [...S.claim.sel], pts: CLAIM_PTS[kind](S.claim.sel.length) });
      S.claim.sel = [];
      changed();
    },
    unclaim(i) { if (S.phase === 'claim') { S.claim.claims.splice(i, 1); changed(); } },
    done: doneClaim
  };

  // The computer moving for a seat (the simulator uses this for seat 0 too).
  function botMove(p) {
    if (S.phase === 'discard' && !S.ready[p]) return toCrib(p, brain(p).discard(S, p, levelFor(p)));
    if (S.phase === 'peg' && S.turn === p) { const L = legal(p); return L.length ? playCard(p, brain(p).peg(S, p, levelFor(p), L)) : sayGo(p); }
  }

  return { state: S, newGame, next: nextHand, skip, you, legal, botMove };
}
