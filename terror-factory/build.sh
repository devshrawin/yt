#!/usr/bin/env bash
# Re-runnable pipeline. Usage: ./build.sh [setup|all|prep]
#   setup : install ffmpeg / python venv + edge-tts / node deps
#   prep  : stages 1-2 + assets (parse, narration, map, music) — no render
#   all   : prep + render + merged SRT + QA
# Narration is cached per paragraph: editing script.md only re-voices changed text.
set -euo pipefail
cd "$(dirname "$0")"
PY=.venv/bin/python

setup() {
  command -v ffmpeg >/dev/null || brew install ffmpeg
  [ -x "$PY" ] || python3 -m venv .venv
  $PY -m pip install -q --upgrade pip edge-tts
  npm install
}

prep() {
  $PY pipeline/parse_script.py
  $PY pipeline/tts.py
  [ -f public/map/region.json ] || node pipeline/make_map.mjs
  [ -f public/music/music.mp3 ] || $PY pipeline/make_music.py
  $PY pipeline/qa.py --no-thumbs
}

render() {
  mkdir -p output
  npm run stage4:render
  $PY pipeline/master.py
  $PY pipeline/merge_srt.py
  $PY pipeline/teaser_tts.py
  npm run teaser:render
  $PY pipeline/master.py --teaser
  $PY pipeline/qa.py
  $PY pipeline/audit.py
  $PY pipeline/youtube_meta.py
}

case "${1:-all}" in
  setup) setup ;;
  prep) prep ;;
  all) prep; render ;;
  *) echo "usage: $0 [setup|prep|all]"; exit 1 ;;
esac
