"""Python mirror of buildTimeline() in src/data.ts — keep the two in sync."""
import json
import math

from tts_lib import ROOT, load_config


def build():
    cfg = load_config()
    fps = cfg["fps"]
    segs = json.loads((ROOT / "segments.json").read_text())["segments"]
    title = {"kind": "title", "frames": cfg["title_card_seconds"] * fps}
    after = -1
    if cfg.get("title_card_position", "after_cold_open") != "start":
        after = next((i for i, s in enumerate(segs) if s.get("title_card")), -1)
    blocks = [] if after >= 0 else [title]
    for i, s in enumerate(segs):
        blocks.append({"kind": "segment", "segment": s,
                       "frames": max(fps * 2, math.ceil(s.get("duration_seconds", 5) * fps))})
        if i == after:
            blocks.append(title)
    blocks.append({"kind": "end", "frames": cfg["end_card_seconds"] * fps})
    t = 0
    for b in blocks:
        b["start"] = t
        t += b["frames"]
    return blocks, fps
