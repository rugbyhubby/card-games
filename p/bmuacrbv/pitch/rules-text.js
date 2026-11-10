// What each computer level means, in plain words (shown in the Menu and the rules).
export const LEVEL_ABOUT = {
  easy: 'Relaxed. The computer players make plenty of mistakes. Good for learning.',
  medium: 'Friendly. They play sensibly, like a casual player at the kitchen table.',
  hard: 'Tough. They remember every card played and bid boldly.'
};

// The "How to play" sheet.
export const rulesHTML = `
    <h2 id="rules-h">How to play</h2>
    <h3>The deck and teams</h3>
    <p>A regular 52-card deck. You and Partner play against West and East. Each player gets 6 cards. The first dealer is picked at random; after that the deal moves one seat to the left each hand.</p>
    <h3>The four points</h3>
    <p>Each hand, four points are up for grabs:</p>
    <ul>
      <li><b>High</b>: the highest trump played, to the team that played it.</li>
      <li><b>Low</b>: the lowest trump played. It goes to whoever played it, even if they lost that trick.</li>
      <li><b>Jack</b>: the Jack of trump, to whoever wins the trick it's in. If nobody was dealt it, there's no Jack point.</li>
      <li><b>Game</b>: the team whose tricks hold the most of these: 10 = 10, Ace = 4, King = 3, Queen = 2, Jack = 1. A tie means nobody gets it.</li>
    </ul>
    <h3>Bidding</h3>
    <p>Starting left of the dealer, each player bids once: 2, 3, 4, or <b>Shoot the moon</b>, or passes. Each bid must be higher than the last. That's how many points the bidder's team promises to win. If everyone passes, the dealer is stuck with a bid of 2.</p>
    <h3>Trump</h3>
    <p>Whoever wins the bid leads first. The suit of that first card becomes trump.</p>
    <h3>Play</h3>
    <p>Follow the suit that was led if you can, <b>or play a trump</b>. Unlike Euchre, you may trump even when you could follow suit. If you can't follow suit, play anything. The highest trump wins the trick, or the highest card of the suit led if no trump was played.</p>
    <h3>Scoring</h3>
    <ul>
      <li>The bidding team wins at least what it bid: it scores every point it won.</li>
      <li>It falls short: it loses the amount it bid.</li>
      <li>The other team always scores the points it won.</li>
      <li><b>Shoot the moon</b>: win every point in play (all 4, or all 3 if nobody was dealt the Jack) and you win the game on the spot. Miss even one and you lose 4 points.</li>
    </ul>
    <p>First team to <b>21 points</b> wins. If both teams reach 21 in the same hand, the bidding team wins.</p>
    <h3>Computer levels</h3>
    <p>Choose in the Menu; it starts with your next new game. Your partner plays at the same level as the other two.</p>
    <ul>
      <li><b>Easy</b>: ${LEVEL_ABOUT.easy}</li>
      <li><b>Medium</b>: ${LEVEL_ABOUT.medium}</li>
      <li><b>Hard</b>: ${LEVEL_ABOUT.hard}</li>
    </ul>
    <div class="done"><button class="btn pri" data-close>Got it</button></div>
`;
