#!/bin/sh
# Plays many computer-only games to check for errors and compare strategies.
# Uses the JavaScript engine built into macOS, so nothing needs installing.
# Usage: tools/simulate.sh [--games 300] [--us medium] [--them medium] [--render] [--compare FILE] [--save FILE]
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
if [ ! -x "$JSC" ]; then
  echo "Can't find macOS's built-in JavaScript engine. Open tools/simulate.html in a browser instead."
  exit 1
fi
cd "$(dirname "$0")/.." || exit 1
exec "$JSC" -m tools/simulate.js -- "$@"
