# tools/

Checks for the games. Nothing here is used by the live games.

## Simulator

Plays hundreds of complete games of Euchre with every seat (including yours)
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
| `--games 2000` | how many games (default 300) |
| `--us medium --them easy` | each team's difficulty (default medium for both) |
| `--seed 5000` | use different deals (default starts at 1) |
| `--render` | also check every screen drawn (slower) |
| `--compare FILE` | compare game by game with a saved run |
| `--save FILE` | save this run |

Check that Easy and Medium still play, and look, exactly like v0.2.2:

```sh
tools/simulate.sh --us easy --render --compare tools/baselines/euchre-v0.2.2-easy.json
tools/simulate.sh --us medium --render --compare tools/baselines/euchre-v0.2.2-medium.json
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

## Files

| File | What it does |
|------|--------------|
| `simulate.sh` | Terminal command. |
| `simulate.js` | Reads the options, runs the games, prints the report. |
| `simulate.html` | Browser version. |
| `euchre-sim.js` | Plays one game of Euchre using the real game code, with a pretend clock so it runs instantly. |
| `sim-core.js` | Repeatable random numbers, the pretend clock, comparing runs. |
| `sim-env.js` | Stand-ins for the few browser features the game mentions, when run from Terminal. |
