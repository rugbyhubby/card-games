// The lessons. Each one is a set deal plus a few steps Dot walks you through,
// ending with you playing the hand out while she watches.
//
// Step kinds:
//   say    Dot says something; you tap Next.        { say, pose, show? }
//   bid    the bidding plays out (deal.bids sets what each computer seat says).
//   discard  you're the dealer: pick up the turned-up card and throw one away.
// A deal can also set what the computer players bid (bids: { bid1: { seat: {...} }, bid2: ... })
// and the first cards they play (plays: { seat: [card ids, in order] }); anything not set
// is up to the computer. `cue(S)` lets Dot say something when your turn comes up.
//   quiz   you tap a card in your hand to answer.   { say, pose, answer(S) -> card id, right, wrong }
//   play   play the hand out, with coaching on.     { say, pose }
// `show` turns on extras for that step: 'trump' (trump cards glow), 'ladder' (the Jacks jump).
//
// Lessons can grow into levels later: `n` is just the order in the list.
import { highestTrump } from './coach.js';
import { trickWinner } from '../rules.js';

const c = id => ({ r: id.slice(0, -1), s: id.slice(-1), id: id.slice(0, -1) + id.slice(-1) });
const hand = s => s.split(' ').map(c);

export const LESSONS = [
  {
    n: 1, title: 'The bowers', sub: 'Why two Jacks run the show', ready: true,
    faceUp: true,                                   // every hand face up, just this once
    // A real first deal: you deal, the 9♥ is turned up, West passes, Dot tells you to pick it up.
    deal: {
      dealer: 0, hold: true, upcard: c('9H'),
      hands: [hand('JD AH 10H KC 9S'), hand('KH QD AS QC 9D'), hand('JH QH AC KS 10D'), hand('AD KD 10C JS QS')],
      bids: { bid1: { 1: { order: false }, 2: { order: true } } }
    },
    steps: [
      { kind: 'say', pose: 'sip', say: 'Look at everyone’s cards. Just this once.',
        note: 'You dealt. The 9♥ is turned up. If anyone tells you to pick it up, hearts become trump.' },
      { kind: 'bid', pose: 'lean', say: 'Watch. I’m about to tell you to pick it up.' },
      { kind: 'discard', pose: 'lean', say: 'Now throw one away. Not a heart.',
        note: 'You’re the dealer, so the 9♥ joins your hand. You keep five: tap one card to throw away.' },
      { kind: 'say', pose: 'lean', show: 'ladder', msg: 'Hearts are trump.', say: 'Jacks are the bosses. Both of them. Don’t ask, just watch.',
        note: 'Top trump: the J♥ (right bower). Next: the other red Jack, the J♦ (left bower). It counts as a heart now.' },
      { kind: 'quiz', pose: 'lean', msg: 'Hearts are trump.', say: 'Your turn. Tap your highest trump.',
        answer: S => highestTrump(S.hands[0], S.trump).id,
        right: 'There you go. The left bower beats your ace.', wrong: 'Not that one. Jacks, remember?' },
      { kind: 'play', pose: 'sip', say: 'Now play it out. I’ll be watching.' }
    ]
  },
  {
    n: 2, title: 'Follow suit', sub: 'What you’re allowed to play', ready: true,
    deal: {
      dealer: 0, trump: 'C', maker: 2, hold: true, upcard: c('9H'),
      hands: [hand('QS 9S KD 10H 9C'), hand('AS KH 9D 10D QC'), hand('JC AC KC AH 10S'), hand('KS JS QH AD JH')]
    },
    steps: [
      { kind: 'say', pose: 'lean', say: 'Follow the suit that’s led. Can’t? Then play anything.',
        note: 'If you have a card of the suit that was led, you must play one. If you don’t, you can play any card, including trump. Cards you can’t play are dimmed.' },
      { kind: 'play', pose: 'sip', say: 'Clubs are trump. Go on. I’m watching.' }
    ]
  },
  {
    n: 3, title: 'Partner’s tricks', sub: 'Don’t trump your partner’s ace', ready: true,
    // Spades are trump. West leads a heart, Dot plays the ace, East follows, and you have
    // no hearts: trump her ace (a putz play) or throw a small diamond (right).
    deal: {
      dealer: 0, trump: 'S', maker: 2, hold: true, upcard: c('JD'),
      hands: [hand('10S 9S KD QD 9D'), hand('9H QH KS QS 9C'), hand('AH AC JS AS 10D'), hand('10H KH 10C QC AD')],
      plays: { 1: ['9H'], 2: ['AH'], 3: ['10H'] }
    },
    cue: S => S.history.length === 3 && trickWinner(S.trick, S.trump).p === 2 ? { pose: 'lean', say: 'My ace is winning. Your move.' } : null,
    // The key moment: only your smallest card is right here.
    expect: S => S.history.length === 3 ? { ids: ['9D'], say: 'Not that one. Throw your smallest card.', why: 'My ace already has this trick. Throw your lowest card and keep the K♦ and Q♦ for later.' } : null,
    steps: [
      { kind: 'say', pose: 'lean', say: 'When I’m winning a trick, leave it alone.',
        note: 'If your partner is already winning, don’t trump it or play over it. Throw your lowest card instead.' },
      { kind: 'play', pose: 'sip', say: 'Spades are trump. Show me.' }
    ]
  },
  {
    n: 4, title: 'Calling trump', sub: 'When to order it up, when to pass', ready: true,
    // East deals and turns up the Q♥. You bid first, holding both red Jacks and the A♥.
    deal: {
      dealer: 3, upcard: c('QH'), hold: true,
      hands: [hand('JH JD AH KC 9S'), hand('10H KD 10D AC 9C'), hand('KH AD 9D QC KS'), hand('9H QD JC 10C AS')],
      bids: { bid1: { 1: { order: false }, 2: { order: false }, 3: { order: false } }, bid2: { 1: { suit: null }, 2: { suit: 'D' }, 3: { suit: null } } }
    },
    steps: [
      { kind: 'say', pose: 'lean', say: 'Count your trumps. Both red Jacks count.',
        note: 'The Q♥ is turned up. Count your hearts, plus the J♦ (the left bower). Three or more? Order it up. One or none? Pass.' },
      { kind: 'play', pose: 'sip', say: 'Your call.' }
    ]
  },
  { n: 5, title: 'Going alone', sub: 'Dot sits out. She’ll be watching.', ready: false },
  { n: 6, title: 'Defense', sub: 'How to euchre the other team', ready: false }
];

// Hand-checked: each deal uses 21 different cards from the 24-card deck.
export function checkDeals() {
  const bad = [];
  for (const L of LESSONS) {
    if (!L.deal) continue;
    const ids = [...L.deal.hands.flat().map(x => x.id), L.deal.upcard.id];
    if (new Set(ids).size !== 21 || L.deal.hands.some(h => h.length !== 5)) bad.push(L.n);
  }
  return bad;
}
