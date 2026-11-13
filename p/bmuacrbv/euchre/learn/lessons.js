// The lessons. Each one is a set deal plus a few steps Dot walks you through,
// ending with you playing the hand out while she watches.
//
// Step kinds:
//   say    Dot says something; you tap Next.        { say, pose, show? }
//   quiz   you tap a card in your hand to answer.   { say, pose, answer(S) -> card id, right, wrong }
//   play   play the hand out, with coaching on.     { say, pose }
// `show` turns on extras for that step: 'trump' (trump cards glow), 'ladder' (the Jacks jump).
//
// Lessons can grow into levels later: `n` is just the order in the list.
import { highestTrump } from './coach.js';

const c = id => ({ r: id.slice(0, -1), s: id.slice(-1), id: id.slice(0, -1) + id.slice(-1) });
const hand = s => s.split(' ').map(c);

export const LESSONS = [
  {
    n: 1, title: 'The bowers', sub: 'Why two Jacks run the show', ready: true,
    faceUp: true,                                   // every hand face up, just this once
    deal: {
      dealer: 0, trump: 'H', maker: 2, hold: true, upcard: c('9C'),
      hands: [hand('JD AH 10H KC 9S'), hand('KH 9H AS QC 9D'), hand('JH QH AC KS 10D'), hand('AD KD 10C JS QS')]
    },
    steps: [
      { kind: 'say', pose: 'sip', say: 'Look at everyone’s cards. Just this once.' },
      { kind: 'say', pose: 'lean', show: 'ladder', say: 'Jacks are the bosses. Both of them. Don’t ask, just watch.',
        note: 'Top trump: the J♥ (right bower). Next: the other red Jack, the J♦ (left bower). It counts as a heart now.' },
      { kind: 'quiz', pose: 'lean', say: 'Your turn. Tap your highest trump.',
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
  { n: 3, title: 'Partner’s tricks', sub: 'Don’t trump your partner’s ace', ready: false },
  { n: 4, title: 'Calling trump', sub: 'When to order it up, when to pass', ready: false },
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
