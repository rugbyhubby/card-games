// What each computer level means, in plain words (shown in the Menu and the rules).
export const LEVEL_ABOUT = {
  easy: 'Relaxed. The computer players make plenty of mistakes. Good for learning.',
  medium: 'Friendly. They play sensibly, like a casual player at the kitchen table.',
  hard: 'Tough. They remember every card played and bid boldly.'
};

// The "How to play" sheet.
export const rulesHTML = `
    <h2 id="rules-h">How to play</h2>
    <h3>Setup</h3>
    <p>Four players in two teams: you and Partner against West and East. A 24-card deck: 9, 10, Jack, Queen, King and Ace in each suit. Each player gets 5 cards and the next card is turned up. The deal moves one seat to the left each hand.</p>
    <h3>How a hand works</h3>
    <ul>
      <li><b>Bidding, round one.</b> Starting left of the dealer, each player may <b>order up</b> the turned-up card, making its suit trump, or pass. If someone orders it up, the dealer takes that card and discards one.</li>
      <li><b>Bidding, round two.</b> If all four pass, the card is turned down. Each player may now name any other suit as trump, or pass. If everyone passes again, the hand is thrown in and the next player deals.</li>
      <li><b>Going alone.</b> Whoever names trump may go alone. Their partner sits out the hand.</li>
      <li><b>Play.</b> The player left of the dealer leads. Follow the suit led if you can; otherwise play anything. The highest trump wins the trick, or the highest card of the suit led if no trump was played.</li>
    </ul>
    <h3>Trump and the bowers</h3>
    <p>Trump beats every other suit. The highest trumps are the two Jacks of trump’s color: the <b>right bower</b> (the Jack of trump), then the <b>left bower</b> (the other Jack of the same color, which counts as a trump, not its own suit). Then Ace, King, Queen, 10, 9 of trump.</p>
    <h3>Scoring</h3>
    <ul>
      <li>The team that named trump takes 3 or 4 tricks: <b>1 point</b>.</li>
      <li>It takes all 5: <b>2 points</b>.</li>
      <li>All 5 while going alone: <b>4 points</b>.</li>
      <li>It takes fewer than 3 (<b>euchred</b>): the other team gets <b>2 points</b>.</li>
    </ul>
    <h3>Winning</h3>
    <p>First team to <b>10 points</b> wins.</p>
    <h3>House rules in use</h3>
    <ul>
      <li>Play to <b>10</b>.</li>
      <li>If everyone passes twice, the hand is <b>redealt</b> (the dealer is never forced to pick).</li>
      <li><b>Going alone</b> is allowed.</li>
    </ul>
    <h3>Computer levels</h3>
    <p>Choose in the Menu. Changing the level during a game starts a new game (you’re asked first). Your partner plays at the same level as the other two.</p>
    <ul>
      <li><b>Easy</b>: ${LEVEL_ABOUT.easy}</li>
      <li><b>Medium</b>: ${LEVEL_ABOUT.medium}</li>
      <li><b>Hard</b>: ${LEVEL_ABOUT.hard}</li>
    </ul>
    <div class="done"><button class="btn pri" data-close>Got it</button></div>
`;
