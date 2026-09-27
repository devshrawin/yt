// File 03 scenes (config-driven via config/visuals.json). No photographs of people: identities
// are silhouettes and text only.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { findSpoken, msToFrames, paragraphStartMs, Segment } from "../data";
import { body, C, display } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Cue = { at_word: string; paragraph?: number };
const cueFrame = (s: Segment, c?: Cue | null, fallback = 20) => {
  if (!c) return fallback;
  const ms = findSpoken(s, c.at_word, paragraphStartMs(s, c.paragraph ?? 0));
  return ms == null ? fallback : msToFrames(ms);
};
const kicker = (s: Segment) => (s.label !== s.title ? `${s.label}  ·  ${s.title.split(/:\s/)[0]}` : s.title);

const Kicker: React.FC<{ seg: Segment }> = ({ seg }) => (
  <div style={{ position: "absolute", left: 90, top: 70, fontFamily: body, fontSize: 20, letterSpacing: 6, color: C.accent, fontWeight: 700 }}>
    {kicker(seg)}
  </div>
);

const Silhouette: React.FC<{ x: number; y: number; s?: number; color?: string }> = ({ x, y, s = 1, color = "#1a2130" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
    <circle cx={0} cy={-190} r={62} />
    <path d="M -130 80 Q -135 -95 0 -120 Q 135 -95 130 80 Z" />
  </g>
);

type Tag = Cue & { text: string; side: "left" | "right" | "center"; kind?: "quote" | "tag"; attribution?: string };
type FriendshipCfg = {
  left_name: string; left_cue?: Cue; right_name: string; right_sub?: string; right_cue?: Cue;
  line_label: string; line_cue?: Cue; tags?: Tag[]; fade_line?: boolean; closing_label?: string;
};

/** Two silhouettes joined by a line (the friendship). Closing variant: the line fades to grey. */
export const FriendshipScene: React.FC<{ seg: Segment; durationInFrames: number }> = ({ seg, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cfg = (seg as unknown as { friendship: FriendshipCfg }).friendship;
  const inT = interpolate(frame, [0, 20], [0, 1], clamp);
  const out = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], clamp);
  const lineF = cueFrame(seg, cfg.line_cue, 25);
  const lineT = interpolate(frame, [lineF, lineF + 40], [0, 1], clamp);
  const fade = cfg.fade_line ? interpolate(frame, [durationInFrames * 0.45, durationInFrames * 0.8], [1, 0.15], clamp) : 1;
  const leftF = cueFrame(seg, cfg.left_cue, 30);
  const rightF = cueFrame(seg, cfg.right_cue, 50);
  const tags = (cfg.tags ?? []).map((t) => ({ ...t, f: cueFrame(seg, t, 99999) }));
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: inT * out }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, #161d2a 0%, ${C.bg} 65%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <Silhouette x={420} y={660} s={1.2} color={frame >= leftF ? "#232c3d" : "#141a25"} />
        <Silhouette x={1500} y={660} s={1.2} color={frame >= rightF ? "#232c3d" : "#141a25"} />
        <line x1={560} y1={470} x2={560 + 800 * lineT} y2={470} stroke={fade < 1 ? `rgba(154,163,178,${fade})` : C.accent} strokeWidth={4} />
        <circle cx={560} cy={470} r={7} fill={C.accent} opacity={lineT > 0 ? fade : 0} />
        <circle cx={1360} cy={470} r={7} fill={C.accent} opacity={lineT >= 1 ? fade : 0} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 415, textAlign: "center", fontFamily: display, fontSize: 30, letterSpacing: 6, color: C.dim, opacity: lineT * fade }}>
        {cfg.line_label}
      </div>
      {cfg.closing_label && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 530, textAlign: "center", fontFamily: body, fontSize: 22, letterSpacing: 4, color: C.faint, opacity: 1 - fade }}>
          {cfg.closing_label}
        </div>
      )}
      <div style={{ position: "absolute", left: 220, width: 400, top: 760, textAlign: "center", opacity: interpolate(frame, [leftF, leftF + 12], [0, 1], clamp) }}>
        <div style={{ fontFamily: display, fontSize: 44, color: C.ink, letterSpacing: 2 }}>{cfg.left_name}</div>
      </div>
      <div style={{ position: "absolute", left: 1300, width: 400, top: 760, textAlign: "center", opacity: interpolate(frame, [rightF, rightF + 12], [0, 1], clamp) }}>
        <div style={{ fontFamily: display, fontSize: 44, color: C.ink, letterSpacing: 2 }}>{cfg.right_name}</div>
        {cfg.right_sub && <div style={{ fontFamily: body, fontSize: 22, color: C.dim, marginTop: 4 }}>{cfg.right_sub}</div>}
      </div>
      {tags.map((t, i) => {
        const o = interpolate(frame, [t.f, t.f + 12], [0, 1], clamp);
        if (o <= 0) return null;
        const x = t.side === "left" ? 90 : t.side === "right" ? 1350 : 660;
        const sameSide = tags.filter((u, j) => u.side === t.side && j < i && frame >= u.f).length;
        return t.kind === "quote" ? (
          <div key={i} style={{ position: "absolute", left: 660, width: 600, top: 180 + sameSide * 110, textAlign: "center", opacity: o, fontFamily: body }}>
            <div style={{ fontFamily: display, fontSize: 58, color: C.ink }}>“{t.text}”</div>
            {t.attribution && <div style={{ fontSize: 20, color: C.dim, letterSpacing: 2 }}>{t.attribution}</div>}
          </div>
        ) : (
          <div key={i} style={{
            position: "absolute", left: x, top: 180 + sameSide * 64, width: 480, opacity: o, transform: `translateY(${(1 - o) * 10}px)`,
            fontFamily: body, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: C.ink, background: C.panel,
            borderLeft: `4px solid ${C.accent}`, padding: "10px 16px",
          }}>{t.text}</div>
        );
      })}
      <Kicker seg={seg} />
    </AbsoluteFill>
  );
};

