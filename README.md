# card-games

A small collection of card games I like to play, made as web pages that work on a phone, install to the Home Screen, and play offline.

Live at **games.rugbyhubby.com** (hosted by GitHub Pages; Cloudflare handles DNS only).
The front page is a holding page. Each game lives at an unlisted link shared with testers.

## Folder layout

```
index.html          Holding page ("Nothing to see here yet."). No links to games.
CNAME               Tells GitHub Pages to serve the site at games.rugbyhubby.com.
robots.txt          Asks search engines not to crawl anything.
shared/             The toolkit every game uses: deck, card drawings, table layout,
                    score header and sheets, computer-move timing, settings, theme.
                    See shared/README.md.
p/<slug>/           The game list ("Card Games"). <slug> is a random 8-letter code that keeps the link unlisted.
  index.html        The list: Euchre, then Pitch, Cribbage, Nertz, Solitaire ("Coming soon").
  main.js           Settings sheet, links into games, offline setup.
  version.js        The game list's version number.
  manifest.webmanifest, sw.js, *.png, icon.svg
                    Its own Home Screen app ("Card Games"), offline helper and icon
                    (icon.svg is the source drawing for the PNGs).
p/<slug>/<game>/    One folder per game.
  index.html        The page: head tags, icons, and the game's own few styles.
  main.js           Connects the game to the screen and to taps.
  game.js           Game flow: dealing, bidding, play, scoring.
  rules.js          Card rules (which card wins, what may be played).
  bots.js           Computer-player strategy.
  view.js           Draws the screen from the shared parts.
  version.js        The version number.
  manifest.webmanifest   Name, icons and settings for "Add to Home Screen".
  sw.js             Service worker: saves the game's files (and the shared files it uses) so it runs offline.
  *.png             Home Screen icons (180, 192, 512 px).
tools/              Simulator that plays hundreds of computer-only games to check for errors
                    and compare versions. Not used by the live site. See tools/README.md.
```

### How games use shared code

The code is plain JavaScript modules loaded straight from the folder (`<script type="module">`
and `import ... from '../../../shared/deck.js'`). There is no build step and nothing to
install; GitHub Pages serves the files as they are.

What goes where:

- **shared/**: anything more than one game needs. Decks and shuffling (52-card or custom),
  card faces and backs, four-seat and two-seat tables, header, status line, buttons,
  end-of-hand sheet, pauses between computer moves, settings, colors and fonts.
- **the game's folder**: only that game's rules, bidding, scoring and computer strategy,
  plus the small file that draws its screen from the shared parts.

Settings (difficulty, game speed, theme) are kept in memory only. Nothing is saved on the
phone. When you move between the game list and a game, the link carries them in the part
after `#` (e.g. `euchre/#speed=fast&theme=dark`), which never leaves the phone. Closing
the page resets them. Each game's Menu has New game, Rules, the settings, and "All games".

To try the site on your Mac, start a local web server in the `card-games` folder
(`python3 -m http.server 8000`) and open http://localhost:8000/p/<slug>/euchre/.
Opening the HTML file directly doesn't work, because browsers only load modules from a web server.

Every page carries `<meta name="robots" content="noindex, nofollow">`. There is no analytics, tracking, cookies, or user data leaving the device. The only outside request is Google Fonts.

### Current games

| Page      | Link |
|-----------|------|
| Game list | https://games.rugbyhubby.com/p/bmuacrbv/ |
| Euchre    | https://games.rugbyhubby.com/p/bmuacrbv/euchre/ |

Testers who added Euchre to their Home Screen before the game list existed keep that icon; it
still works. Adding the game list to the Home Screen gives a "Card Games" icon that opens the list.

## Branches

- `main` is the live site. It only receives merges.
- Work happens on a branch (e.g. `euchre`, `shared-engine`), then a pull request into `main`. Merging the pull request publishes it.

## How releases work

Each game, and the game list, has a version number in two places that must change together:

1. `VERSION` in its `version.js` (shown small at the bottom of the screen).
2. `CACHE` at the top of its `sw.js` (e.g. `euchre-v0.2.2`, `cardgames-v0.2.2`).

Shared files count as part of every page that uses them: if you change something in `shared/`,
bump the version of each game, and of the game list, that uses it.

To release:

1. On a branch, make the changes.
2. Bump both numbers to the same new version, e.g. `0.1.0` → `0.1.1` for fixes, `0.2.0` for new features.
3. Run the simulator (`tools/simulate.sh`) and check it ends with `RESULT: OK`.
4. Open a pull request into `main` and merge it. GitHub Pages republishes within a minute or two.

Testers who are online get the new version the next time they open the game. The new cache name makes their phone save the fresh files and delete the old ones. The page and code files always check for a newer copy first when online, so a new page never runs with old code. Offline, they keep playing the last version they had.
