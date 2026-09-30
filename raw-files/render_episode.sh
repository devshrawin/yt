#!/bin/bash
# Full build for one RAW Files episode: render -> master -> captions -> audit -> QA -> meta -> teaser -> package -> commit/tag/push.
# usage: render_episode.sh ep02-nair raw02 [version]
set -u
EP="$1"; TAG="$2"
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/$EP" || exit 1
P=.venv/bin/python
echo "[$EP] start $(date +%H:%M)"
npm run stage4:render > output/render.log 2>&1 || { echo "[$EP] RENDER FAILED"; tail -5 output/render.log; exit 1; }
$P pipeline/master.py > output/master.log 2>&1 || { echo "[$EP] MASTER FAILED"; tail -5 output/master.log; exit 1; }
tail -1 output/master.log
rm -f output/render_raw.mp4
$P pipeline/merge_srt.py
rm -rf output/audit
$P pipeline/audit.py --every 15 > output/audit.log 2>&1
tail -12 output/audit.log
$P pipeline/qa.py > output/qa.log 2>&1
$P pipeline/youtube_meta.py > /dev/null
npm run teaser:render > output/teaser_render.log 2>&1 && $P pipeline/master.py --teaser | tail -1
rm -f output/teaser_raw.mp4
$P pipeline/package_release.py | head -2
cd "$ROOT/.." || exit 1
VER=$(python3 -c "import json;print(json.load(open('raw-files/$EP/config/video.json'))['version'])")
git add -A "raw-files/$EP" raw-files/_template raw-files/*.sh raw-files/SERIES.md
git commit -qm "RAW Files $EP v$VER

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git tag "${TAG}-v${VER}"
git push -q origin main && git push -q origin "${TAG}-v${VER}"
echo "[$EP] DONE $(date +%H:%M)"
