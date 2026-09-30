#!/usr/bin/env python3
"""Package everything needed to publish one file into a single upload folder.

  ../releases/File<NN>_<Title>/
    README.md                 step-by-step: what goes in which field
    youtube/                  video, thumbnail, captions, title/description/tags/pinned comment
    instagram/                reel, cover image, caption
    channel/                  banner, avatar, watermark + channel setup guide

Videos are hard-linked from output/versions/ (no extra disk space). Uses the current
version numbers in config/video.json and config/teaser.json. Run after every render.
"""
import json
import os
import re
import shutil
import subprocess

from timeline import build
from tts_lib import ROOT, load_config
from youtube_meta import build_meta

# channel root = nearest ancestor holding brand/ (projects may sit one level deeper, e.g. raw-files/ep01)
CHANNEL = next(p for p in ROOT.parents if (p / "brand").is_dir())
BRAND = CHANNEL / "brand"


def link(src, dst):
    if dst.exists():
        dst.unlink()
    try:
        os.link(src, dst)
    except OSError:
        shutil.copy2(src, dst)


def main():
    cfg = load_config()
    m = build_meta()
    teaser_cfg = json.loads((ROOT / "config" / "teaser.json").read_text())
    file_no = cfg.get("file_number", "01")
    tag = cfg.get("release_tag", f"File{file_no}")
    slug = re.sub(r"[^A-Za-z0-9]+", "-", m["title_case"]).strip("-")
    out = CHANNEL / "releases" / f"{tag}_{slug}"
    yt, ig, ch = out / "youtube", out / "instagram", out / "channel"
    for d in (yt, ig, ch):
        d.mkdir(parents=True, exist_ok=True)
    for stale in [*yt.glob("*.mp4"), *ig.glob("*.mp4")]:  # only the current version belongs here
        stale.unlink()

    main_video = ROOT / "output" / "versions" / f"{ROOT.name}_v{cfg['version']}.mp4"
    teaser_video = ROOT / "output" / "versions" / f"{ROOT.name}_teaser_v{teaser_cfg['version']}.mp4"
    for v in (main_video, teaser_video):
        if not v.exists():
            raise SystemExit(f"missing {v.name} — render and master it first")

    video_name = f"{slug}_TheSisodiaFiles_{tag}_v{cfg['version']}.mp4"
    reel_name = f"{slug}_Reel_v{teaser_cfg['version']}.mp4"
    link(main_video, yt / video_name)
    # per-video thumbnail (config/youtube.json "thumbnail"), rendered fresh
    # thumbnail A (default) + B for YouTube's thumbnail A/B test, when the project defines them
    comps = subprocess.run(["npx", "remotion", "compositions", "src/index.ts", "-q"], cwd=ROOT, capture_output=True, text=True).stdout
    for suffix, out_name in (("A", "thumbnail.png"), ("B", "thumbnail_B.png")):
        comp = f"Thumb{file_no}{suffix}"
        if comp not in comps:
            comp = "Thumbnail" if suffix == "A" else None
        if comp:
            subprocess.run(["npx", "remotion", "still", "src/index.ts", comp, str(yt / out_name),
                            "--image-format=png", "--log=error"], cwd=ROOT, check=True)
    shutil.copy2(ROOT / "output" / "captions.srt", yt / "captions_en.srt")
    (yt / "title.txt").write_text(m["title"] + "\n")
    (yt / "description.txt").write_text(m["description"] + "\n")
    (yt / "tags.txt").write_text(", ".join(m["tags"]) + "\n")
    (yt / "pinned_comment.txt").write_text(m["pinned"] + "\n")

    link(teaser_video, ig / reel_name)
    (ig / "caption.txt").write_text(m["instagram"] + "\n")
    # cover: the teaser's title beat
    tb = json.loads((ROOT / "teaser_build.json").read_text())
    cover_frame = round(tb["paragraph_starts"][-1] / 1000 * cfg["fps"]) + 75
    subprocess.run(["npx", "remotion", "still", "src/index.ts", "Teaser", str(ig / "cover.jpg"),
                    f"--frame={cover_frame}", "--image-format=jpeg", "--jpeg-quality=92", "--log=error"],
                   cwd=ROOT, check=True)

    for f in ("Banner.png", "Banner.jpg", "Avatar.png", "Watermark.png", "CHANNEL_SETUP.md"):
        if (BRAND / f).exists():
            shutil.copy2(BRAND / f, ch / f)

    blocks, fps = build()
    end = next(b for b in blocks if b["kind"] == "end")
    end_len = end["frames"] / fps
    dur = sum(b["frames"] for b in blocks) / fps
    mb = lambda p: f"{p.stat().st_size / 1e6:.0f} MB"
    chapters = "\n".join(f"    {t}" for t in m["description"].split("CHAPTERS\n", 1)[1].split("\n\n", 1)[0].splitlines())

    (out / "README.md").write_text(f"""# File {file_no} — {m['title_case']} · upload guide

Everything in this folder is final (main video v{cfg['version']}, reel v{teaser_cfg['version']}).
Channel: {cfg.get('channel_name', '')} ({cfg.get('channel_handle', '')})

## 1 · YouTube (Studio → Create → Upload videos)

| Step | Field | Use |
|---|---|---|
| 1 | Upload | `youtube/{video_name}` ({mb(yt / video_name)}, {int(dur // 60)}:{int(dur % 60):02d}, 1080p30) |
| 2 | Title | paste `youtube/title.txt` ({len(m['title'])}/100) |
| 3 | Description | paste `youtube/description.txt` — includes chapters, sources, image credits (the credits are required by the image licences; keep them) |
| 4 | Thumbnail | `youtube/thumbnail.png` (1280x720) |
| 5 | Playlist | create **"The Sisodia Files"** and add it |
| 6 | Audience | **No, it's not made for kids** |
| 7 | Age restriction | No (the video has no graphic imagery; if YouTube applies one later, you can appeal) |
| 8 | Show more → Paid promotion | No |
| 9 | Show more → Altered content | **No** — the narrator is a synthetic voice, but nothing depicts a real person saying or doing something they didn't; YouTube only requires "Yes" for realistic altered depictions |
| 10 | Show more → Tags | paste `youtube/tags.txt` |
| 11 | Show more → Language | English · Caption certification: none |
| 12 | Show more → Category | Education (or News & Politics) |
| 13 | Show more → Comments | On; sort by Top |
| 14 | Video elements → Subtitles | Upload file → "With timing" → `youtube/captions_en.srt` |
| 15 | Video elements → End screen | The branded end card is the last {end_len:.0f} s. Add **Subscribe** (place it over the right-hand logo column) and, once File 02 exists, a **Video** element |
| 16 | Video elements → Cards | optional: none yet |
| 17 | Checks | wait for the copyright check to finish (all images are licensed; music is original) |
| 18 | Visibility | Schedule or Public. Premiere is a good option for a first file |
| 19 | After publishing | post `youtube/pinned_comment.txt` as a comment and **pin** it |

Chapters (already in the description — YouTube builds them automatically):
{chapters}

## 2 · Instagram Reel

| Step | Use |
|---|---|
| 1 | New → Reel → `instagram/{reel_name}` ({mb(ig / reel_name)}, {tb['duration_seconds']:.0f} s, 1080x1920) — music is already in the video; don't add a track |
| 2 | Cover → Add from camera roll → `instagram/cover.jpg` |
| 3 | Caption → paste `instagram/caption.txt` |
| 4 | Share to Facebook: optional. Post the same Reel as a **YouTube Short** too (Shorts accept up to 3 min) with the title "{m['title_case']} — Teaser" and a link to the full video in the description |
| 5 | After the YouTube video is live: put its link in your Instagram bio |

## 3 · Channel (one-time — YouTube Studio → Customisation)

Files in `channel/`; full field-by-field text in `channel/CHANNEL_SETUP.md`.
Banner `Banner.png` (or `Banner.jpg` if the upload rejects the size) · Picture `Avatar.png` ·
Watermark `Watermark.png` → Display time **End of video**.
""")
    print(f"-> {out.relative_to(CHANNEL)}")
    for p in sorted(out.rglob("*")):
        if p.is_file():
            print(f"   {str(p.relative_to(out)):60} {p.stat().st_size / 1e6:8.1f} MB")


if __name__ == "__main__":
    main()
