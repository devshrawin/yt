# The Sisodia Files — script rules

Every script the channel owner shares is an **initial draft**. Before any voice is generated it is
restructured to these rules, then checked with `pipeline/script_lint.py` (must pass) and
`pipeline/pronounce_audit.py`. Origin: two independent post-mortems of File 01 (*Inside the Terror Factory*).

Role: investigative documentary scriptwriter. Tone: cinematic, forensic, taut, analytical
(Johnny Harris, Wendover, Frontline). Facts only from the draft's sources — restructuring never
invents detail.

## 1 · Narrative architecture

Target flow: **Visceral hook → Core paradox → Micro-narrative escalation → Structural climax → Punchy resolution.**
Not: hook → disclaimer → catalogue → chronological syllabus → briefing dump.

- **Close the thesis gap.** Right after the thesis line, turn curiosity into a burning question —
  the paradox the video will answer. Never drop from the hook into caveats.
- **No syllabus.** Don't walk a process in calendar order ("first 21 days… next 21 days…").
  Frame each stage around its psychological or mechanical *objective* (the isolation filter,
  the monotony test, the desensitisation) — the dates become supporting detail.
- **No third-act rupture.** The climax stays with the people and places already built up.
  If a site, camp or name wasn't part of the story earlier, don't list it at the end.
- **The ending mirrors the beginning.** Resolve the fates of the people or places the hook
  introduced; don't end on a geopolitical press briefing. End on the central metaphor or a
  single open question — never on a sources/credits dump (sources live on screen and in the description).
- **One human through-line.** Follow one person (e.g. "a recruit like Kasab") through the whole
  process so stages become chapters of one arc. At each major stage, one short *attributed*
  line from the public record (confession, testimony, court record). Never invent dialogue or
  inner monologue.
- **Push the contrast.** When the record has an ironic image (a camp that "looks like a small
  town"), land it in two or three short beats and then reveal its function ("Inside, it is the
  intake valve.") — don't bury it in a longer list.
- **Foreshadow the climax.** Plant the payoff early with a quiet line ("For three decades, most
  of this operated in the open."), so the climax arrives as the metaphor's turn, not an appendix.
- **Names on screen, not in the voice.** When a list matters (nine strike sites), the voice names
  at most two that the story already knows; the full list goes on screen and in the description.

## 2 · Opening retention (first 90 seconds ≈ 225 words)

- No methodology, disclaimers, sourcing lectures or "before we go further".
- Hook = **[visceral micro-scene] → [core mystery / thesis] → [escalating stakes]**.
- After that, **one** short, warm source line is allowed — conversational, energetic, one
  sentence ("Everything here comes from the court record — Kasab's own confession, Headley's
  testimony."). Never a paragraph, never a lecture.

## 3 · Sourcing and tone

- Sourcing is active evidence, woven in: "Court records reveal…", "Under interrogation, Kasab
  admitted…", "The NSG's own timeline shows…". Sources still go on citation cards and in the
  description — just not as a lecture.
- No meta-disclaimers or virtue signalling: no "it's worth noting", "we're not going to walk
  through…", "frankly that doesn't belong in a public video", "responsible reporting…".
  Keep contested claims clearly labelled as *alleged* in the sentence itself.
- Where sources disagree, say so in one clause ("accounts differ by minutes") — not a paragraph.

## 4 · Pacing

- **Catalogue ban:** never more than two dates, locations, camps or kit items in one sentence.
- **Sentence variety:** mix 3–5 word punches with longer explanatory lines. No runs of
  same-length 12–18 word declaratives.
- **Tension loops ~every 150 words (60–90 s):** end paragraphs on a contradiction, a cost, or an
  open question — not a flat summary. Micro-payoffs work: "No weapons yet. First they build the
  reason to pick one up."
- **Deliberate pauses:** put `[PAUSE]` after key framing lines — the voice stops for ~0.8 s there.
- Measured delivery for allegations and sourcing; tighter, forward delivery for escalation.

## 5 · Audio and pronunciation

- Every non-English proper noun, military code and regional term is flagged before synthesis
  and given a pronunciation in `config/pronunciations*.json` (Devanagari native form or a
  Latin respelling such as "Daw-raa-ee-Soofaa" — never ALL-CAPS stresses, the voice spells
  those out letter by letter).
- Every flagged term gets an audition clip sent to the channel owner before the full voice pass,
  and is re-checked in context after the render (segments with the most names first).

## 6 · Checklist before voicing

- [ ] Hook → paradox → stakes in the first 90 s; no disclaimers there
- [ ] Each stage framed by objective, not calendar
- [ ] No sentence lists more than two places / dates / items
- [ ] Sentence lengths vary; tension point roughly every 150 words
- [ ] One human through-line; one attributed line from the record per major stage
- [ ] Climax is the metaphor's payoff, foreshadowed earlier; lists live on screen
- [ ] Climax stays with established people and places; ending mirrors the opening and closes on
      the metaphor or one open question
- [ ] `[PAUSE]` after the key framing lines
- [ ] `script_lint.py` passes; `pronounce_audit.py` shows nothing uncovered
