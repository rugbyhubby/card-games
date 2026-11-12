// Grandma Dot sketches: three takes (A, B, C), nine poses each.
// Single-weight lines in the current text color, so they work in light and dark.
// Shapes that should hide lines behind them (hair, hands, mug) are filled with
// the page background (class "occ"), so they still look like line drawings.
//
//   dotSVG(take, pose)  returns an <svg> string. take: 'A' | 'B' | 'C'.

export const POSES = [
  ['sip', 'Neutral, sipping coffee', 'Waiting for you'],
  ['lean', 'Leaning in', 'Showing you something on the cards'],
  ['nod', 'Nod', 'You did fine'],
  ['brow', 'Raised eyebrow', 'Questionable play'],
  ['palm', 'Face-palm', 'Putz play'],
  ['pin', 'Apron on, rolling pin', 'Catastrophe: sugar cookie time'],
  ['clap', 'Slow clap', 'A genuinely good play'],
  ['smug', 'Smug', 'Her own great play'],
  ['tap', 'Tapping the table', 'You’re taking too long']
];

const OCC = 'class="occ"';
const p = (d, a = '') => `<path d="${d}" ${a}/>`;
const r1 = v => Math.round(v * 10) / 10;

// A coffee mug, top-left corner at (x, y).
function mug(x, y, { steam = true, label = '' } = {}) {
  return `<g transform="translate(${x} ${y})">
    ${steam ? p('M3 -2q-2-3 0-6M7 -2q2-3 0-6', 'stroke-width="1.2"') : ''}
    ${p('M10 3q5 0 5 4t-5 4')}
    ${p('M0 0h10v10q0 3-3 3h-4q-3 0-3-3z', OCC)}
    ${label ? `<path d="${label}" stroke-width="1"/>` : ''}</g>`;
}

// Curly perm for take A: little bumps along an arc over the head.
function perm() {
  const cx = 50, cy = 35, R = 16, n = 13;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (200 - i * (220 / n)) * Math.PI / 180;
    pts.push([r1(cx + R * Math.cos(a)), r1(cy - R * Math.sin(a))]);
  }
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += `A2.6 2.6 0 0 1 ${pts[i][0]} ${pts[i][1]}`;
  d += `C61 31 56 28.5 50 29.5C44 28.5 39 31 ${pts[0][0]} ${pts[0][1]}Z`;
  return p(d, OCC) + p('M41 24q2-2 4 0M50 21q2-2 4 0M56 25q2-2 4 0', 'stroke-width="1.1"');
}

