# RAW FILES — series production plan (The Sisodia Files)

Ten episodes on the people of India's Research and Analysis Wing (R&AW). Source plan from the channel owner:
`SERIES_PLAN_v0.md`. Per-episode research dossiers (Sonnet research agents, 2026-09-30): `research/epNN_*.md`.

## Editorial line (channel owner, 2026-09-30)
- **Point of view: firmly pro-India.** Indian sources — officers' memoirs and books, Indian newspapers and
  magazines, Government of India / PIB / armed-forces publications — are cited without hesitation.
- Where history is contested (e.g. Sikkim 1975), India's account leads; the counter-framing gets one clause,
  not a paragraph. Claims resting on a single derivative source are labelled ("reportedly", "according to").
- No operational tradecraft (methods, how-to). Organisational and strategic level only.
- Standing channel rules still apply: J&K and Ladakh shown entirely as India on every map; Pakistan-administered
  Kashmir is "Illegally Occupied Pakistani Kashmir"; licence-clean images only; pronunciation audit before voicing.

## Format (every episode)
Cold open (60–90 s, a specific sourced scene) → who this person was → the contribution that changed outcomes →
how it was done at the organisational level → immediate and long-term impact → why the public barely knows the
name → closing (mirrors the cold open). Scripts restructured to `../SCRIPT_RULES.md` and pass `script_lint.py`.

## Visual upgrades for the series (in `_template/`)
- **Dossier portraits** — a placement with `"person": {name, role, years}` renders a framed portrait with a
  name / role / years panel (used whenever a person is introduced).
- **Quote cards** — a placement with `"quote": {text, by}` renders a full-screen attributed quote, with the
  speaker's photo as an inset when one exists.
- **Photo pan** — full-frame photos now drift slowly left or right as well as pushing in.
- Title card and branding read "THE SISODIA FILES · RAW FILES · EPISODE NN"; releases go to
  `../releases/RAWNN_<Title>/`; YouTube titles end "| RAW Files, Episode N".
- Music bed and 1.2× narration pace from File 06.

## Episodes
| # | Folder | Subject | Status |
|---|---|---|---|
| 1 | `ep01-kao` | R.N. Kao — the founder | **done** v1.0 (`raw01-v1.0`, released; upload pending) |
| 2 | `ep02-nair` | K. Sankaran Nair — the 1971 backbone | script + photos + voice done; rendering (`raw02-v1.0` on finish) |
| 3 | `ep03-kaushik` | Ravindra Kaushik — "Black Tiger" | script, photos, config done; **voicing stalled** (re-run `tts.py`), then photos → render |
| 4 | `ep04-raman` | B. Raman — counter-terrorism chief and chronicler | script + lint done; photos, visuals, voice next |
| 5 | `ep05-suntook` | N.F. Suntook — the chief who kept RAW alive | script + lint done; photos, visuals, voice next |
| 6 | `ep06-sikkim` | G.B.S. Sidhu and the Sikkim merger | script + lint done; photos, visuals, voice next |
| 7 | `ep07-cactus` | A.K. Verma — Operation Cactus | script + lint done; photos, visuals, voice next |
| 8 | `ep08-sood` | Vikram Sood — the moderniser | dossier only; script next |
| 9 | `ep09-dulat` | A.S. Dulat — the chief during IC-814 | dossier only; script next |
| 10 | `ep10-finale` | Rabinder Singh (Khanna as epilogue) | dossier only; script next |

## Per-episode workflow
1. `cp -cR _template epNN-name` (clone; node_modules and .venv are copy-on-write).
2. Write `research.md` from the dossier; restructure `script.md`; `script_lint.py` must pass.
3. Pronunciation audit + audition clips; `config/places.json`, `visuals.json`, `photo_plan.json`.
4. Download photos with `pipeline/commons.py dl`; voice with `tts.py`; `build_photos.py`.
5. Stills check → full render → master → audit → teaser → package → commit + tag `rawNN-v1.0`.

## Build notes (learned on Episodes 1–3)
- After cloning `_template`, rename the thumbnail compositions in `src/Root.tsx` (`sed -i '' 's/Thumb06/Thumb0N/g'`) — a stale name makes every render fail with "undefined passed to component".
- `pipeline/speech_text.py` spells digits as English words; native-script names' possessives use the Latin respelling. Both are in `tts.py`.
- Renders need `--timeout=240000` (in `package.json`) — Google Fonts fetches occasionally exceed 30 s.
- `render_episode.sh epNN-name rawNN` runs the whole chain (render → master → audit → teaser → package → commit/tag/push) and deletes raw intermediates.
- Config files with Devanagari: run Python with `PYTHONUTF8=1`.
