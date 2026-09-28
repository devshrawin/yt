// File 04 thumbnails (1280x720). Two variants for YouTube's thumbnail A/B test.
// Headley has no licence-clean photo, so he is a silhouette in both.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { body, display } from "../theme";
import { Monogram } from "./Brand";

const RED = "#ff2d2d";
const YELLOW = "#ffd23f";
const BLUE = "#6fa8ff";

const Brand: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 12 }}>
    <Monogram size={54} />
    <div style={{ fontFamily: body, fontWeight: 800, fontSize: 22, letterSpacing: 4, color: "#e8e8e8" }}>THE SISODIA FILES · 04</div>
  </div>
);
const Credit: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", right: 12, bottom: 8, fontFamily: body, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{text}</div>
);
const Figure: React.FC<{ x: number; y: number; s: number; color: string }> = ({ x, y, s, color }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
    <circle cx={0} cy={-190} r={62} />
    <path d="M -130 80 Q -135 -95 0 -120 Q 135 -95 130 80 Z" />
  </g>
);

/** A — "Three Masters": DEA / LASHKAR / ISI circles, one silhouette in the overlap. */
export const Thumb04A: React.FC = () => {
  const cx = 960, cy = 370, r = 205, d = 118;
  const circles = [
    { label: "DEA", color: BLUE, a: -90 },
    { label: "LASHKAR", color: RED, a: 30 },
    { label: "ISI", color: YELLOW, a: 150 },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070b", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 45% 60% at 70% 52%, #1a2233 0%, #05070b 70%)" }} />
      <svg width={1280} height={720} style={{ position: "absolute" }}>
        {circles.map((c, i) => {
          const rad = (c.a * Math.PI) / 180;
          const x = cx + Math.cos(rad) * d, y = cy + Math.sin(rad) * d;
          const ly = c.a < 0 ? y - r + 58 : y + r - 40;
          const lx = c.a < 0 ? x : x + (Math.cos(rad) > 0 ? 70 : -70);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill={c.color} fillOpacity={0.12} stroke={c.color} strokeWidth={7} />
              <text x={lx} y={ly} textAnchor="middle" fontFamily={display} fontWeight={700} fontSize={52} letterSpacing={3} fill={c.color}>{c.label}</text>
            </g>
          );
        })}
        <Figure x={cx} y={cy + 95} s={0.62} color="#e9edf5" />
      </svg>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, #05070b 28%, rgba(5,7,11,0.7) 42%, rgba(5,7,11,0) 55%)" }} />
      <div style={{ position: "absolute", left: 44, top: 80 }}>
        <div style={{ display: "inline-block", background: RED, color: "#fff", fontFamily: display, fontWeight: 700, fontSize: 38, padding: "2px 14px", letterSpacing: 3 }}>
          26/11 SCOUT
        </div>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 128, lineHeight: 0.92, color: "#fff", marginTop: 18, textShadow: "0 6px 24px #000" }}>
          THE<br /><span style={{ color: YELLOW, fontSize: 112 }}>MERCENARY</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 44, top: 540, background: "#fff", color: "#000", fontFamily: body, fontWeight: 900, fontSize: 30, padding: "6px 14px" }}>
        HE WORKED FOR ALL THREE
      </div>
      <Brand x={44} y={642} />
    </AbsoluteFill>
  );
};

/** B — "The Warning": the Taj behind a case-file card with his wife's words and a 5x stamp. */
export const Thumb04B: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#050507", overflow: "hidden" }}>
    <Img src={staticFile("photos/taj_exterior.jpg")} style={{
      position: "absolute", left: 380, top: -30, width: 960, height: 780, objectFit: "cover",
      filter: "grayscale(0.5) contrast(1.2) brightness(0.55)",
    }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, #050507 30%, rgba(5,5,7,0.75) 50%, rgba(5,5,7,0.15) 80%)" }} />
    <svg width={1280} height={720} style={{ position: "absolute" }}>
      <Figure x={1080} y={640} s={1.25} color="#0b0d12" />
    </svg>
    <div style={{ position: "absolute", left: 44, top: 60, width: 720 }}>
      <div style={{ fontFamily: body, fontWeight: 800, fontSize: 24, letterSpacing: 5, color: YELLOW }}>HIS WIFE TOLD THE US EMBASSY:</div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 84, lineHeight: 1.0, color: "#fff", marginTop: 12, textShadow: "0 6px 24px #000" }}>
        “HE'S EITHER A <span style={{ color: RED }}>TERRORIST</span>, OR HE'S WORKING FOR YOU.”
      </div>
    </div>
    <div style={{
      position: "absolute", left: 60, top: 470, transform: "rotate(-6deg)", border: `7px solid ${RED}`, color: RED, fontFamily: display,
      fontWeight: 700, fontSize: 66, padding: "2px 20px", letterSpacing: 4, background: "rgba(0,0,0,0.6)",
    }}>
      WARNED 5 TIMES
    </div>
    <Brand x={44} y={642} />
    <Credit text="Photo: Joe Ravi / Wikimedia Commons, CC BY-SA 3.0" />
  </AbsoluteFill>
);