// The three takes. Each has its own head, hair, glasses, cardigan details and mug.
const TAKES = {
  A: {
    name: 'A · Church-basement classic',
    about: 'Round face, tight curly perm, cat-eye glasses, button cardigan with a Peter Pan collar.',
    head: '<circle cx="50" cy="37" r="13.5"/>',
    hair: perm(),
    eyes: [43.5, 56.5, 37], mouthY: 45.5,
    glasses: p('M37.5 34.5Q43 32 48 34.5Q47.5 40 43 40Q38.5 39.5 37.5 34.5ZM62.5 34.5Q57 32 52 34.5Q52.5 40 57 40Q61.5 39.5 62.5 34.5Z') +
      p('M37.5 34.5l-1.6-1.8M62.5 34.5l1.6-1.8M48 35q2-1.2 4 0'),
    temples: [[36.5, 35], [63.5, 35]],
    body: p('M41 61q4.5 6 9 2q4.5 4 9-2') + p('M40 62C42 76 43 88 44 100M60 62C58 76 57 88 56 100') +
      '<circle cx="42" cy="74" r="1"/><circle cx="42.8" cy="84" r="1"/><circle cx="43.5" cy="94" r="1"/>',
    mugLabel: 'M2.5 4.5h5'                                   // a stripe on the mug
  },
  B: {
    name: 'B · Beehive and readers',
    about: 'Tall set beehive, half-moon readers low on the nose (she looks over them), pearls, cardigan with pockets.',
    head: '<ellipse cx="50" cy="38" rx="12" ry="14"/>',
    hair: p('M37.5 37C33 27 35.5 16 41 11C44 3.5 56 3.5 59 11C64.5 16 67 27 62.5 37C60 30.5 55 28.5 50 30.5C45 28.5 40 30.5 37.5 37Z', OCC) +
      p('M43 21C45 14 55 14 57 21M45.5 12.5C48 9.5 52 9.5 54.5 12.5M40 29q3-3 6-2', 'stroke-width="1.1"'),
    eyes: [44.5, 55.5, 36], mouthY: 46.5,
    glasses: p('M39 39.5h8.5q0 4-4.25 4t-4.25-4zM52.5 39.5h8.5q0 4-4.25 4t-4.25-4z') + p('M47.5 40q2.5-1.4 5 0'),
    temples: [[38.5, 39.5], [61.5, 39.5]],
    body: p('M40 62C42 76 43 88 44 100M60 62C58 76 57 88 56 100') + p('M24 86h9v8h-9zM67 86h9v8h-9z') +
      [0, 1, 2, 3, 4, 5, 6].map(i => { const t = i / 6, x = 42 + 16 * t, y = 62 + 6 * Math.sin(Math.PI * t); return `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.1"/>`; }).join(''),
    mugLabel: 'M3 4.5l2 3 2-3'                               // a little heart-ish V
  },
  C: {
    name: 'C · Simple shapes',
    about: 'Closest to the other players’ avatars: round head, set waves, big round glasses, V-neck cardigan, brooch.',
    head: '<circle cx="50" cy="38" r="13"/>',
    hair: p('M35.5 39C34 25 41 20 50 20S66 25 64.5 39C62 33 57 31 54 33C51 30 49 30 46 33C43 31 38 33 35.5 39Z', OCC) +
      p('M39.5 27q3-3 6 0q3-3 6 0q3-3 6 0q2.5-2.5 4.5-.5', 'stroke-width="1.1"'),
    eyes: [44.5, 55.5, 38], mouthY: 46,
    glasses: '<circle cx="44.5" cy="38" r="5"/><circle cx="55.5" cy="38" r="5"/>' + p('M49.5 37.5q.5-1 1 0'),
    temples: [[39.5, 37.5], [60.5, 37.5]],
    body: p('M42 61L50 79L58 61M50 79V100') + '<circle cx="61" cy="70" r="2.2"/><circle cx="61" cy="70" r=".5"/>',
    mugLabel: ''
  }
};
export const TAKE_INFO = Object.fromEntries(Object.entries(TAKES).map(([k, t]) => [k, { name: t.name, about: t.about }]));

// Eyes, brows and mouth for an expression.
function face(T, { eyes = 'open', brows = '', mouth = 'smile' }) {
  const [xl, xr, y] = T.eyes, m = T.mouthY;
  const dot = (x, yy) => `M${r1(x)} ${r1(yy)}h.01`;
  let e = '';
  if (eyes === 'open') e = p(dot(xl, y) + dot(xr, y), 'stroke-width="2.4"');
  if (eyes === 'side') e = p(dot(xl + 1.5, y) + dot(xr + 1.5, y), 'stroke-width="2.4"');
  if (eyes === 'down') e = p(dot(xl + 1, y + 1) + dot(xr + 1, y + 1), 'stroke-width="2.4"');
  if (eyes === 'happy') e = p(`M${xl - 2} ${y + .8}q2-2.4 4 0M${xr - 2} ${y + .8}q2-2.4 4 0`);
  if (eyes === 'calm') e = p(`M${xl - 2} ${y - .4}q2 2 4 0M${xr - 2} ${y - .4}q2 2 4 0`);
  if (eyes === 'half') e = p(`M${xl - 2.3} ${y - .5}h4.6M${xr - 2.3} ${y - .5}h4.6`) + p(dot(xl, y + .6) + dot(xr, y + .6), 'stroke-width="2"');
  let b = '';
  if (brows === 'raised') b = p(`M${xl - 3} ${y - 6.5}q3-3 6-.5M${xr - 3} ${y - 4.5}h6`);
  if (brows === 'stern') b = p(`M${xl - 3} ${y - 5.5}l6 1.4M${xr + 3} ${y - 5.5}l-6 1.4`);
  if (brows === 'up') b = p(`M${xl - 2.6} ${y - 5}q2.6-1.6 5.2 0M${xr - 2.6} ${y - 5}q2.6-1.6 5.2 0`);
  const M = {
    smile: `M46 ${m}q4 2.6 8 0`,
    big: `M45 ${m - .5}q5 4.5 10 0`,
    flat: `M46.5 ${m + .6}h7`,
    tilt: `M46.5 ${m + 1}l7-1.2`,
    smirk: `M46 ${m + 1}q4 .6 8.5-2.6`,
    tight: `M47 ${m + 1}q3-1.4 6 0`
  };
  return e + b + (mouth && M[mouth] ? p(M[mouth]) : '');
}

