# card-games

A small collection of card games I like to play, made as web pages that work on a phone, install to the Home Screen, and play offline.

Live at **games.rugbyhubby.com** (hosted by GitHub Pages; Cloudflare handles DNS only).
The front page is a holding page. Each game lives at an unlisted link shared with testers.

## Folder layout

```
index.html          Holding page ("Nothing to see here yet."). No links to games.
CNAME               Tells GitHub Pages to serve the site at games.rugbyhubby.com.
robots.txt          Asks search engines not to crawl anything.
p/<slug>/<game>/    One folder per game. <slug> is a random 8-letter code that keeps the link unlisted.
  index.html        The game itself (one self-contained file).
  manifest.webmanifest   Name, icons and settings for "Add to Home Screen".
  sw.js             Service worker: saves the game's files so it runs offline.
  *.png             Home Screen icons (180, 192, 512 px).
shared/             Reserved for things several games will share. Empty for now.
```

Every page carries `<meta name="robots" content="noindex, nofollow">`. There is no analytics, tracking, cookies, or user data leaving the device. The only outside request is Google Fonts.

### Current games

| Game   | Link |
|--------|------|
| Euchre | https://games.rugbyhubby.com/p/bmuacrbv/euchre/ |

## Branches

- `main` is the live site. It only receives merges.
- Work happens on a branch per game (e.g. `euchre`), then a pull request into `main`. Merging the pull request publishes it.

## How releases work

Each game has a version number in two places that must change together:

1. `VERSION` near the top of the script in the game's `index.html` (shown small under the cards).
2. `CACHE` at the top of the game's `sw.js` (e.g. `euchre-v0.1.0`).

To release:

1. On the game's branch, make the changes.
2. Bump both numbers to the same new version, e.g. `0.1.0` → `0.1.1` for fixes, `0.2.0` for new features.
3. Open a pull request into `main` and merge it. GitHub Pages republishes within a minute or two.

Testers who are online get the new version the next time they open the game. The new cache name makes their phone save the fresh files and delete the old ones. Offline, they keep playing the last version they had.
