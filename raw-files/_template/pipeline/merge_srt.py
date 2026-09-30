#!/usr/bin/env python3
"""Stage 4b: merge per-segment caption lines into output/captions.srt, offset to each
segment's start in the final video (title card included)."""
from timeline import build
from tts import srt_time
from tts_lib import ROOT


def main():
    blocks, fps = build()
    out, n = [], 0
    for b in blocks:
        if b["kind"] != "segment":
            continue
        off = b["start"] / fps * 1000
        for line in b["segment"].get("caption_lines", []):
            n += 1
            out.append(f"{n}\n{srt_time(line['startMs'] + off)} --> {srt_time(line['endMs'] + off)}\n{line['text']}\n")
    path = ROOT / "output" / "captions.srt"
    path.parent.mkdir(exist_ok=True)
    path.write_text("\n".join(out))
    print(f"{n} captions -> {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
