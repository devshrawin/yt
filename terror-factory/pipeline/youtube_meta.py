#!/usr/bin/env python3
"""YouTube upload kit -> output/youtube_upload.md

Title, description (hook, chapter timestamps computed from the real render timeline,
sources, image/map/music credits as their licences require, disclaimer), tags, a pinned
comment, and the Instagram caption for the teaser. Run after every render.
"""
import json

from timeline import build
from tts_lib import ROOT, load_config


def ts(sec):
    sec = int(sec)
    return f"{sec // 3600}:{sec // 60 % 60:02d}:{sec % 60:02d}" if sec >= 3600 else f"{sec // 60}:{sec % 60:02d}"


SMALL = {"a", "an", "and", "the", "of", "in", "on", "at", "to", "for", "vs", "or"}
KEEP = {"LeT", "JeM", "ISI", "CTC", "Op", "May"}


def title_case(text):
    """Headline case that keeps apostrophes, hyphenated names and acronyms intact."""
    out = []
    for i, w in enumerate(text.split(" ")):
        low = w.lower()
        if w in KEEP:
            out.append(w)
        elif i and low.strip(":,") in SMALL and not out[-1].endswith(":"):
            out.append(low)
        elif "-" in w:  # Daura-e-Sufa, Lashkar-e-Taiba
            parts = low.split("-")
            out.append("-".join(p if p in {"e", "ur"} else p[:1].upper() + p[1:] for p in parts))
        else:
            out.append(low[:1].upper() + low[1:])
    return " ".join(out)


def chapter_name(seg):
    return title_case(seg["title"])


def main():
    cfg = load_config()
    data = json.loads((ROOT / "segments.json").read_text())
    photos = json.loads((ROOT / "config" / "photos.json").read_text())
    blocks, fps = build()
    meta = data["meta"]
    file_no = cfg.get("file_number", "01")
    channel = cfg.get("channel_name", "")
    handle = cfg.get("channel_handle", "")

    chapters = []
    for b in blocks:
        t = b["start"] / fps
        if b["kind"] == "segment":
            name = "Cold Open" if b["segment"]["label"] == "COLD OPEN" else chapter_name(b["segment"])
            chapters.append((t, name))
        elif b["kind"] == "end":
            chapters.append((t, "Sources & Credits"))
    # YouTube: first chapter at 0:00, each >= 10 s
    chapters[0] = (0, chapters[0][1])

    used = {k for p in photos["placements"] for k in p["images"]}
    licence_links = {"CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
                     "GODL-India": "https://data.gov.in/government-open-data-license-india"}
    credits = []
    for k, v in photos["images"].items():
        if k not in used:
            continue
        lic = next((f" (licence: {url})" for name, url in licence_links.items() if name in v["credit"]), "")
        credits.append(f"{v['credit']} — {v['source']}{lic}")
    credits = sorted(set(credits))

    subtitle = meta["subtitle"].replace("Pakistan-Based ", "")
    title = f"{title_case(meta['title'])}: {subtitle} | {channel} {file_no}"
    if len(title) > 100:
        title = f"{title_case(meta['title'])}: {subtitle}"[:100]
    desc = f"""How does Lashkar-e-Taiba turn a recruit into a fighter? Using court testimony from Ajmal Kasab and David Coleman Headley, research from West Point's Combating Terrorism Center and the Counter Extremism Project, and India's Operation Sindoor briefing, File {file_no} of {channel} reconstructs the LeT training pipeline stage by stage — from Muridke to Muzaffarabad, from Daura-e-Sufa to Daura-e-Khaas — and the May 2025 strikes on nine camps.

Every claim in this video is sourced. Allegations are labelled as allegations.

CHAPTERS
""" + "\n".join(f"{ts(t)} {n}" for t, n in chapters) + """

SOURCES
""" + "\n".join(f"{i}. {s}" for i, s in enumerate(data["sources"], 1)) + """

IMAGE CREDITS
""" + "\n".join(credits) + f"""
Maps: Natural Earth (public domain), India point-of-view boundaries. Music: original, generated for this channel.

This is an explanatory documentary based on public court records and published research. It does not provide, and should not be read as, operational or tactical information.

{handle} · Subscribe for the next file.
#OperationSindoor #LashkarETaiba #2611 #MumbaiAttacks #Documentary"""

    tags = ["The Sisodia Files", "Inside the Terror Factory", "Lashkar-e-Taiba", "LeT", "Operation Sindoor",
            "26/11", "Mumbai attacks", "Ajmal Kasab", "David Headley", "Muridke", "Markaz Taiba",
            "Muzaffarabad", "terror training camps", "Pakistan terror camps", "India Pakistan", "counter terrorism",
            "documentary", "geopolitics", "Hafiz Saeed", "Daura-e-Khaas", "Pahalgam attack", "Indian Army",
            "West Point CTC", "national security", "explainer"]
    while len(", ".join(tags)) > 480:
        tags.pop()

    pinned = (f"Sources for every claim are in the description. Which story should {channel} open next? "
              "Drop it below 👇")
    teaser_cfg = json.loads((ROOT / "config" / "teaser.json").read_text())
    insta = (f"26/11 wasn't chaos. It was a curriculum. 🗂️\n\n{title_case(meta['title'])} — how Lashkar-e-Taiba trains "
             f"its recruits, reconstructed from court testimony, and the May 2025 Operation Sindoor strikes.\n\n"
             f"Full documentary on YouTube: {handle}\n\n"
             "#OperationSindoor #2611 #India #Documentary #Geopolitics #NationalSecurity #TheSisodiaFiles")

    out = ROOT / "output" / "youtube_upload.md"
    out.write_text(f"""# YouTube upload kit — {title_case(meta['title'])} (v{cfg['version']})

## Title ({len(title)}/100)
{title}

## Description ({len(desc)}/5000)
```
{desc}
```

## Tags ({len(', '.join(tags))}/500)
```
{', '.join(tags)}
```

## Thumbnail
`../brand/Thumbnail.png` (1280x720)

## Captions
Upload `output/captions.srt` as English subtitles.

## Pinned comment
{pinned}

## Instagram Reel caption (teaser v{teaser_cfg['version']})
```
{insta}
```
""")
    print(f"-> {out.relative_to(ROOT)}  (title {len(title)} chars, {len(chapters)} chapters, description {len(desc)} chars)")


if __name__ == "__main__":
    main()
