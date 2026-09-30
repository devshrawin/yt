import React from "react";
import { AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { findSpoken, msToFrames, paragraphStartMs, Segment } from "../data";
import { body, C, display } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const kicker = (s: Segment) => (s.label !== s.title ? `${s.label}  ·  ${s.title.split(/:\s/)[0]}` : s.title);
const at = (s: Segment, word: string, p = 0) => {
  const ms = findSpoken(s, word, paragraphStartMs(s, p));
  return ms == null ? null : msToFrames(ms);
};

/** A silhouette figure holding a phone (no faces, no real people). */
const Figure: React.FC<{ x: number; y: number; s?: number; flip?: boolean }> = ({ x, y, s = 1, flip = false }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} fill="#05070a">
    <circle cx={0} cy={-150} r={42} />
    <path d="M -90 60 Q -95 -70 0 -95 Q 95 -70 90 60 Z" />
    <rect x={30} y={-165} width={22} height={62} rx={6} fill="#0b0f16" stroke="#2a3446" strokeWidth={2} />
  </g>
);

type ControlRoomCfg = {
  left_title?: string; right_title?: string; distance?: string; name_kicker?: string;
  cut?: { at_word: string; paragraph?: number; text?: string } | null;
  screens_off?: { at_word: string; paragraph?: number };
  names?: { at_word: string; paragraph?: number; name: string; role: string; photo?: string; credit?: string }[];
};

