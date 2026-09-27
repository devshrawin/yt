#!/usr/bin/env python3
"""Stage 4c: master the raw Remotion render for YouTube.

output/render_raw.mp4 -> output/final_video.mp4
- two-pass EBU R128 loudness normalisation to -14 LUFS, true peak -1.5 dBTP
- video re-encoded to broadcast-range yuv420p (Remotion's JPEG frames give full-range
  yuvj420p, which some players display with crushed/washed contrast), BT.709 tagged
- +faststart so the file streams before it fully downloads
"""
import json
import re
import subprocess

from tts_lib import ROOT

RAW = ROOT / "output" / "render_raw.mp4"
FINAL = ROOT / "output" / "final_video.mp4"
TARGET = "I=-14:TP=-1.5:LRA=11"


def main():
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
        "-movflags", "+faststart", str(FINAL),
    ], check=True)
    print(f"mastered -> {FINAL.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
