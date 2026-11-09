# shared/

The toolkit every game builds on. A game writes only its own rules, bidding,
scoring and computer strategy; everything else comes from here.

Plain JavaScript modules and CSS: no build step, no frameworks, nothing to install.
Games load them with relative paths, e.g. from `p/<slug>/euchre/`:

```html
<link rel="stylesheet" href="../../../shared/theme.css">
<link rel="stylesheet" href="../../../shared/parts.css">
<script type="module" src="main.js"></script>
```

```js
import { makeDeck, shuffle } from '../../../shared/deck.js';
```

| File | What it does |
|------|--------------|
| `theme.css` | Colors for light and dark, fonts (Instrument Serif / Instrument Sans), page basics. |
| `parts.css` | Styles for everything below: header, table, seats, cards, buttons, sheets. |
| `theme.js` | `applyTheme('system' \| 'light' \| 'dark')`. |
| `deck.js` | Suits and symbols, `makeDeck()` (52 cards, or custom ranks such as Euchre's 24), `shuffle()`, `cardName()`. |
| `cards.js` | Drawing cards: `cardHTML()` faces, `backHTML()`, `miniFanHTML()` small backs for a seat's hand. |
| `table.js` | Table layout for 4 seats or 2 seats: `seatHTML()` (avatar, dealer tag, speech bubble, turn highlight), `meHTML()`, `tableHTML()`, `centerHTML()`, `slotHTML()`. |
| `ui.js` | Score header, controls row, status line, action buttons, footer, the end-of-hand / game-over sheet, pop-up sheets (`createSheet()`), the menu and settings sheet, the feedback email link, and `addRotateNotice()` (a "turn your phone upright" note when a phone is held sideways; each game calls it once). |
| `timing.js` | `createTimer()`: pauses between computer moves, and `cancelAll()` so New game drops any moves still waiting. |
| `settings.js` | Difficulty, game speed and theme. In memory, carried between pages in the link (see below). |

## Settings and storage

`settings.js` keeps settings in memory. Nothing is saved on the phone. They travel in the
page link (the part after `#`, e.g. `#speed=fast&theme=dark`) when you move between the
game list and a game: links marked `data-carry="<page>"` get the current settings added
(see `bindSettings()` in `ui.js`). Closing the page resets them.

To store them properly later, write a small "store" object with `load()` and
`save(values)` and pass it to `createSettings()`. The games don't need to change.

## Menu and settings sheet

`ui.js` has `menuHTML()` (a game's Menu: its own buttons, game speed, theme, and
"‹ All games") and `settingsHTML()` (just game speed and theme, used on the game list).
`bindSettings()` makes the controls work. `theme.js` has `followTheme(settings)`.

## Offline

Each game's `sw.js`, and the game list's, lists the shared files it uses, so
they are saved for offline play. **If a page starts using another shared file,
add it to that page's `sw.js` list.** When a new game is added, also register
its `sw.js` from the game list's `main.js` (as Euchre's is), so it's saved for
offline play as soon as someone opens the list.
