# The Front Man — The Tahawwur Rana Story (The Sisodia Files · File 03)

Built from the File 02 pipeline (`../60-hours`), extended with an India-POV world basemap,
great-circle routes and four story scenes (friendship, verdict, legal/extradition timeline,
case status). Research in `research.md`; no photographs of named living people. All
video-specific choices live in `config/` (places, visuals, photos, teaser, youtube).

## Pipeline (inherited from File 01)

Long-form YouTube documentary (1920×1080, 30 fps, H.264), built as a re-runnable pipeline:
`script.md` → parsed segments → edge-tts narration + captions → Remotion motion graphics → MP4.

## Pipeline

| Stage | Command | Output |
|---|---|---|
| 0 setup | `./build.sh setup` | ffmpeg, `.venv` with edge-tts, node deps |
| 1 parse | `npm run stage1:parse` | `segments.json` (single source of truth) |
| 2a voices | `npm run stage2:samples` | `audio/samples/*.mp3` |
| 2b narration | `npm run stage2:tts` | `public/audio/seg_XX.mp3`, `audio/segment_XX.srt`, word timings in `segments.json` |
| assets | `npm run assets` + `.venv/bin/python pipeline/make_city_map.py` | region map, South Mumbai map (OSM), music |
| preview | `npm run preview` | Remotion Studio |
| 4 render | `npm run stage4:render` | `output/final_video.mp4` |
| 4 captions | `npm run stage4:srt` | `output/captions.srt` (merged, offset to final timeline) |
| 5 QA | `npm run stage5:qa` | duration table, `output/thumbnails/*.png` |

`./build.sh all` runs everything. Narration is cached per paragraph (hash of text + voice),
so editing `script.md` only re-voices the paragraphs that changed.

## Configuration

- `config/video.json` — version, voice (`en-US-BrianMultilingualNeural`), `pronunciation_mode`, rate, card lengths, music level,
  channel name / handle / CTA for the end card (column hidden while empty), `pok_term`.
- `config/locations.json` — researched coordinates for map pins (training camps, the nine
  Op Sindoor sites, Mumbai 26/11 sites for a follow-up video).
- `config/photos.json` — licensed images, where they appear, captions and credits.
- `config/pronunciations.json` / `pronunciations_native.json` — pronunciation guide (Latin
  respellings; native Devanagari forms for Multilingual voices). Audit new scripts with
  `.venv/bin/python pipeline/pronounce_audit.py`, audition with `npm run pronounce`.

## Versions

Every render is kept as `output/versions/terror-factory_v<X.Y>.mp4` (`final_video.mp4` = latest)
and tagged `v<X.Y>` in git (video files are never committed or uploaded). Bump `version`
in `config/video.json` before each render; see [CHANGELOG.md](CHANGELOG.md).

## Editorial / legal rules (published in India)

- **Maps** use Natural Earth's *India point-of-view* boundaries: the whole of Jammu & Kashmir
  and Ladakh (incl. PoK, Gilgit-Baltistan, Aksai Chin) is shown as India.
  `pipeline/make_map.mjs` fails the build if that check ever breaks.
- **Naming**: every reference to Pakistan-administered / "Azad" Kashmir is rendered as
  `pok_term` ("Illegally Occupied Pakistani Kashmir") in narration, captions and labels.
- **Images**: only public-domain / openly licensed files (Government of India GODL-India briefing
  images, VOA public domain, CC BY-SA). Fair-use-only photos (e.g. the Kasab CST photo, CNN's
  Headley photo) are deliberately not used. Credits appear on screen and on the end card.

## Visual system

`src/components/`: `MapScene` + reusable `MapPin`, `HeadlineCard` beats, `LowerThird`,
`CitationCard`, `PhotoCard` (single / before-after), `PhaseStrip` (training pipeline),
`DisputedStamp`, word-highlight `Captions`, `TitleCard` / `EndCard`, film grain.

## Sources / credits

Narration sources are listed at the end of `script.md` and on the end card.
Map data: Natural Earth (public domain). Music: generated procedurally (`pipeline/make_music.py`).
Fonts: Oswald, Inter (Google Fonts, OFL).
