// Computer-player timing: the pauses between moves, so people can follow along.
//
// Every pause goes through one timer. cancelAll() (called on New game or a
// new hand) makes any pause still waiting do nothing when it ends, so an old
// game's computer moves can never land in a new game.

export function createTimer({
  speed = () => 1,                                  // multiplier: 1 = normal, bigger = slower
  schedule = (fn, ms) => setTimeout(fn, ms)         // the simulator swaps in a pretend clock
} = {}) {
  let round = 0;
  return {
    // Run fn after `ms` milliseconds (scaled by speed), unless cancelled first.
    later(fn, ms) {
      const mine = round;
      schedule(() => { if (mine === round) fn(); }, ms * speed());
    },
    cancelAll() { round++; }
  };
}
