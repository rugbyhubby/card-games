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
import { effSuit, legalCards, trickWinner, sister } from '../rules.js';

const PARTNER = 2;
const RANK_WORD = { A: 'ace', K: 'king', Q: 'queen', J: 'jack', '10': 'ten', '9': 'nine' };

const RULES = [
  // Putz: Dot is already winning the trick, you're the last to play, and you trump it
  // anyway when you had something else you could play.
  {
    from: 1,
    test(S, card) {
      const t = S.trump, trick = S.trick;
      const last = (S.sitter == null ? 4 : 3) - 1;              // you play last in this trick
      if (!t || trick.length !== last) return null;
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
