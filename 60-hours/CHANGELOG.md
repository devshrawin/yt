# Changelog — 60 Hours (The Sisodia Files · File 02)

Every render is kept locally in `output/versions/60-hours_v<X.Y>.mp4` (never committed);
the pipeline state for each version is tagged `file02-v<X.Y>` in git.

## v1.2 — review fixes
- Control room: "voice identified" cards moved under the TV wall (the third card ran into the
  captions and the lower third)
- Story clock shows "--:--" at a flashback reset until a time is spoken (was "00:00")

## v1.1 — restructured to the new script playbook (`../SCRIPT_RULES.md`)
- Script rebuilt from the draft (kept as `script_draft_v0.md`): hook → paradox ("who was really
  holding Mumbai?") → stakes; sections by function (The Boat No One Saw, Ten Minutes, The Voice
  in Karachi, The One Who Lived, The Fire, The Wait, The Price, The Last Man, The Cost); Kasab as
  the human through-line; no catalogue sentences; `[PAUSE]` beats; ending mirrors the opening.
  `script_lint.py`: draft 12 errors / 12 warnings → 0 / 0
- Story clock understands "in the morning / in the evening"; "The 28th" matched
- 11.7 min (draft 12.5 min)

## v1.0 — first full render (original draft; kept unmastered as `60-hours_v1.0_draft_unmastered.mp4`)
- 12.5 min, 1920x1080 30 fps, narration en-US-BrianMultilingualNeural with native-script
  pronunciation for 28 new names (Chhatrapati Shivaji Terminus, Karkare, Salaskar, Kamte,
  Girgaum Chowpatty, Macchimar Nagar, Sajid Mir, Abu Al Kama, …)
- New: South Mumbai city basemap (OpenStreetMap), story clock that ticks to every spoken
  time with an "HOUR n / 60" bar, siege states (pins turn grey "SIEGE OVER", green
  "SECURED"), Karachi → Mumbai voyage route, Karachi control-room split screen with the
  FBI photo of Sajid Mir, respectful casualty-numbers card
- Licensed photos: Nichalp (CC BY-SA 3.0), Vinukumar Ranganathan, Mike from Vancouver
  (CC BY-SA 2.0), IAshishTripathi (CC BY-SA 4.0), FBI (public domain)
- Instagram teaser v1.0 (8 beats, ~47 s)