const TABLE = y => p(`M3 ${y}H97`);
// A sleeve: two edges (each a curve from the shoulder end to the cuff), closed so it hides what's behind.
const sleeve = (a, b) => p(`M${a[0]} ${a[1]}C${a[2]} ${a[3]} ${a[4]} ${a[5]} ${a[6]} ${a[7]}L${b[6]} ${b[7]}C${b[4]} ${b[5]} ${b[2]} ${b[3]} ${b[0]} ${b[1]}Z`, OCC);

// Each pose: the face, an optional head tilt, and what her arms and hands are doing.
function pose(T, k) {
  const onTable = (x = 8, y = 80) => mug(x, y, { steam: false, label: T.mugLabel });
  switch (k) {
    case 'sip': return {
      face: { eyes: 'calm', mouth: '' },
      under: '',
      over: sleeve([80, 100, 78, 82, 73, 67, 66, 55], [70, 100, 69, 84, 66, 71, 61, 57]) +
        mug(47, 41, { label: T.mugLabel }) + p('M57 45.5q5-1.5 7.5 1.5v6.5q-3.5 2.5-7.5 .5z', OCC)
    };
    case 'lean': return {
      head: 'translate(4 3) rotate(10 50 37)',
      face: { eyes: 'down', brows: 'up', mouth: 'smile' },
      under: TABLE(94) + onTable(6, 81),
      over: sleeve([63, 70, 71, 74, 77, 80, 81, 86], [61, 78, 67, 81, 73, 85, 78, 90]) + '<circle cx="81.5" cy="88.5" r="4.2" class="occ"/>' + p('M84.5 91l6.5 3.5')
    };
    case 'nod': return {
      head: 'translate(0 2)',
      face: { eyes: 'happy', mouth: 'smile' },
      under: TABLE(94) + onTable(),
      over: p('M27 26v10m-2.3-2.8 2.3 3 2.3-3M73 26v10m-2.3-2.8 2.3 3 2.3-3', 'stroke-width="1.3"')
    };
    case 'brow': return {
      face: { eyes: 'open', brows: 'raised', mouth: 'tilt' },
      under: '',
      over: sleeve([34, 100, 36, 88, 44, 80, 52, 76], [44, 100, 46, 92, 50, 86, 55, 82]) + mug(55, 68, { steam: false, label: T.mugLabel }) +
        '<ellipse cx="54.5" cy="77" rx="3.6" ry="4.6" class="occ"/>'
    };
    case 'palm': return {
      head: 'rotate(6 50 40)',
      face: { eyes: 'open', mouth: 'tight' },
      under: TABLE(94) + onTable(82, 81),
      over: sleeve([22, 100, 24, 80, 31, 60, 39, 46], [32, 100, 34, 82, 39, 64, 46, 48]) +
        `<g transform="rotate(6 50 40) translate(50 51) scale(1.2) translate(-50 -51)">` +
        p('M38.5 31.5q10.5-4.5 21-1.2q3 6.5 0 13q-10.5 3.5-21 0q-3.2-5.8 0-11.8z', OCC) + p('M42.5 31v-5M47.5 30v-6M52.5 30v-5.5M57 31v-4', 'stroke-width="1.3"') + '</g>'
    };
    case 'pin': return {
      face: { eyes: 'calm', mouth: 'smile' },
      under: TABLE(96) + mug(85, 83, { label: T.mugLabel }),
      over: p('M43 62.5L45 66.5M57 62.5L55 66.5') + p('M41.5 66.5h17v12h-17z', OCC) + p('M37.5 78.5h25l3 21.5h-31z', OCC) + p('M45 87h10v6h-10z') +
        `<g transform="rotate(-18 50 82)"><path d="M19 82h8M73 82h8" stroke-width="2.2"/><rect x="27" y="78" width="46" height="8" rx="3.5" class="occ"/>
         <circle cx="31" cy="82" r="4.3" class="occ"/><circle cx="69" cy="82" r="4.3" class="occ"/></g>`
    };
    case 'clap': return {
      face: { eyes: 'open', brows: 'up', mouth: 'smile' },
      under: TABLE(96) + onTable(6, 83),
      over: sleeve([20, 100, 22, 84, 32, 72, 44, 66], [30, 100, 32, 88, 38, 80, 46, 74]) + sleeve([80, 100, 78, 84, 68, 72, 56, 66], [70, 100, 68, 88, 62, 80, 54, 74]) +
        p('M44.5 63q1-7 4-7t3.2 7v10q-1 3.4-3.6 3.4t-3.6-3.4z', OCC) + p('M48.4 63q1-7 4-7t3.2 7v10q-1 3.4-3.6 3.4t-3.6-3.4z', OCC) +
        p('M39 58l-5-3M38 64h-6M61 58l5-3M62 64h6M50 52.5v-2', 'stroke-width="1.3"')
    };
    case 'smug': return {
      head: 'translate(0 -1) rotate(-8 50 37)',
      face: { eyes: 'half', brows: 'up', mouth: 'smirk' },
      under: TABLE(96) + onTable(6, 83),
      over: sleeve([82, 100, 82, 85, 80, 73, 76, 65], [72, 100, 72, 87, 71, 75, 70, 67]) +
        `<g transform="rotate(14 76 50)"><rect x="70" y="40" width="12" height="17" rx="1.6" class="occ"/>
         <text x="72.4" y="47.5" font-size="6.5" font-family="Georgia,serif" fill="currentColor" stroke="none">J</text></g>` +
        '<circle cx="73.5" cy="62.5" r="4.2" class="occ"/>'
    };
    case 'tap': return {
      face: { eyes: 'side', brows: 'stern', mouth: 'flat' },
      under: TABLE(91) + onTable(9, 78),
      over: sleeve([70, 68, 69, 76, 68, 82, 68, 88], [78, 70, 78, 78, 78, 84, 78, 88]) + p('M65 91q1-6 7-6h8q3.5 0 3.5 3.5v2.5z', OCC) +
        p('M80.5 85.5l3.5-7.5', 'stroke-width="2"') + p('M87 77l3-2M88 81h4M86 73l2-3', 'stroke-width="1.3"')
    };
  }
  return { face: {}, under: '', over: '' };
}

const SHOULDERS = 'M14 100C16 76 30 62 50 62S84 76 86 100';

export function dotSVG(take = 'A', k = 'sip', { label = '' } = {}) {
  const T = TAKES[take] || TAKES.A, P = pose(T, k);
  const [tl, tr] = T.temples;
  const chain = `M${tl[0]} ${tl[1]}C${tl[0] - 4} ${tl[1] + 16} 42 64 50 67C58 64 ${tr[0] + 4} ${tr[1] + 16} ${tr[0]} ${tr[1]}`;
  return `<svg class="dot" viewBox="2 -2 96 102" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${label || 'Grandma Dot'}">
    ${P.under}
    ${p(SHOULDERS, OCC)}${p('M45 49v9M55 49v9')}${T.body}
    ${p(chain, 'stroke-width="1.5" stroke-dasharray=".1 2.4"')}
    <g transform="${P.head || ''} translate(50 51) scale(1.2) translate(-50 -51)">${T.head.replace('/>', ' class="occ"/>')}${T.hair}${face(T, P.face)}${T.glasses}</g>
    ${P.over}</svg>`;
}
