// The cribbage board, drawn like a real one and laid on its side across the top
// of the table: Start on the left, 1-35 along the bottom edge, around the end,
// 45-80 back, around the other end, then 85-120 up the middle to Finish.
// One lane per player: you red (outer lane), Computer blue (inner lane).
// Skunk lines mark 91 (S) and 61 (SS). The board is for looking only.
//
// boardSVG() draws it (the simulator uses this). createBoard() keeps one board
// on screen between redraws and moves pegs hole by hole when someone scores.

const BD = { Lc: 10, Mc: 30, Rc: 50, Y0: 30, dy: 5, G: 3, W: 68, H: 248 };
const YB = BD.Y0 + 35 * BD.dy + 7 * BD.G;
const yL = n => BD.Y0 + (35 - n) * BD.dy + (6 - Math.floor((n - 1) / 5)) * BD.G;
const yR = n => BD.Y0 + (n - 45) * BD.dy + (n <= 45 ? 0 : Math.floor((n - 46) / 5) + 1) * BD.G;
const yM = n => YB - (n - 85) * BD.dy - (n <= 85 ? 0 : Math.floor((n - 86) / 5) + 1) * BD.G;
export const PEG_COLOR = ['#d0312d', '#2f5fd0'];     // seat 0 (you) red, seat 1 (Computer) blue

// Where hole n is (0 = start, 121 = finish) in a lane, on the board standing up.
function holeUp(n, lane) {
  const d = lane ? 3 : -3;
  if (n <= 0) return [BD.Lc + d, yL(1) + 9];
  if (n <= 35) return [BD.Lc + d, yL(n)];
  if (n <= 44) { const t = Math.PI - (n - 35) * Math.PI / 10, r = 20 - d; return [30 + r * Math.cos(t), BD.Y0 - r * Math.sin(t)]; }
  if (n <= 80) return [BD.Rc - d, yR(n)];
  if (n <= 84) { const t = -(n - 80) * Math.PI / 5, r = 10 - d; return [40 + r * Math.cos(t), YB - r * Math.sin(t)]; }
  if (n <= 120) return [BD.Mc + d, yM(n)];
  return [BD.Mc, BD.Y0 - 9];
}
const r1 = v => Math.round(v * 10) / 10;
// Lying on its side: Start on the left.
export const hole = (n, lane) => { const [x, y] = holeUp(Math.max(0, Math.min(121, n)), lane); return [r1(BD.H - y), r1(x)]; };
const P = (x, y) => `${r1(BD.H - y)} ${r1(x)}`;

let drawing = null;   // the board without pegs never changes, so draw it once
function boardLines() {
  if (drawing) return drawing;
  const track = d => `M${P(BD.Lc + d, yL(1) + 14)} L${P(BD.Lc + d, BD.Y0)} A${20 - d} ${20 - d} 0 0 1 ${P(BD.Rc - d, BD.Y0)} L${P(BD.Rc - d, YB)} A${10 - d} ${10 - d} 0 0 1 ${P(BD.Mc + d, YB)} L${P(BD.Mc + d, BD.Y0 - 3)}`;
  let h = [-6, 0, 6].map(d => `<path d="${track(d)}" fill="none" stroke="currentColor" stroke-width="${d ? .7 : .4}"/>`).join('');
  h += '<g fill="currentColor" opacity=".7">';
  for (const lane of [0, 1]) for (let n = 1; n <= 120; n++) { const [x, y] = hole(n, lane); h += `<circle cx="${x}" cy="${y}" r="1.15"/>`; }
  h += '</g><g fill="none" stroke="currentColor" stroke-width=".6" opacity=".7">';
  for (const lane of [0, 1]) { const [x, y] = hole(0, lane); h += `<circle cx="${x}" cy="${y}" r="1.6"/>`; }
  const [fx, fy] = hole(121, 0);
  h += `<circle cx="${fx}" cy="${fy}" r="1.8"/></g>`;
  const text = (x, y, s, size = 3.2, cls = 'num') => { const [a, c] = P(x, y).split(' '); return `<text class="${cls}" x="${a}" y="${r1(+c + size / 3)}" font-size="${size}" text-anchor="middle">${s}</text>`; };
  for (let n = 5; n <= 35; n += 5) h += text(20, yL(n), n);
  for (let n = 45; n <= 80; n += 5) if (n !== 60) h += text(62, yR(n), n);
  for (let n = 85; n <= 120; n += 5) if (n !== 90) h += text(40, yM(n), n);
  h += text(BD.Mc, BD.Y0 - 4.5, 'FINISH', 2.4) + text(BD.Lc, yL(1) + 18, 'START', 2.6);
  const line = (x, ya, yb, lab) => { const y = (ya + yb) / 2; return `<path d="M${P(x - 7, y)} L${P(x + 7, y)}" stroke="currentColor" stroke-width=".9" stroke-dasharray="1.2 .8"/>` + text(x + (x === BD.Mc ? 10 : 12), y, lab, 3.6, 'sk'); };
  h += line(BD.Mc, yM(90), yM(91), 'S') + line(BD.Rc, yR(60), yR(61), 'SS');
  drawing = h;
  return h;
}

