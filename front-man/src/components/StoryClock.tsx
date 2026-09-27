import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { findSpoken, msToFrames, paragraphStartMs, Segment } from "../data";
import { body, C, display } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
// the siege runs from the first shots at CST to the Taj all-clear
const T0 = Date.UTC(2008, 10, 26, 21, 20);
const T_END = Date.UTC(2008, 10, 29, 8, 50);
const asUTC = (iso: string) => {
  const [d, t = "00:00"] = iso.split("T");
  const [y, mo, da] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  return Date.UTC(y, mo - 1, da, h, mi);
};

/** Story clock (top-right): date + 24h time that ticks to each time as it is spoken,
 *  plus "HOUR n / 60" progress once the siege has begun. Cold open: big centred intro. */
export const StoryClock: React.FC<{ seg: Segment }> = ({ seg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const events = (seg.clock_events ?? []).map((e) => {
    const ms = findSpoken(seg, e.trigger, paragraphStartMs(seg, e.p));
    return { ...e, frame: ms != null ? msToFrames(ms) : msToFrames(paragraphStartMs(seg, e.p)) };
  });
  const current = [...events].reverse().find((e) => frame >= e.frame);
  const iso = current?.at ?? seg.clock_start;
  if (!iso) return null;
  const hasTime = current ? current.has_time : true;
  const t = asUTC(iso);
  const d = new Date(t);
  const date = `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  const time = hasTime ? `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}` : "--:--";
  const hour = Math.floor((t - T0) / 3.6e6);
  const pct = Math.max(0, Math.min(1, (t - T0) / (T_END - T0)));
  const since = current ? frame - current.frame : 99;
  const tick = spring({ frame: since, fps, config: { damping: 14, stiffness: 200 } });

  // cold open: big centred clock, then docks to the corner
  const intro = seg.clock_intro ? interpolate(frame, [70, 100], [1, 0], clamp) : 0;
  const introIn = seg.clock_intro ? interpolate(frame, [0, 15], [0, 1], clamp) : 1;
  const scale = 1 + intro * 2.2;
  const x = interpolate(intro, [0, 1], [1920 - 80 - 330, (1920 - 330) / 2]);
  const y = interpolate(intro, [0, 1], [60, (1080 - 130) / 2]);

  return (
    <div style={{
      position: "absolute", left: x, top: y, width: 330, transform: `scale(${scale})`, transformOrigin: "center",
      opacity: introIn, fontFamily: body, textAlign: "right",
    }}>
      <div style={{ fontSize: 18, letterSpacing: 5, fontWeight: 700, color: C.accent }}>{date}</div>
      <div style={{
        fontFamily: display, fontWeight: 700, fontSize: 84, lineHeight: 1, color: C.ink, letterSpacing: 2,
        fontVariantNumeric: "tabular-nums",
        transform: `translateY(${(1 - tick) * -10}px)`, textShadow: `0 0 ${24 * (1 - tick)}px rgba(214,69,61,0.9)`,
      }}>{time}</div>
      {t >= T0 ? (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 16, letterSpacing: 3, color: C.dim, fontWeight: 600 }}>
            HOUR {Math.min(60, hour + 1)} <span style={{ color: C.faint }}>/ 60</span>
          </div>
          <div style={{ height: 4, background: "#252d3b", marginTop: 6, marginLeft: 90 }}>
            <div style={{ height: 4, width: `${pct * 100}%`, background: C.red }} />
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 16, letterSpacing: 3, color: C.dim, fontWeight: 600, marginTop: 10 }}>BEFORE THE ATTACK</div>
      )}
    </div>
  );
};
