// Grandma Dot's judgement: is the card you're about to play a putz play, a good
// play, or nothing special? Pure logic, no drawing, so it can be tested on its own
// (tools/euchre-coach-check.js).
//
// grade(S, card) looks at the table *before* your card is played and returns
//   { kind: 'putz', mark, why }   a napkin mark ("mark" is what she writes on it)
//   { kind: 'good', why }          worth a slow clap
//   null                           nothing to say
//
// More rules get added lesson by lesson. Each rule says which lesson it starts in,
// so early lessons aren't judged on things they haven't taught yet.
import { effSuit, legalCards, trickWinner, sister, power, RV } from '../rules.js';
import { SYM, SUIT_NAME } from '../../../../shared/deck.js';

const PARTNER = 2;
const RANK_WORD = { A: 'ace', K: 'king', Q: 'queen', J: 'jack', '10': 'ten', '9': 'nine' };

// How many cards are already in the trick when you're the last to play.
const lastToPlay = S => (S.sitter == null ? 4 : 3) - 1;

const RULES = [
  // Putz: Dot is already winning the trick, you're the last to play, and you trump it
  // anyway when you had something else you could play.
  {
    from: 1,
    test(S, card) {
      const t = S.trump, trick = S.trick;
      if (!t || trick.length !== lastToPlay(S)) return null;
      const w = trickWinner(trick, t);
      if (w.p !== PARTNER) return null;
      if (effSuit(card, t) !== t || effSuit(trick[0].card, t) === t) return null;
      const others = legalCards(S.hands[0], trick, t).filter(c => effSuit(c, t) !== t);
      if (!others.length) return null;
      const hers = RANK_WORD[w.card.r] || 'card';
      return {
        kind: 'putz',
        mark: `Trumped my ${hers}`,
        say: `You trumped my ${hers}. I’ve disowned grandkids for less.`,
        why: `My ${hers} was already winning. Now we’ve wasted your trump.`
      };
    }
  },
  // Putz (from Lesson 3): Dot is already winning, you're last, and you play a card that
  // beats hers when you had a smaller one that wouldn't. A good card wasted.
  {
    from: 3,
    test(S, card) {
      const t = S.trump, trick = S.trick;
      if (!t || trick.length !== lastToPlay(S)) return null;
      const w = trickWinner(trick, t);
      if (w.p !== PARTNER) return null;
      const led = effSuit(trick[0].card, t);
      if (power(card, t, led) <= w.pw) return null;
      const smaller = legalCards(S.hands[0], trick, t).some(c => c.id !== card.id && power(c, t, led) < w.pw);
      if (!smaller) return null;
      return {
        kind: 'putz',
        mark: 'Played over my winner',
        say: 'I had it won. You just threw a good card on it.',
        why: 'My card was already winning. Save your high cards for tricks we need.'
      };
    }
  },
  // Good (from Lesson 3): Dot is winning, you're last, you could have trumped, and you didn't.
  {
    from: 3,
    test(S, card) {
      const t = S.trump, trick = S.trick;
      if (!t || trick.length !== lastToPlay(S)) return null;
      const w = trickWinner(trick, t);
      if (w.p !== PARTNER || effSuit(trick[0].card, t) === t || effSuit(card, t) === t) return null;
      const couldTrump = legalCards(S.hands[0], trick, t).some(c => effSuit(c, t) === t);
      return couldTrump ? { kind: 'good', why: 'You let my winner stand and saved your trump.' } : null;
    }
  },
  // Good: leading a bower while you hold more trump. It pulls trump out of their hands.
  {
    from: 1,
    test(S, card) {
      const t = S.trump;
      if (!t || S.trick.length || card.r !== 'J' || effSuit(card, t) !== t) return null;
      const more = S.hands[0].filter(c => c.id !== card.id && effSuit(c, t) === t).length;
      if (!more) return null;
      const which = card.s === t ? 'right' : 'left';
      return { kind: 'good', why: `Leading the ${which} bower pulls their trump.` };
    }
  }
];

export function grade(S, card, lesson = 1) {
  for (const r of RULES) {
    if (lesson < r.from) continue;
    const g = r.test(S, card);
    if (g) return g;
  }
  return null;
}

