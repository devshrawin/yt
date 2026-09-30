#!/usr/bin/env python3
"""Post-render audit of output/final_video.mp4.

Checks: container/stream format, duration vs timeline, loudness (EBU R128), black
frames, frozen frames, long silences, caption file sanity. Also writes contact sheets
(one frame every N seconds) to output/audit/ for visual review.
Usage: audit.py [--every 20]
"""
import json
import re
import subprocess
import sys

from timeline import build
from tts_lib import ROOT

VIDEO = ROOT / "output" / "final_video.mp4"
OUT = ROOT / "output" / "audit"


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


def ff_filter(vf=None, af=None):
    args = ["ffmpeg", "-hide_banner", "-nostats", "-i", str(VIDEO)]
    if vf:
        args += ["-vf", vf, "-an"]
    if af:
        args += ["-af", af, "-vn"]
    return run(args + ["-f", "null", "-"]).stderr


def main():
    every = int(sys.argv[sys.argv.index("--every") + 1]) if "--every" in sys.argv else 20
    OUT.mkdir(parents=True, exist_ok=True)
    blocks, fps = build()
    expected = sum(b["frames"] for b in blocks) / fps
    issues = []

    info = json.loads(run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams",
                           "-show_format", str(VIDEO)]).stdout)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    dur = float(info["format"]["duration"])
    size_mb = int(info["format"]["size"]) / 1e6
    print(f"video : {v['codec_name']} {v.get('profile')} {v['width']}x{v['height']} {v['r_frame_rate']} "
          f"{v.get('pix_fmt')}  {int(v.get('bit_rate', 0)) / 1e6:.1f} Mb/s")
    print(f"audio : {a['codec_name']} {a['sample_rate']} Hz {a['channels']}ch" if a else "audio : MISSING")
    print(f"length: {dur:.2f}s (timeline {expected:.2f}s)  size {size_mb:.0f} MB")
    if (v["width"], v["height"]) != (1920, 1080):
        issues.append("resolution is not 1920x1080")
    if v["r_frame_rate"] != "30/1":
        issues.append(f"fps {v['r_frame_rate']}")
    if v["codec_name"] != "h264":
        issues.append("codec is not h264")
    if not a:
        issues.append("no audio stream")
    if abs(dur - expected) > 0.5:
        issues.append(f"duration off by {dur - expected:+.2f}s")

    loud = ff_filter(af="ebur128=peak=true")
    m = re.search(r"Integrated loudness:\s+I:\s+(-?[\d.]+) LUFS.*?True peak:\s+Peak:\s+(-?[\d.]+) dBFS", loud, re.S)
    if m:
        lufs, peak = float(m.group(1)), float(m.group(2))
        print(f"loud  : {lufs:.1f} LUFS integrated, true peak {peak:.1f} dBFS (YouTube reference ≈ -14 LUFS)")
        if lufs < -20 or lufs > -12:
            issues.append(f"loudness {lufs:.1f} LUFS outside -20..-12")
        if peak > -0.5:
            issues.append(f"true peak {peak:.1f} dBFS (clipping risk)")

    blacks = re.findall(r"black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)",
                        ff_filter(vf="blackdetect=d=0.7:pix_th=0.06"))
    print(f"black : {len(blacks)} black stretches ≥0.7s")
    for s, e, d in blacks:
        print(f"        {float(s):8.2f}–{float(e):8.2f}s ({float(d):.1f}s)")
        if float(d) > 2.5:
            issues.append(f"long black at {float(s):.1f}s ({float(d):.1f}s)")

    freezes = re.findall(r"freeze_start: ([\d.]+).*?freeze_duration: ([\d.]+)",
                         ff_filter(vf="freezedetect=n=0.0008:d=6"), re.S)
    print(f"freeze: {len(freezes)} static stretches ≥6s")
    for s, d in freezes:
        print(f"        at {float(s):8.2f}s for {float(d):.1f}s")

    sil = re.findall(r"silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)",
                     ff_filter(af="silencedetect=noise=-50dB:d=2.5"))
    print(f"silent: {len(sil)} stretches ≥2.5s below -50 dB")
    for s, d in sil:
        print(f"        at {float(s):8.2f}s for {float(d):.1f}s")
        issues.append(f"silence at {float(s):.1f}s ({float(d):.1f}s)")

    srt = (ROOT / "output" / "captions.srt").read_text()
    cues = re.findall(r"(\d\d):(\d\d):(\d\d),(\d{3}) --> (\d\d):(\d\d):(\d\d),(\d{3})", srt)
    to_s = lambda h, m_, s, ms: int(h) * 3600 + int(m_) * 60 + int(s) + int(ms) / 1000
    times = [(to_s(*c[:4]), to_s(*c[4:])) for c in cues]
    overlaps = sum(1 for (a1, b1), (a2, _) in zip(times, times[1:]) if a2 < b1 - 0.01)
    backwards = sum(1 for a1, b1 in times if b1 <= a1)
    print(f"srt   : {len(times)} cues, last ends {times[-1][1]:.1f}s, {overlaps} overlaps, {backwards} zero/neg")
    if overlaps or backwards or times[-1][1] > dur:
        issues.append("caption timing problems")

    # contact sheets: frames every `every` seconds, 4x4 tiles per sheet
    run(["ffmpeg", "-v", "error", "-y", "-i", str(VIDEO), "-vf",
         f"fps=1/{every},scale=480:-1,tile=4x4",
         str(OUT / "sheet_%02d.jpg")])
    sheets = sorted(OUT.glob("sheet_*.jpg"))
    print(f"sheets: {len(sheets)} contact sheets in {OUT.relative_to(ROOT)} "
          f"(4x4 tiles, 1 frame / {every}s; tile k of sheet n = {every}*(16*(n-1)+k-0.5)s)")

    print("\nRESULT:", "PASS" if not issues else "ISSUES")
    for i in issues:
        print("  -", i)


if __name__ == "__main__":
    main()
