// The "How to play" sheet.
export const rulesHTML = `
    <h2 id="rules-h">How to play</h2>
    <h3>The deck and teams</h3>
    <p>24 cards: 9, 10, Jack, Queen, King and Ace in each suit. You and Partner play against West and East. Each player gets 5 cards and one card is turned up.</p>
    <h3>Trump and the bowers</h3>
    <p>Trump beats every other suit. The highest trumps are the two Jacks of trump's color:</p>
    <ul>
      <li><b>Right bower</b>: the Jack of trump.</li>
      <li><b>Left bower</b>: the other Jack of the same color. It counts as a trump, not its own suit.</li>
    </ul>
    <p>Then Ace, King, Queen, 10, 9 of trump.</p>
    <h3>Bidding, round one</h3>
    <p>Starting left of the dealer, each player may <b>order up</b> the turned-up card, making its suit trump, or pass. If someone orders it up, the dealer takes that card and discards one.</p>
    <h3>Bidding, round two</h3>
    <p>If all four pass, the card is turned down. Each player may now name any other suit as trump, or pass.</p>
    <h3>Redeal</h3>
    <p>If everyone passes twice, the hand is thrown in and the next player deals.</p>
    <h3>Play</h3>
    <p>The player left of the dealer leads. You must follow the suit led if you can; otherwise play anything. The highest trump wins the trick, or the highest card of the suit led if no trump was played.</p>
    <h3>Going alone</h3>
    <p>Whoever names trump may go alone. Their partner sits out the hand, and taking all 5 tricks scores extra.</p>
    <h3>Scoring</h3>
    <ul>
      <li>Calling team takes 3 or 4 tricks: <b>1 point</b>.</li>
      <li>Calling team takes all 5: <b>2 points</b>.</li>
      <li>All 5 while going alone: <b>4 points</b>.</li>
      <li>Calling team takes fewer than 3 (<b>euchred</b>): the other team gets <b>2 points</b>.</li>
    </ul>
    <p>First team to <b>10 points</b> wins.</p>
    <div class="done"><button class="btn pri" data-close>Got it</button></div>
`;