type VerdictCfg = {
  intro?: { text: string } & Cue;
  acquitted: ({ text: string } & Cue)[];
  convicted: ({ text: string } & Cue)[];
  sentence?: { text: string } & Cue;
  sides?: ({ label: string; text: string } & Cue)[];
};

/** Split-verdict board: Acquitted vs Convicted columns fill as each count is spoken. */
export const VerdictScene: React.FC<{ seg: Segment; durationInFrames: number }> = ({ seg, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cfg = (seg as unknown as { verdict: VerdictCfg }).verdict;
  const inT = interpolate(frame, [0, 20], [0, 1], clamp);
  const out = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], clamp);
  const col = (title: string, color: string, items: VerdictCfg["acquitted"], x: number) => (
    <div style={{ position: "absolute", left: x, top: 330, width: 700 }}>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 64, letterSpacing: 6, color, borderBottom: `3px solid ${color}`, paddingBottom: 10 }}>{title}</div>
      {items.map((it, i) => {
        const f = cueFrame(seg, it, 99999);
        const o = interpolate(frame, [f, f + 12], [0, 1], clamp);
        return (
          <div key={i} style={{ fontFamily: body, fontSize: 32, fontWeight: 600, color: C.ink, marginTop: 22, opacity: o, transform: `translateX(${(1 - o) * 20}px)` }}>
            <span style={{ color, marginRight: 14 }}>■</span>{it.text}
          </div>
        );
      })}
    </div>
  );
  const sentF = cueFrame(seg, cfg.sentence, 99999);
  const introF = cueFrame(seg, cfg.intro, 20);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: inT * out }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #151b27 0%, ${C.bg} 65%)` }} />
      <Kicker seg={seg} />
      {cfg.intro && (
        <div style={{ position: "absolute", left: 160, top: 150, fontFamily: body, fontSize: 30, color: C.dim, opacity: interpolate(frame, [introF, introF + 12], [0, 1], clamp) }}>
          {cfg.intro.text}
        </div>
      )}
      {(cfg.sides ?? []).map((sd, i) => {
        const f = cueFrame(seg, sd, 99999);
        return (
          <div key={i} style={{ position: "absolute", left: 160 + i * 820, top: 210, width: 760, fontFamily: body, fontSize: 24, color: C.dim, opacity: interpolate(frame, [f, f + 12], [0, 1], clamp) }}>
            <span style={{ color: C.accent, fontWeight: 700, letterSpacing: 3 }}>{sd.label} </span>{sd.text}
          </div>
        );
      })}
      {col("ACQUITTED", "#7fa7d6", cfg.acquitted, 160)}
      {col("CONVICTED", C.red, cfg.convicted, 980)}
      {cfg.sentence && frame >= sentF && (
        <div style={{
          position: "absolute", left: 980, top: 690, fontFamily: display, fontWeight: 700, fontSize: 54, color: C.ink,
          border: `3px solid ${C.ink}`, padding: "8px 22px", transform: `scale(${spring({ frame: frame - sentF, fps, config: { damping: 12 } })})`, transformOrigin: "left center",
        }}>{cfg.sentence.text}</div>
      )}
    </AbsoluteFill>
  );
};