// ---------- bidding (from Lesson 4) ----------
// How many trumps a hand would hold if `t` were trump (bowers count). If you're the
// dealer in round one, the turned-up card would join your hand too.
export function trumpCount(S, t, withUpcard = false) {
  const n = S.hands[0].filter(c => effSuit(c, t) === t).length;
  return n + (withUpcard && effSuit(S.upcard, t) === t ? 1 : 0);
}
// gradeBid(S, bid, lesson): bid is { order: true|false } in round one, { suit } (or
// { suit: null } to pass) in round two. Same answers as grade().
export function gradeBid(S, bid, lesson = 1) {
  if (lesson < 4) return null;
  if (S.phase === 'bid1') {
    const t = S.upcard.s, n = trumpCount(S, t, S.dealer === 0);
    if (!bid.order && n >= 3) return passedWith(n);
    if (bid.order && n >= 3) return { kind: 'good', why: `${n} trumps: that’s a call.` };
    if (bid.order && n <= 1) return orderedThin(n);
    return null;
  }
  if (S.phase === 'bid2') {
    const options = ['S', 'H', 'C', 'D'].filter(s => s !== S.turnedDown);
    const best = Math.max(...options.map(s => trumpCount(S, s)));
    if (!bid.suit && best >= 3) return passedWith(best);
    if (bid.suit && trumpCount(S, bid.suit) >= 3) return { kind: 'good', why: `${trumpCount(S, bid.suit)} trumps: that’s a call.` };
    if (bid.suit && trumpCount(S, bid.suit) <= 1) return orderedThin(trumpCount(S, bid.suit));
  }
  return null;
}
const passedWith = n => ({
  kind: 'putz', mark: `Passed with ${n} trump`,
  say: `${n === 3 ? 'Three' : n === 4 ? 'Four' : 'Five'} trumps and you pass? Who raised you?`,
  why: 'Three trumps (bowers count) is a call. Order it up.'
});
const orderedThin = n => ({
  kind: 'putz', mark: n ? 'Called with one trump' : 'Called with no trump',
  say: 'One trump isn’t a hand. It’s a wish.',
  why: 'With one trump, they’ll likely euchre us. Pass, and let me help.'
});

// ---------- the dealer's discard ----------
const short = c => c.r + SYM[c.s];
// The best card to throw away: never trump, and not an ace. Best of all, a card that's
// alone in its suit (then you're out of that suit and can trump it later); lowest first.
export function bestDiscard(hand, t) {
  const plain = hand.filter(c => effSuit(c, t) !== t);
  if (!plain.length) return hand.slice().sort((a, b) => RV[a.r] - RV[b.r])[0];
  const notAce = plain.filter(c => c.r !== 'A');
  const pool = notAce.length ? notAce : plain;
  const alone = pool.filter(c => plain.filter(x => x.s === c.s).length === 1);
  return (alone.length ? alone : pool).slice().sort((a, b) => RV[a.r] - RV[b.r])[0];
}
// gradeDiscard(S, card): 'putz' (throwing away trump), 'better' (there's a better card),
// or 'good', each with what Dot says and why.
export function gradeDiscard(S, card) {
  const t = S.trump, hand = S.hands[0], best = bestDiscard(hand, t);
  if (effSuit(card, t) === t && best && effSuit(best, t) !== t) {
    const bower = card.r === 'J';
    return {
      kind: 'putz', mark: 'Threw away a trump',
      say: bower ? `Not the ${short(card)}! That’s a bower.` : `Not a ${SUIT_NAME[t].toLowerCase().slice(0, -1)}! That’s trump.`,
      why: bower
        ? `With ${SUIT_NAME[t].toLowerCase()} trump, the ${short(card)} is the ${card.s === t ? 'right' : 'left'} bower, one of our two best cards.`
        : 'Trump wins tricks. Never throw it away when you have something else.'
    };
  }
  const outOf = SUIT_NAME[best.s].toLowerCase();
  const leaves = hand.filter(c => c.s === best.s && effSuit(c, t) !== t).length === 1;
  const reason = `The ${short(best)} can’t win much${leaves ? `, and throwing it leaves you with no ${outOf}, so you can trump them` : ''}.`;
  if (card.id !== best.id) return { kind: 'better', say: `Close. Throw the ${short(best)} instead.`, why: reason };
  return { kind: 'good', say: leaves ? `Good. Now you can trump ${outOf}.` : 'Good. That one wasn’t winning anything.', why: reason };
}

// The highest trump in a hand (for "tap your highest trump"): right bower, left bower,
// then A, K, Q, 10, 9 of trump.
const ORDER = ['A', 'K', 'Q', '10', '9'];
export function highestTrump(hand, t) {
  const right = hand.find(c => c.r === 'J' && c.s === t);
  if (right) return right;
  const left = hand.find(c => c.r === 'J' && c.s === sister(t));
  if (left) return left;
  for (const r of ORDER) { const c = hand.find(x => x.r === r && x.s === t); if (c) return c; }
  return null;
}
