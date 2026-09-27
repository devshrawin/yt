# Changelog — Inside the Terror Factory

Every render is kept locally in `output/versions/terror-factory_v<X.Y>.mp4` (never
committed); the pipeline state for each version is tagged `v<X.Y>` in git. v1.0 = first full render; each audit / change round bumps
the minor version.

## v1.3 — The Sisodia Files branding
- Title card carries "THE SISODIA FILES · FILE 01"
- End card: SF monogram, "The Sisodia Files", @SisodiaFiles, "Subscribe — the next file opens soon."
- Upload kit (`output/youtube_upload.md`): title, chapters from the render timeline, sources,
  licensed image credits, tags, pinned comment, Instagram caption
- Channel brand pack in `../brand/` (banner, avatar, watermark, File 01 thumbnail, setup guide)

## Teaser (Instagram Reel, 1080x1920)
- teaser v1.2 — CTA "Full documentary · @SisodiaFiles"; closing line names the channel
- teaser v1.1 — captions wrap instead of running off-screen on long lines
- teaser v1.0 — 63.6 s, 10 beats (hook → camps → each training phase → proven vs alleged →
  Op Sindoor → CTA), live main-video scenes in a 16:9 window, big word-highlight captions,
  -14 LUFS; built from `config/teaser.json` with the same voice and pronunciation guide

## v1.2 — narration & pronunciation
- Narrator switched to en-US-BrianMultilingualNeural (chosen from voice samples)
- Pronunciation guide: Hindi/Urdu names (Markaz-e-Taiba, Muridke, Daura-e-Aam, Bahawalpur,
  Lashkar-e-Taiba, …) are fed to the voice in Devanagari (`config/pronunciations_native.json`)
  for native phonetics; acronyms read as letters (L-E-T, J-E-M, I-S-I, C-T-C, I-E-D);
  captions and on-screen text keep the English spelling
- Pakistan / Kashmir / Lahore / Mumbai use Indian pronunciation
- Cue matching handles multi-word tokens (Op Sindoor briefing photo syncs to "Misri" again)
- Runtime 11:35 (was 12:00) — the new voice paces faster

## v1.1 — audit fixes
- Headline and map card text always shows complete sentences (no mid-sentence "…" cuts;
  meaning-changing truncations removed, e.g. Segment 8)
- Map segments 2, 4, 6: per-paragraph fact panel on the right, map framed left — no more
  45–80 s near-static map shots
- Chapter tag no longer overlaps map labels (Segment 6)
- Phase strip highlights the phase a segment introduces (Segment 7 now "Ribat", was "Khaas")
- Mastering stage: loudness normalised to -14 LUFS / -1.5 dBTP (was -17.9 LUFS),
  broadcast-range yuv420p BT.709 (was full-range yuvj420p), +faststart

## v1.0 — first full render
- 12:00, 1920x1080 30 fps H.264, narration en-US-ChristopherNeural
- India-POV maps, "Illegally Occupied Pakistani Kashmir" naming, licensed photos
  (GoI GODL-India briefing images, VOA public domain, CC BY-SA), film grain
- Raw Remotion output, not mastered
