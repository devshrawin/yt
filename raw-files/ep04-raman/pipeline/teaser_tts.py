#!/usr/bin/env python3
"""Teaser narration: config/teaser.json -> public/audio/teaser.mp3 + teaser_build.json.

Uses the same voice, pronunciation guide and naming rules as the main video (beats are
voiced through tts.build_segment as one pseudo-segment, one paragraph per beat).
Fails if the narration runs past the teaser's max_seconds.
"""
import json

from parse_script import apply_naming
from tts import build_segment
from tts_lib import ROOT, load_config

SRC = ROOT / "config" / "teaser.json"
OUT = ROOT / "teaser_build.json"


def main():
    cfg = load_config()
    teaser = json.loads(SRC.read_text())
    term = cfg.get("pok_term", "")
    seg = json.loads(OUT.read_text()) if OUT.exists() else {}
    seg.update({
        "id": "teaser",
        "index": 99,
        "gap_ms": 350,
        "tail_ms": 600,
        "paragraphs": [{"text": apply_naming(b["text"], term) if term else b["text"]} for b in teaser["beats"]],
    })
    built = build_segment(seg, cfg, force="--force" in __import__("sys").argv, srt_path=ROOT / "audio" / "teaser.srt")
    seg["beats"] = teaser["beats"]
    OUT.write_text(json.dumps(seg, indent=2, ensure_ascii=False))
    dur = seg["duration_seconds"]
    print(f"teaser narration {'built' if built else 'cached'}: {dur:.1f}s, {len(seg['beats'])} beats")
    for b, st in zip(seg["beats"], seg["paragraph_starts"]):
        print(f"  {st / 1000:6.1f}s  {b['headline']}")
    if dur > teaser["max_seconds"] - 1:
        raise SystemExit(f"teaser is {dur:.1f}s — over the {teaser['max_seconds']}s limit; shorten config/teaser.json")


if __name__ == "__main__":
    main()
