#!/usr/bin/env python3
"""Stage 5: duration QA table + thumbnail candidates.

Compares each segment's narration mp3 length with the Remotion sequence length, flags
>0.5s mismatches, checks the final render if present, and renders 3 thumbnail frames.
Usage: qa.py [--no-thumbs]
"""
import json
import subprocess
import sys

from timeline import build
from tts_lib import ROOT, probe_duration


def main():
    blocks, fps = build()
    print(f"{'segment':8} {'narration':>10} {'sequence':>9} {'diff':>6}  title")
    bad = 0
    for b in blocks:
        if b["kind"] != "segment":
            continue
        s = b["segment"]
        nar = probe_duration(ROOT / "public" / s["audio_file"])
        seq = b["frames"] / fps
        flag = "  <-- MISMATCH" if abs(seq - nar) > 0.5 else ""
        bad += bool(flag)
        print(f"{s['id']:8} {nar:9.2f}s {seq:8.2f}s {seq - nar:+6.2f}  {s['title'][:40]}{flag}")
    total = sum(b["frames"] for b in blocks) / fps
    print(f"timeline total {total:.2f}s ({total / 60:.1f} min), {bad} mismatches")

    final = ROOT / "output" / "final_video.mp4"
    if final.exists():
        info = json.loads(subprocess.run(
            ["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(final)],
            capture_output=True, text=True, check=True).stdout)
        v = next(x for x in info["streams"] if x["codec_type"] == "video")
        print(f"final_video.mp4: {v['codec_name']} {v['width']}x{v['height']} {v['r_frame_rate']} fps, "
              f"{float(info['format']['duration']):.2f}s (expected {total:.2f}s)")

    if "--no-thumbs" in sys.argv:
        return
    segs = {b["segment"]["id"]: b for b in blocks if b["kind"] == "segment"}
    title = next(b for b in blocks if b["kind"] == "title")
    s9 = segs.get("seg_09")
    shots = {"thumb_title": title["start"] + title["frames"] // 2}
    if s9:  # all nine Op Sindoor pins lit
        shots["thumb_op_sindoor"] = s9["start"] + round(s9["segment"]["paragraph_starts"][9] / 1000 * fps) + 60
    s0 = segs["seg_00"]
    shots["thumb_muridke"] = s0["start"] + s0["frames"] // 2
    out = ROOT / "output" / "thumbnails"
    out.mkdir(parents=True, exist_ok=True)
    for name, frame in shots.items():
        subprocess.run(["npx", "remotion", "still", "src/index.ts", "Documentary", str(out / f"{name}.png"),
                        f"--frame={frame}", "--log=error"], cwd=ROOT, check=True)
        print(f"thumbnail {name}.png @ frame {frame}")


if __name__ == "__main__":
    main()