/** Split screen: gunmen in the hotels (left) <-> Karachi control room (right). */
export const ControlRoom: React.FC<{ seg: Segment; durationInFrames: number }> = ({ seg, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inT = interpolate(frame, [0, 20], [0, 1], clamp);
  const out = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], clamp);
  const cfg = (seg as unknown as { controlroom?: ControlRoomCfg }).controlroom ?? {};
  const cutCue = cfg.cut === undefined ? { at_word: "cut", paragraph: 1 } : cfg.cut;
  const cut = cutCue ? at(seg, cutCue.at_word, cutCue.paragraph ?? 0) : null;
  const darkAt = cfg.screens_off ? at(seg, cfg.screens_off.at_word, cfg.screens_off.paragraph ?? 0) : null;
  const tvOn = (cut == null || frame < cut) && (darkAt == null || frame < darkAt);
  const names = (cfg.names ?? [
    { at_word: "Sajid", paragraph: 2, name: "Sajid Mir", role: "Headley's handler", photo: "photos/sajid_mir.png" },
    { at_word: "Khafa", paragraph: 2, name: "Abu Khafa", role: "control room" },
    { at_word: "Kama", paragraph: 2, name: "Abu Al Kama", role: "control room" },
  ]).map((n) => ({ ...n, f: at(seg, n.at_word, n.paragraph ?? 0) }));
  const lineFade = darkAt == null ? 1 : interpolate(frame, [darkAt, darkAt + 60], [1, 0.1], clamp);

  const pulses = [0, 1, 2, 3].map((k) => ((frame / fps + k * 0.6) % 2.4) / 2.4);

  return (
    <AbsoluteFill style={{ backgroundColor: "#040507", opacity: inT * out }}>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="mumbai" x1="0" x2="1">
            <stop offset="0" stopColor="#10151f" />
            <stop offset="1" stopColor="#0a0d13" />
          </linearGradient>
          <linearGradient id="karachi" x1="0" x2="1">
            <stop offset="0" stopColor="#0a0d13" />
            <stop offset="1" stopColor="#151016" />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={940} height={1080} fill="url(#mumbai)" />
        <rect x={980} y={0} width={940} height={1080} fill="url(#karachi)" />
        {/* hotel window blinds */}
        {Array.from({ length: 14 }).map((_, i) => (
          <rect key={i} x={120} y={200 + i * 30} width={420} height={12} fill="#1a2231" opacity={0.7} />
        ))}
        <Figure x={330} y={760} s={1.5} />
        <Figure x={690} y={800} s={1.25} flip />
        {/* control room: wall of TVs */}
        {[0, 1, 2].map((i) => {
          const x = 1090 + i * 250;
          return (
            <g key={i}>
              <rect x={x} y={200} width={220} height={150} fill="#0d1017" stroke="#2c3444" strokeWidth={4} />
              {tvOn ? (
                <>
                  <rect x={x + 8} y={208} width={204} height={134} fill={`hsl(215 30% ${14 + 6 * random(`tv${i}-${Math.floor(frame / 3)}`)}%)`} />
                  <rect x={x + 8} y={312} width={204} height={30} fill={C.red} opacity={0.75} />
                  <rect x={x + 16} y={320} width={120 + 60 * random(`tk${i}-${Math.floor(frame / 20)}`)} height={12} fill="#fff" opacity={0.8} />
                  <text x={x + 20} y={234} fill="#fff" fontFamily={body} fontWeight={700} fontSize={16}>LIVE</text>
                </>
              ) : (
                <rect x={x + 8} y={208} width={204} height={134} fill="#000" />
              )}
            </g>
          );
        })}
        <rect x={1090} y={640} width={720} height={26} fill="#1b1f28" />
        <Figure x={1300} y={880} s={1.35} flip />
        <Figure x={1620} y={880} s={1.2} />
        {/* signal across the divide */}
        <line x1={600} y1={560} x2={1320} y2={560} stroke="#2a3446" strokeWidth={2} strokeDasharray="6 10" />
        {pulses.map((p, i) => (
          <circle key={i} cx={i % 2 ? 600 + p * 720 : 1320 - p * 720} cy={560} r={7} fill={i % 2 ? C.accent : C.red} opacity={(1 - Math.abs(p - 0.5) * 1.4) * lineFade} />
        ))}
        <rect x={940} y={0} width={40} height={1080} fill="#000" />
      </svg>
      <AbsoluteFill style={{ opacity: 0.08, backgroundImage: `url(${staticFile("fx/grain.png")})`, backgroundPosition: `${(frame * 37) % 512}px ${(frame * 91) % 512}px` }} />

      <div style={{ position: "absolute", left: 90, top: 70, fontFamily: body, fontSize: 20, letterSpacing: 6, color: C.accent, fontWeight: 700 }}>
        {kicker(seg)}
      </div>
      <div style={{ position: "absolute", left: 120, top: 120, fontFamily: display, fontSize: 44, color: C.ink, letterSpacing: 3 }}>{cfg.left_title ?? "MUMBAI · INSIDE THE HOTELS"}</div>
      <div style={{ position: "absolute", left: 1090, top: 120, fontFamily: display, fontSize: 44, color: C.ink, letterSpacing: 3 }}>{cfg.right_title ?? "KARACHI · CONTROL ROOM"}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 590, textAlign: "center", fontFamily: body, fontWeight: 700, fontSize: 22, letterSpacing: 6, color: C.dim }}>
        {cfg.distance ?? "≈ 600 KM"}
      </div>
      {cut != null && frame >= cut && (
        <div style={{
          position: "absolute", left: 1170, top: 250, transform: `rotate(-6deg) scale(${spring({ frame: frame - cut, fps, config: { damping: 10 } })})`,
          border: `5px solid ${C.red}`, color: C.red, padding: "6px 18px", fontFamily: display, fontWeight: 700, fontSize: 40, letterSpacing: 6, background: "rgba(0,0,0,0.6)",
        }}>{cutCue?.text ?? "TV FEEDS CUT"}</div>
      )}

      <div style={{ position: "absolute", left: 1090, top: 700, display: "flex", flexDirection: "column", gap: 12 }}>
        {names.map((n) =>
          n.f != null && frame >= n.f ? (
            <div key={n.name} style={{
              display: "flex", alignItems: "center", gap: 16, background: C.panel, borderLeft: `4px solid ${C.red}`, padding: "10px 18px",
              opacity: interpolate(frame, [n.f, n.f + 10], [0, 1], clamp), transform: `translateX(${interpolate(frame, [n.f, n.f + 10], [30, 0], clamp)}px)`,
            }}>
              {n.photo && <Img src={staticFile(n.photo)} style={{ width: 64, height: 78, objectFit: "cover", filter: "grayscale(0.3)" }} />}
              <div style={{ fontFamily: body }}>
                <div style={{ fontSize: 14, letterSpacing: 3, color: C.accent, fontWeight: 700 }}>{cfg.name_kicker ?? "VOICE IDENTIFIED BY HEADLEY"}</div>
                <div style={{ fontFamily: display, fontSize: 38, color: C.ink }}>{n.name}</div>
                <div style={{ fontSize: 18, color: C.dim }}>{n.role}{n.photo ? ` · photo: ${n.credit ?? "FBI (public domain)"}` : ""}</div>
              </div>
            </div>
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Respectful numbers card: values count up as they are spoken. No imagery. */
export const StatsScene: React.FC<{ seg: Segment; durationInFrames: number }> = ({ seg, durationInFrames }) => {
  const frame = useCurrentFrame();
  const inT = interpolate(frame, [0, 20], [0, 1], clamp);
  const out = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], clamp);
  const stats = (seg.stats ?? []).map((s, i) => ({ ...s, f: at(seg, s.at_word) ?? 30 + i * 30 }));
  const starts = seg.paragraphs.map((_, i) => msToFrames(paragraphStartMs(seg, i)));
  let pi = 0;
  while (pi + 1 < starts.length && frame >= starts[pi + 1]) pi++;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: inT * out }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #151b27 0%, ${C.bg} 65%)` }} />
      <div style={{ position: "absolute", left: 90, top: 70, fontFamily: body, fontSize: 20, letterSpacing: 6, color: C.accent, fontWeight: 700 }}>
        {kicker(seg)}
      </div>
      <div style={{ position: "absolute", left: 160, right: 160, top: 190, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px 80px" }}>
        {stats.map((s, i) => {
          const t = interpolate(frame, [s.f, s.f + 36], [0, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
          return (
            <div key={i} style={{ opacity: interpolate(frame, [s.f - 4, s.f + 8], [0, 1], clamp), borderTop: `2px solid ${i === 0 ? C.red : "#2a3242"}`, paddingTop: 16 }}>
              <div style={{ fontFamily: display, fontWeight: 700, fontSize: 150, lineHeight: 1, color: C.ink, fontVariantNumeric: "tabular-nums" }}>
                {Math.round(s.value * t)}
                <span style={{ fontSize: 70, color: C.dim }}>{s.suffix ?? ""}</span>
              </div>
              <div style={{ fontFamily: body, fontWeight: 700, fontSize: 34, color: C.ink, textTransform: "uppercase", letterSpacing: 3 }}>{s.label}</div>
              {s.note && <div style={{ fontFamily: body, fontSize: 24, color: C.dim, marginTop: 6 }}>{s.note}</div>}
            </div>
          );
        })}
      </div>
      {pi > 0 && (
        <div style={{
          position: "absolute", left: 160, right: 160, bottom: 170, fontFamily: body, fontSize: 32, lineHeight: 1.4, color: C.dim,
          opacity: interpolate(frame, [starts[pi], starts[pi] + 15], [0, 1], clamp),
        }}>{seg.paragraphs[pi].subline}</div>
      )}
    </AbsoluteFill>
  );
};
