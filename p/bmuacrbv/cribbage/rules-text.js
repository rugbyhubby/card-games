// What each computer level means, in plain words (shown in the Menu and the rules).
export const LEVEL_ABOUT = {
  easy: 'Relaxed. The computer keeps simple pairs and 15s and plays the first card it can. Good for learning.',
  medium: 'Friendly. It keeps the hand most likely to score and pegs sensibly.',
  hard: 'Tough. It plays the crib too, remembers every card and sets traps when pegging. Muggins is on unless you turn it off.'
};

// The "How to play" sheet.
export const rulesHTML = `
    <h2 id="rules-h">How to play</h2>
    <h3>Setup</h3>
    <p>You against the computer, with a regular 52-card deck. Ace is low. To start, each player cuts the deck: the lower card deals first. After that the deal takes turns.</p>
    <h3>How a hand works</h3>
    <ul>
      <li><b>The crib.</b> Each player gets 6 cards and puts 2 face down in the crib. The crib belongs to the dealer and is counted at the end of the hand.</li>
      <li><b>The starter.</b> The other player cuts the deck and a card is turned up. It counts as part of every hand and the crib. If it’s a Jack, the dealer pegs 2 (<b>his heels</b>).</li>
      <li><b>Pegging.</b> Players take turns playing one card at a time, adding to a running count that can’t go over 31. If you can’t play, say <b>Go</b>. When nobody can play, the count goes back to 0.</li>
      <li><b>Counting.</b> The player who didn’t deal counts their hand first, then the dealer counts their hand, then the dealer’s crib.</li>
    </ul>
    <h3>Scoring while pegging</h3>
    <ul>
      <li>Making the count <b>15</b> or <b>31</b>: 2.</li>
      <li>A <b>pair</b> (same rank as the card just played): 2. Three of a kind: 6. Four of a kind: 12.</li>
      <li>A <b>run</b> of 3 or more in the last cards played, in any order: 1 per card.</li>
      <li><b>Go</b>: the last player able to play gets 1, unless they hit 31.</li>
      <li><b>Last card</b> of the hand: 1 (unless it made 31).</li>
    </ul>
    <h3>Scoring a hand (each with the starter)</h3>
    <ul>
      <li>Each combination adding up to <b>15</b>: 2. Face cards count 10, Ace 1.</li>
      <li>Each <b>pair</b>: 2 (so three of a kind is 6, four of a kind 12).</li>
      <li>Each <b>run</b> of 3 or more: 1 per card. Double and triple runs count every run.</li>
      <li><b>Flush</b>: all 4 cards in your hand the same suit: 4, or 5 if the starter matches. The crib only counts a 5-card flush.</li>
      <li><b>His nibs</b>: the Jack of the starter’s suit: 1.</li>
    </ul>
    <p>The best possible hand is 29. A hand worth nothing is jokingly called a “nineteen”, because 19 can’t be scored.</p>
    <h3>Winning</h3>
    <p>First to <b>121</b> wins, the moment it happens, even in the middle of pegging or counting. That’s why the counting order matters. If the loser hasn’t reached 91, it’s a <b>skunk</b> and counts as 2 games; under 61 is a <b>double skunk</b>, 3 games.</p>
    <h3>House rules in use</h3>
    <ul>
      <li><b>Muggins</b> (Hard only, on unless you turn it off in the Menu): you count your own hand and crib. Show each score: tap the cards that score together, then what they make (15, Pair, Run, Flush, Nibs), and tap Done. A claim that’s wrong scores nothing. Anything you missed, the computer calls “Muggins!” and takes. The computer always counts its own cards correctly.</li>
      <li><b>Skunks</b> count: 2 games for a skunk, 3 for a double skunk, in the tally of games won this visit.</li>
    </ul>
    <h3>Computer levels</h3>
    <p>Choose in the Menu. Changing the level or muggins during a game starts a new game (you’re asked first).</p>
    <ul>
      <li><b>Easy</b>: ${LEVEL_ABOUT.easy}</li>
      <li><b>Medium</b>: ${LEVEL_ABOUT.medium}</li>
      <li><b>Hard</b>: ${LEVEL_ABOUT.hard}</li>
    </ul>
    <div class="done"><button class="btn pri" data-close>Got it</button></div>
`;
