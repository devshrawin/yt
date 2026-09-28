#!/usr/bin/env python3
"""Generate an original, royalty-free dark ambient bed -> public/music/music.mp3.

Pure ffmpeg synthesis: detuned low drones in A minor with slow swells, a filtered
noise "air" layer, and a soft pulse. Every LFO period divides LOOP_S, so the file
loops seamlessly under narration. Drop your own ./assets/music.mp3 to override.
"""
import shutil
import subprocess

from tts_lib import ROOT

LOOP_S = 240
OUT = ROOT / "public" / "music" / "music.mp3"
USER_TRACK = ROOT / "assets" / "music.mp3"

PI = "PI"


def lfo(period_s, phase=0.0, depth=0.5, base=0.5):
    # 0..1 slow swell; period divides LOOP_S -> seamless loop
    return f"({base}+{depth}*sin(2*{PI}*t/{period_s}+{phase}))"


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if USER_TRACK.exists():
        shutil.copy(USER_TRACK, OUT)
        print(f"using supplied {USER_TRACK.relative_to(ROOT)}")
        return

    # A minor drone: A1, E2, A2, C3, E3 with slight detune pairs for beating
    voices = [
        (55.00, 0.34, lfo(60, 0.0)),
        (55.18, 0.22, lfo(80, 1.1)),
        (82.41, 0.20, lfo(48, 2.0)),
        (110.0, 0.14, lfo(40, 0.7)),
        (110.3, 0.10, lfo(120, 2.9)),
        (130.81, 0.07, lfo(30, 1.7, 0.5, 0.5)),   # minor third, drifts in/out
        (164.81, 0.05, lfo(24, 0.3, 0.5, 0.5)),
    ]
    drone = "+".join(f"{amp}*{env}*sin(2*{PI}*{f}*t)" for f, amp, env in voices)
    # soft low heartbeat-ish pulse every 2s (period divides loop)
    pulse = f"0.18*exp(-6*mod(t,2))*sin(2*{PI}*48*t)*{lfo(120, 0.0, 0.5, 0.5)}"
    expr = f"0.5*({drone}+{pulse})"

    fc = (
        f"aevalsrc='{expr}':s=48000:d={LOOP_S}[d];"
        f"anoisesrc=color=brown:a=0.05:d={LOOP_S}:r=48000,lowpass=f=500,highpass=f=60,"
        f"volume='0.6+0.4*sin(2*PI*t/{LOOP_S // 4})':eval=frame[n];"
        f"[d][n]amix=inputs=2:normalize=0,"
        f"aecho=0.8:0.7:120|340|780:0.35|0.25|0.18,"
        f"lowpass=f=2200,"
        f"pan=stereo|c0=c0|c1=c0,"
        f"loudnorm=I=-20:TP=-2:LRA=7[out]"
    )
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-filter_complex", fc, "-map", "[out]",
                    "-c:a", "libmp3lame", "-b:a", "192k", str(OUT)], check=True)
    print(f"generated {OUT.relative_to(ROOT)} ({LOOP_S}s loop)")


if __name__ == "__main__":
    main()
