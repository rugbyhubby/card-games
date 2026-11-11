# tools/

Checks for the games. Nothing here is used by the live games.

## Simulator

Plays hundreds of complete games of Euchre, Pitch or Cribbage with every seat (including yours)
run by the computer, and reports:

- any errors or stuck games
- how often each team won, with a margin of error
- optionally, whether the results are **identical** to a saved earlier run

The "random" shuffles are repeatable: game 1 always gets the same deal, game 2
the same as last time, and so on. That makes a before/after comparison exact.
If two versions play every game with the same bids, the same cards, the same
screens and the same final scores, nothing changed in how the game plays.

### From Terminal (Mac, nothing to install)

Uses the JavaScript engine that comes with macOS. From the `card-games` folder:

```sh
tools/simulate.sh
```

Options:

| Option | Meaning |
|--------|---------|
| `--game pitch` | which game: euchre (default), pitch or cribbage |
| `--games 2000` | how many games (default 300) |
| `--us hard --them medium` | each team's difficulty: easy, medium or hard (default medium for both) |
| `--seed 5000` | use different deals (default starts at 1) |
| `--render` | also check every screen drawn (slower) |
| `--compare FILE` | compare game by game with a saved run |
| `--save FILE` | save this run |

How strong is Hard? (v0.3.0: about 76% wins against Medium)

```sh
tools/simulate.sh --games 2000 --us hard --them medium
```

Pitch (v0.1.0: Hard wins about 62% against Medium):

```sh
tools/simulate.sh --game pitch --games 2000 --us hard --them medium
tools/simulate.sh --game pitch --us medium --render --compare tools/baselines/pitch-v0.1.0-medium.json
```

Cribbage (v0.1.0: Hard wins 59.9% against Medium over 2,000 games). Every hand is checked
(8 cards pegged, a 4-card crib, no card turned up twice) and every point scored is added up
and compared with the scores shown:

```sh
tools/simulate.sh --game cribbage --games 2000 --us hard --them medium
tools/simulate.sh --game cribbage --us medium --render --compare tools/baselines/cribbage-v0.1.0-medium.json
```

Cribbage counting and pegging are checked against tricky hands (29, double and triple runs,
crib flush with 4 vs 5 cards, his nibs, his heels, skunk lines):

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tools/cribbage-count-check.js
```

Hard's crib table (what two discards are usually worth in a crib) comes from
`tools/cribbage-crib-table.js`; rerun it and paste the result into `cribbage/bots-hard.js` if counting rules ever change.

Pitch's card rules (following suit, trumping, who gets each point) also have a quick check
against hand-made examples:

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tools/pitch-rules-check.js
```

Check that each Euchre level still plays, and looks, exactly like v0.3.0:

```sh
tools/simulate.sh --us easy --render --compare tools/baselines/euchre-v0.3.0-easy.json
tools/simulate.sh --us medium --render --compare tools/baselines/euchre-v0.3.0-medium.json
tools/simulate.sh --us hard --render --compare tools/baselines/euchre-v0.3.0-hard.json
```

Leave out `--render` to compare play only (bids, cards, scores), e.g. against v0.1.0,
whose screens had "Rules · New game" where v0.2.2 has "Menu".

The last line says `RESULT: OK` or `RESULT: PROBLEMS FOUND`.

### In a browser

Start a local web server in the `card-games` folder (`python3 -m http.server 8000`),
then open http://localhost:8000/tools/simulate.html. Same options, with a Run button.

## Baselines

Saved results of 300 games each, for Easy and Medium:

- `euchre-v0.1.0-*.json`: the original single-file Euchre, before the shared toolkit.
  Made by running the same test against the v0.1.0 code from the `main` branch.
- `euchre-v0.2.2-*.json`: v0.2.2 (Menu in place of Rules · New game). Same play as v0.1.0.
- `pitch-v0.1.0-*.json`: the first Pitch, Easy, Medium and Hard.
- `cribbage-v0.1.0-*.json`: the first Cribbage, Easy, Medium and Hard.
- `euchre-v0.3.0-*.json`: v0.3.0, Easy, Medium and Hard. Easy plays the same as before;
  Medium changed on purpose in v0.3.0 (it no longer beats a partner who is winning the
  trick when it has another card to play).
- `euchre-v0.3.4-*.json`, `cribbage-v0.1.1-*.json`: same play as v0.3.0 and v0.1.0; only
  some wording on screen changed (Euchre messages without dashes, Cribbage "Deal next hand").
- `pitch-v0.1.3-*.json`: the dealer may take the bid by matching it, and Shoot the moon
  needs all four points. Play changed on purpose.
- `cribbage-v0.1.2-*.json`: the redrawn table (every card full size). Same play as v0.1.1.

## Files

| File | What it does |
|------|--------------|
| `simulate.sh` | Terminal command. |
| `simulate.js` | Reads the options, runs the games, prints the report. |
| `simulate.html` | Browser version. |
| `euchre-sim.js` | Plays one game of Euchre using the real game code, with a pretend clock so it runs instantly. |
| `pitch-sim.js` | The same for Pitch. Also checks every hand: 24 cards played, points add up. |
| `pitch-rules-check.js` | Checks Pitch's card rules against hand-made examples. |
| `cribbage-sim.js` | The same for Cribbage. Checks every hand and that the points add up. |
| `cribbage-count-check.js` | Checks Cribbage counting and pegging against tricky hands. |
| `cribbage-crib-table.js` | Works out the average crib value of every pair of discards (for Hard). |
| `sim-core.js` | Repeatable random numbers, the pretend clock, comparing runs. |
| `sim-env.js` | Stand-ins for the few browser features the game mentions, when run from Terminal. |
