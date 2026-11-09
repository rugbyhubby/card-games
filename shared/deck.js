// Decks: building and shuffling.
// A card is a small object: { s: suit, r: rank, id: rank + suit }, e.g. { s:'H', r:'10', id:'10H' }.

export const SUITS = ['S', 'H', 'C', 'D'];
export const SYM = { S: '♠', H: '♥', C: '♣', D: '♦' };
export const SUIT_NAME = { S: 'Spades', H: 'Hearts', C: 'Clubs', D: 'Diamonds' };
export const isRed = s => s === 'H' || s === 'D';

// Ranks low to high. Games that rank Ace low (e.g. Cribbage) handle that in their own rules.
export const STANDARD_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Build a deck, suit by suit. With no arguments: the standard 52 cards.
// Custom decks pass their own ranks, e.g. Euchre: makeDeck(['9','10','J','Q','K','A']).
export function makeDeck(ranks = STANDARD_RANKS, suits = SUITS) {
  const deck = [];
  for (const s of suits) for (const r of ranks) deck.push({ s, r, id: r + s });
  return deck;
}

// Shuffle in place (Fisher–Yates) and return the same array.
// `random` can be swapped for a repeatable one in tests.
export function shuffle(cards, random = Math.random) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

const RANK_NAME = { A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack' };
export const rankName = r => RANK_NAME[r] || r;
export const cardName = c => rankName(c.r) + ' of ' + SUIT_NAME[c.s];
