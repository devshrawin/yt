#!/usr/bin/env python3
"""Stage 4c: master the raw Remotion render for YouTube.

output/render_raw.mp4 -> output/versions/terror-factory_v<version>.mp4
(version from config/video.json; output/final_video.mp4 is a hard link to the latest)
- two-pass EBU R128 loudness normalisation to -14 LUFS, true peak -1.5 dBTP
- video re-encoded to broadcast-range yuv420p (Remotion's JPEG frames give full-range
  yuvj420p, which some players display with crushed/washed contrast), BT.709 tagged
- +faststart so the file streams before it fully downloads
"""
import json
import re
import subprocess

import os

from tts_lib import ROOT, load_config

RAW = ROOT / "output" / "render_raw.mp4"
FINAL = ROOT / "output" / "final_video.mp4"
VERSIONS = ROOT / "output" / "versions"
TARGET = "I=-14:TP=-1.5:LRA=11"


def main():
    global RAW, FINAL
    import sys
    if "--teaser" in sys.argv:  # Instagram teaser: own raw file, own version counter
        RAW = ROOT / "output" / "teaser_raw.mp4"
        FINAL = ROOT / "output" / "teaser.mp4"
        version = json.loads((ROOT / "config" / "teaser.json").read_text())["version"]
        out = VERSIONS / f"{ROOT.name}_teaser_v{version}.mp4"
    else:
        version = load_config()["version"]
        out = VERSIONS / f"{ROOT.name}_v{version}.mp4"
    if out.exists():
        raise SystemExit(f"{out.name} already exists — bump \"version\" first (config/video.json or config/teaser.json)")
    VERSIONS.mkdir(parents=True, exist_ok=True)
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(RAW), "-vn", "-af",
                            f"loudnorm={TARGET}:print_format=json", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
    m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", probe).group(0))
    af = (f"loudnorm={TARGET}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    print(f"measured {m['input_i']} LUFS / {m['input_tp']} dBTP -> -14 LUFS")
    subprocess.run([
        "ffmpeg", "-v", "error", "-stats", "-y", "-i", str(RAW),
        "-vf", "scale=in_range=full:out_range=tv,format=yuv420p",
        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high", "-level", "4.1",
        "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "256k",
        "-movflags", "+faststart", str(out),
    ], check=True)
    if FINAL.exists():
        FINAL.unlink()
    os.link(out, FINAL)
    print(f"mastered v{version} -> {out.relative_to(ROOT)} ({FINAL.name} -> latest)")


if __name__ == "__main__":
    main()
