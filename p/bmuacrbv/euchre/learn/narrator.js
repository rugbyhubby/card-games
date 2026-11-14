// The lessons' running commentary, for someone who has never played: what just
// happened, the rule that applies, and whose turn it is (and that Next shows it).
// Pure: narrate(S) looks at the table and returns one message, or null when the
// game's own message is fine (bidding, the start of play). Checked in
// tools/euchre-coach-check.js.
import { effSuit, trickWinner } from '../rules.js';
import { SUIT_NAME, cardName } from '../../../../shared/deck.js';

const NAME = ['You', 'West', 'Dot', 'East'];
const one = s => SUIT_NAME[s].toLowerCase().replace(/s$/, '');      // "spade"
const many = s => SUIT_NAME[s].toLowerCase();                        // "spades"
const a = w => (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w;
const their = p => (p === 2 ? 'her' : 'their');

export function narrate(S) {
  if (S.phase !== 'play') return null;
  const t = S.trump, tr = S.trick;

  if (S.collecting != null) return `The cards go to ${S.collecting === 0 ? 'you' : NAME[S.collecting]}.`;

  // The trick is complete: who won it, and why.
  if (tr.length && S.turn == null && S.winner != null) {
    const w = trickWinner(tr, t), led = effSuit(tr[0].card, t);
    const trumps = tr.filter(e => effSuit(e.card, t) === t).length;
    let why;
    if (w.card.r === 'J' && effSuit(w.card, t) === t) why = w.card.s === t ? 'the right bower, the highest trump' : 'the left bower, the second-highest trump';
    else if (effSuit(w.card, t) === t && led !== t) why = trumps === 1 ? 'the only trump played' : 'the highest trump played';
    else why = `the highest ${led === t ? 'trump' : one(led)} played`;
    const who = w.p === 0 ? 'You win' : `${NAME[w.p]} wins`;
    const last = tr[tr.length - 1];
    return `${NAME[last.p]} played the ${cardName(last.card)}. ${who} the trick with the ${cardName(w.card)} (${why}). Tap Next to give ${w.p === 0 ? 'yourself' : NAME[w.p]} the cards.`;
  }

  // What just happened.
  let s;
  const last = tr[tr.length - 1];
  if (last) {
    s = `${NAME[last.p]} ${tr.length === 1 ? 'led' : 'played'} the ${cardName(last.card)}.`;
    if (tr.length === 1) {
      const led = effSuit(last.card, t);
      if (led === t) {
        s += ' That’s trump, so everyone must play a trump if they have one.';
        if (last.card.r === 'J' && last.card.s !== t) s += ` (The ${cardName(last.card)} is the left bower, so it counts as trump.)`;
      } else s += ` ${SUIT_NAME[led]} were led, so everyone must play ${a(one(led))} if they have one.`;
    } else {
      const w = trickWinner(tr, t).p;
      s += w === 0 ? ' You’re winning so far.' : ` ${NAME[w]} is winning so far.`;
    }
  } else if (S.history.length) {
    const p = S.turn;
    s = p === 0 ? 'You won that trick, so you lead next.' : `${NAME[p]} won that trick, so ${p === 2 ? 'she' : NAME[p]} leads next.`;
  } else {
    const p = S.turn;
    s = p === 0 ? 'You sit to the dealer’s left, so you lead first.' : `${NAME[p]} sits to the dealer’s left, so ${NAME[p]} leads first.`;
  }

  // Whose turn now.
  if (S.turn === 0) s += ' ' + yourTurn(S);
  else if (S.turn != null) s += ` It’s ${NAME[S.turn]}’s turn. Tap Next to see ${their(S.turn)} card.`;
  return s;
}

// What you're allowed to play, in words.
function yourTurn(S) {
  const t = S.trump, tr = S.trick, hand = S.hands[0];
  if (!tr.length) return 'Your lead: play any card.';
  const led = effSuit(tr[0].card, t);
  const have = hand.filter(c => effSuit(c, t) === led);
  const leftBower = hand.find(c => c.r === 'J' && c.s !== t && effSuit(c, t) === t);
  if (have.length) {
    const what = led === t ? 'a trump' : a(one(led));
    let s = `Your turn. You have ${what}, so you must play ${have.length > 1 ? 'one' : 'it'}.`;
    if (led === t && leftBower) s += ` (Your ${cardName(leftBower)} counts as trump.)`;
    return s;
  }
  let s = `Your turn. You have no ${led === t ? 'trump' : many(led)}, so you can play any card${led === t ? '' : ', even a trump'}.`;
  if (led !== t && leftBower && leftBower.s === led) s += ` (Your ${cardName(leftBower)} counts as trump, not as ${a(one(led))}.)`;
  return s;
}
