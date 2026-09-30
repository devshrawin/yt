#!/usr/bin/env python3
"""Stage 2a: render the cold open in several voices so a narrator can be picked.

Output: audio/samples/<voice>.mp3
"""
import json

from tts_lib import ROOT, load_config, synth, probe_duration


def main():
    cfg = load_config()
    seg = json.loads((ROOT / "segments.json").read_text())["segments"][0]
    text = "\n\n".join(p["text"] for p in seg["paragraphs"])
    out_dir = ROOT / "audio" / "samples"
    for voice in cfg["sample_voices"]:
        mp3 = out_dir / f"{voice}.mp3"
        synth(text, voice, cfg["rate"], cfg["pitch"], mp3)
        print(f"{voice:28} {probe_duration(mp3):6.1f}s  {mp3.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
