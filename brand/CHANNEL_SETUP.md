# The Sisodia Files — YouTube channel setup

Paste these into **YouTube Studio → Customisation**. All image files are in this folder.

| Field | Use |
|---|---|
| Banner image | `Banner.png` (2560x1440, 5.6 MB). If upload complains about size, use `Banner.jpg` (0.8 MB). All text sits inside the 1546x423 safe area, so it shows on TV, desktop and mobile. |
| Picture | `Avatar.png` (800x800 PNG) — the monogram fits inside YouTube's circle crop |
| Name | The Sisodia Files |
| Handle | @SisodiaFiles |
| Video watermark | `Watermark.png` (150x150, transparent PNG) — Display time: **End of video** (it becomes a subscribe button; doesn't cover the opening) |
| Thumbnail (File 01) | `Thumbnail.png` (1280x720) |

## Description

```
The Sisodia Files — investigative documentaries on terror, security and geopolitics in South Asia.

Each file takes one hard story and rebuilds it from the record: court testimony, government briefings, academic research and verified reporting. Code-drawn maps, clear timelines, and sources listed for every claim. Allegations are labelled as allegations.

File 01 — Inside the Terror Factory: how Lashkar-e-Taiba trains its recruits, from Muridke to Operation Sindoor.

New files, no noise. Subscribe and turn on notifications so you don't miss the next one.

Presented by Shrawin Sisodia.
```

## Links (Customisation → Links)
- Instagram — `https://instagram.com/SisodiaFiles` (claim the same handle first)
- X — `https://x.com/SisodiaFiles` (optional)
- Personal — `https://www.youtube.com/@ShrawinSisodia` (reserve this handle too, even if unused)

## Contact info
Use a dedicated business address (e.g. a new `sisodiafiles` inbox) rather than a personal one — it is shown publicly in the About section.

## Channel keywords (Settings → Channel → Basic info)
```
The Sisodia Files, documentary, investigative documentary, geopolitics, national security, terrorism explained, India Pakistan, Operation Sindoor, 26/11, South Asia, defence, counter terrorism, explainer
```

## Channel defaults (Settings → Upload defaults)
- Category: **Education** (or News & Politics)
- Language: English · Captions certification: none
- Tags: `The Sisodia Files, documentary, geopolitics`
- Description footer: `Sources for every claim are in the description. @SisodiaFiles`

## Per-video
Every render writes `terror-factory/output/youtube_upload.md` (title, description with chapter
timestamps, sources, image credits, tags, pinned comment, Instagram caption). Upload
`output/captions.srt` as English subtitles.

Regenerate brand images: `cd terror-factory && npm run brand`.
