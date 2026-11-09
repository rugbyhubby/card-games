// When the simulator runs outside a browser (from the command line), a few
// browser features the games mention don't exist. These stand-ins fill the
// gaps with fixed values so results are the same on every computer.
// In a browser this file does nothing.

const g = globalThis;
if (typeof g.navigator === 'undefined') {
  g.window = g;
  g.navigator = { userAgent: 'card-games-simulator', standalone: false };
  g.screen = { width: 390, height: 844 };
  g.devicePixelRatio = 3;
  g.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  g.addEventListener = () => {};
  if (typeof g.console === 'undefined') {
    const out = (...a) => g.print(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '));
    g.console = { log: out, warn: out, error: out, info: out };
  }
}
