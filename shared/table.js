// Table layout: seats with avatars, the center play area, dealer tag,
// speech bubbles and the turn highlight.
//
// Four seats: partner across the top, opponents left and right, you at the bottom.
// Two seats (2-player games): one opponent across the top, you at the bottom.
//
//          north                       north
//   west  [center]  east              [center]
//          you (south)                 you (south)

// Where each seat's card lands in the center, by seat number (0 = you, then clockwise).
export const SLOTS_4 = ['S', 'W', 'N', 'E'];
export const SLOTS_2 = ['S', 'N'];

// Simple line-drawn faces. Any game can use any face number.
const FACES = {
  0: '<path d="M27 27q5 4 10 0"/>',
  1: '<circle cx="27.5" cy="23" r="3.2"/><circle cx="36.5" cy="23" r="3.2"/><path d="M30.7 23h2.6"/>',
  2: '<path d="M21.5 20c1.5-6 5.5-9 10.5-9s9 3 10.5 9"/><path d="M21.5 20c3-2 6-3 10.5-3"/>',
  3: '<path d="M22.5 26c1 7 5 10 9.5 10s8.5-3 9.5-10"/><path d="M28 30q4 2 8 0"/>'
};
export function avatar(face) {
  return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="32" cy="24" r="11.5"/><path d="M10 62c2-13 10.5-20 22-20s20 7 22 20"/>${FACES[face]}</svg>`;
}

export const bubbleHTML = text => text ? `<div class="bubble">${text}</div>` : '';

// A computer player's seat.
//   face     avatar number          name   label under the avatar
//   north    true for the top seat  turn   highlight: it's their move
//   out      dimmed (sitting out)   dealer show the Dealer tag
//   said     speech bubble text     fan    their hand, from miniFanHTML()
//   tag      small note under the hand
export function seatHTML({ face, name, north = false, turn = false, out = false, dealer = false, said = '', fan = '', tag = '' }) {
  return `<div class="seat ${north ? 'north' : ''}${turn ? ' turn' : ''}${out ? ' out' : ''}">
    ${bubbleHTML(said)}<div class="av">${avatar(face)}${dealer ? '<span class="dchip">Dealer</span>' : ''}</div>
    <div class="nm">${name}</div>
    <div class="fan">${fan}</div>
    <div class="tag">${tag}</div></div>`;
}

// Your own seat, a single line under the table.
export function meHTML({ face = 0, name = 'You', turn = false, dealer = false, tag = '' }) {
  return `<div class="me${turn ? ' turn' : ''}"><span class="dot">${avatar(face)}</span>${name}${dealer ? ' <span class="dl">Dealer</span>' : ''}${tag ? ' <span class="tag">' + tag + '</span>' : ''}</div>`;
}

// The whole table. Leave out west and east for a two-seat layout.
export function tableHTML({ north = '', west, east, center = '', south = '' }) {
  if (west === undefined && east === undefined) {
    return `<main class="table two">
      ${north}
      <div class="mid">${center}</div>
      ${south}
    </main>`;
  }
  return `<main class="table">
      ${north}
      <div class="mid">${west}${center}${east}</div>
      ${south}
    </main>`;
}

// The center play area (dashed outline). `inner` is whatever the game shows there.
export const centerHTML = inner => `<div class="center">${inner}</div>`;

// A card placed in the center in front of a seat. `slot` is 'N', 'S', 'W' or 'E'.
// `enter` slides it in from that side.
export const slotHTML = (slot, inner, enter = false) => `<div class="slot ${slot}${enter ? ' enter' : ''}">${inner}</div>`;