type LegalCfg = {
  us: { title: string; text: string; result: string };
  india: { title: string; text: string };
  gap: { text: string } & Cue;
  steps: ({ date: string; text: string } & Cue)[];
  quote?: { text: string; attribution: string } & Cue;
};

const Flag: React.FC<{ kind: "us" | "india" }> = ({ kind }) =>
  kind === "india" ? (
    <svg width={150} height={100}>
      <rect width={150} height={33} fill="#FF9933" />
      <rect y={33} width={150} height={34} fill="#fff" />
      <rect y={67} width={150} height={33} fill="#138808" />
      <circle cx={75} cy={50} r={13} fill="none" stroke="#000080" strokeWidth={2.5} />
    </svg>
  ) : (
    <svg width={150} height={100}>
      {Array.from({ length: 13 }).map((_, i) => <rect key={i} y={(i * 100) / 13} width={150} height={100 / 13} fill={i % 2 ? "#fff" : "#B22234"} />)}
      <rect width={64} height={54} fill="#3C3B6E" />
    </svg>
  );

/** US vs India charges with the "different charges" gap, plus the extradition timeline. */
export const LegalScene: React.FC<{ seg: Segment; durationInFrames: number }> = ({ seg, durationInFrames }) => {
  const frame = useCurrentFrame();
  const cfg = (seg as unknown as { legal: LegalCfg }).legal;
  const inT = interpolate(frame, [0, 20], [0, 1], clamp);
  const out = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], clamp);
  const gapF = cueFrame(seg, cfg.gap, 40);
  const steps = cfg.steps.map((st) => ({ ...st, f: cueFrame(seg, st, 99999) }));
  const quoteF = cueFrame(seg, cfg.quote ?? null, 99999);
  const card = (flag: "us" | "india", title: string, text: string, result: string | null, x: number) => (
    <div style={{ position: "absolute", left: x, top: 150, width: 640, display: "flex", gap: 24, alignItems: "flex-start" }}>
      <div style={{ opacity: 0.9, flex: "none" }}><Flag kind={flag} /></div>
      <div style={{ fontFamily: body }}>
        <div style={{ fontFamily: display, fontSize: 40, color: C.ink, letterSpacing: 2 }}>{title}</div>
        <div style={{ fontSize: 24, color: C.dim, marginTop: 6, lineHeight: 1.35 }}>{text}</div>
        {result && <div style={{ fontFamily: display, fontSize: 30, color: "#7fa7d6", marginTop: 8, letterSpacing: 3 }}>{result}</div>}
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: inT * out }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, #151b27 0%, ${C.bg} 65%)` }} />
      <Kicker seg={seg} />
      {card("us", cfg.us.title, cfg.us.text, cfg.us.result, 140)}
      {card("india", cfg.india.title, cfg.india.text, null, 1100)}
      <div style={{
        position: "absolute", left: 800, width: 320, top: 190, textAlign: "center", fontFamily: display, fontWeight: 700, fontSize: 34,
        letterSpacing: 5, color: C.accent, opacity: interpolate(frame, [gapF, gapF + 12], [0, 1], clamp),
        borderTop: `2px dashed ${C.accent}`, borderBottom: `2px dashed ${C.accent}`, padding: "10px 0",
      }}>{cfg.gap.text}</div>
      {cfg.quote && frame >= quoteF && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 420, textAlign: "center", opacity: interpolate(frame, [quoteF, quoteF + 14], [0, 1], clamp) }}>
          <div style={{ fontFamily: display, fontSize: 64, color: C.ink }}>“{cfg.quote.text}”</div>
          <div style={{ fontFamily: body, fontSize: 22, color: C.dim, letterSpacing: 3 }}>{cfg.quote.attribution}</div>
        </div>
      )}
      {/* extradition timeline */}
      <div style={{ position: "absolute", left: 140, right: 140, top: 640, height: 4, background: "#252d3b" }} />
      {steps.map((st, i) => {
        const x = 140 + (i * (1920 - 280)) / Math.max(1, steps.length - 1);
        const on = frame >= st.f;
        const o = interpolate(frame, [st.f, st.f + 10], [0.3, 1], clamp);
        return (
          <div key={i} style={{ position: "absolute", left: x - 90, top: 614, width: 180, textAlign: "center", opacity: o }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, margin: "0 auto", background: on ? C.red : C.bg, border: `3px solid ${on ? C.red : C.faint}` }} />
            <div style={{ fontFamily: display, fontSize: 24, color: on ? C.ink : C.faint, marginTop: 10 }}>{st.date}</div>
            <div style={{ fontFamily: body, fontSize: 17, color: C.dim, marginTop: 4, lineHeight: 1.3 }}>{st.text}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

type StatusCfg = { steps: ({ text: string } & Cue)[]; pending: string; stamp: { text: string } & Cue; as_of: string };

/** Case status: a progress bar that fills step by step and stops short of a verdict. */
export const StatusScene: React.FC<{ seg: Segment; durationInFrames: number }> = ({ seg, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cfg = (seg as unknown as { status: StatusCfg }).status;
  const inT = interpolate(frame, [0, 20], [0, 1], clamp);
  const out = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], clamp);
  const steps = cfg.steps.map((st) => ({ ...st, f: cueFrame(seg, st, 99999) }));
  const done = steps.filter((st) => frame >= st.f).length;
  const total = steps.length + 1;
  const fill = interpolate(done, [0, total], [0, 1]);
  const stampF = cueFrame(seg, cfg.stamp, 99999);
  const blink = Math.floor(frame / 15) % 2;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: inT * out }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, #151b27 0%, ${C.bg} 65%)` }} />
      <Kicker seg={seg} />
      <div style={{ position: "absolute", left: 160, right: 160, top: 300, height: 14, background: "#252d3b" }}>
        <div style={{ height: 14, width: `${fill * 100}%`, background: C.accent }} />
      </div>
      {[...steps, { text: cfg.pending, f: 99999 }].map((st, i) => {
        const x = 160 + ((i + 1) / total) * (1920 - 320);
        const on = frame >= st.f;
        const last = i === steps.length;
        return (
          <div key={i} style={{ position: "absolute", left: x - 110, top: 330, width: 220, textAlign: "center", fontFamily: body }}>
            <div style={{ fontSize: 30, color: last ? (blink ? C.red : C.faint) : on ? C.accent : C.faint }}>{last ? "?" : on ? "✓" : "·"}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: last ? C.ink : on ? C.ink : C.faint, marginTop: 6, lineHeight: 1.3 }}>{st.text}</div>
          </div>
        );
      })}
      {frame >= stampF && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center",
          transform: `scale(${spring({ frame: frame - stampF, fps, config: { damping: 10 } })})`,
        }}>
          <div style={{ border: `6px solid ${C.red}`, color: C.red, padding: "12px 34px", fontFamily: display, fontWeight: 700, fontSize: 70, letterSpacing: 8, transform: "rotate(-3deg)", textAlign: "center" }}>
            {cfg.stamp.text}
            <div style={{ fontFamily: body, fontSize: 22, letterSpacing: 4 }}>{cfg.as_of}</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