const pegHTML = (seat, i, n) => { const [x, y] = hole(n, seat); return `<g class="peg" data-seat="${seat}" data-i="${i}" style="transform:translate(${x}px,${y}px)"><circle r="2.3" fill="${PEG_COLOR[seat]}" stroke="#1d1d1f" stroke-width=".5"/></g>`; };

// pegs: [[back, front] for each seat]
export function boardSVG(pegs) {
  const p = pegs.map(([b, f], seat) => pegHTML(seat, 0, b) + pegHTML(seat, 1, f)).join('');
  return `<svg viewBox="0 0 ${BD.H} ${BD.W}" role="img" aria-label="Cribbage board">${boardLines()}${p}</svg>`;
}

// A board that stays on screen. update(pegs) moves pegs: when a player scores,
// their back peg steps hole by hole past the front one to the new total.
// stepMs(holes) gives the time per hole (so it can follow game speed).
export function createBoard({ stepMs = holes => Math.min(90, 1000 / holes) } = {}) {
  const el = document.createElement('div');
  el.className = 'cboard';
  let shown = null, els = null;
  const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const place = (g, n, seat) => { const [x, y] = hole(n, seat); g.style.transform = `translate(${x}px,${y}px)`; };
  function reset(pegs) {
    el.innerHTML = boardSVG(pegs);
    els = pegs.map((_, seat) => [0, 1].map(i => el.querySelector(`.peg[data-seat="${seat}"][data-i="${i}"]`)));
    shown = pegs.map(p => [...p]);
  }
  function update(pegs) {
    if (!shown || pegs.length !== shown.length) return reset(pegs);
    pegs.forEach(([b, f], seat) => {
      const [ob, of] = shown[seat];
      if (b === ob && f === of) return;
      const [gBack, gFront] = els[seat];
      if (b === of && f > of) {               // a score: the back peg leapfrogs
        clearTimeout(gBack._t);
        if (reduced()) place(gBack, f, seat);
        else {
          const ms = Math.max(12, stepMs(f - ob));
          let at = ob;
          const stepOne = () => { at++; place(gBack, at, seat); if (at < f) gBack._t = setTimeout(stepOne, ms); };
          gBack.style.transition = `transform ${ms}ms linear`;
          stepOne();
        }
        els[seat] = [gFront, gBack];
      } else {                                // new game, or anything unexpected: jump
        clearTimeout(gBack._t); clearTimeout(gFront._t);
        gBack.style.transition = gFront.style.transition = 'none';
        place(gBack, b, seat); place(gFront, f, seat);
      }
      shown[seat] = [b, f];
    });
  }
  return { el, update };
}
