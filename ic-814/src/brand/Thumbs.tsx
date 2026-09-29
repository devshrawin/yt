// File 06 thumbnails (1280x720). Two variants for YouTube's thumbnail A/B test.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { body, display } from "../theme";
import { Monogram } from "./Brand";

const RED = "#ff2d2d";
const YELLOW = "#ffd23f";

const Brand: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 12 }}>
    <Monogram size={54} />
    <div style={{ fontFamily: body, fontWeight: 800, fontSize: 22, letterSpacing: 4, color: "#e8e8e8" }}>THE SISODIA FILES · 06</div>
  </div>
);
const Credit: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", right: 12, bottom: 8, fontFamily: body, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{text}</div>
);

/** A — "The Trade": Kandahar terminal, 3 freed → the chain of attacks. */
export const Thumb06A: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#050507", overflow: "hidden" }}>
    <Img src={staticFile("photos/kandahar.jpg")} style={{
      position: "absolute", left: 360, top: -20, width: 980, height: 760, objectFit: "cover",
      filter: "sepia(0.35) saturate(1.3) contrast(1.15) brightness(0.55)",
    }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, #050507 30%, rgba(5,5,7,0.75) 48%, rgba(5,5,7,0.1) 80%)" }} />
    <div style={{ position: "absolute", left: 44, top: 60 }}>
      <div style={{ display: "inline-block", background: RED, color: "#fff", fontFamily: display, fontWeight: 700, fontSize: 38, padding: "2px 14px", letterSpacing: 3 }}>
        IC-814 · KANDAHAR 1999
      </div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 118, lineHeight: 0.95, color: "#fff", marginTop: 16, textShadow: "0 6px 24px #000" }}>
        THE BUTTERFLY<br /><span style={{ color: YELLOW }}>EFFECT</span>
      </div>
    </div>
    <div style={{ position: "absolute", left: 44, top: 430, display: "flex", alignItems: "center", gap: 18, fontFamily: display, fontWeight: 700 }}>
      <div style={{ border: `6px solid ${YELLOW}`, color: YELLOW, fontSize: 58, padding: "0 16px", background: "rgba(0,0,0,0.6)" }}>3 FREED</div>
      <div style={{ color: "#fff", fontSize: 70 }}>→</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {["PARLIAMENT 2001", "PEARL 2002", "PULWAMA 2019"].map((t) => (
          <div key={t} style={{ background: RED, color: "#fff", fontSize: 30, padding: "0 12px", letterSpacing: 2 }}>{t}</div>
        ))}
      </div>
    </div>
    <Brand x={44} y={642} />
    <Credit text="Photo: U.S. Department of Defense (public domain)" />
  </AbsoluteFill>
);

/** B — "One Decision": the A300 with the hijack route and the 20-year count. */
export const Thumb06B: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#04070c", overflow: "hidden" }}>
    <Img src={staticFile("photos/a300.jpg")} style={{
      position: "absolute", left: 300, top: 60, width: 1000, height: 666, objectFit: "cover",
      filter: "grayscale(0.4) contrast(1.15) brightness(0.6)",
    }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, #04070c 30%, rgba(4,7,12,0.7) 50%, rgba(4,7,12,0.05) 85%)" }} />
    <svg width={1280} height={720} style={{ position: "absolute" }}>
      <path d="M 1200 140 C 1100 110, 1020 230, 930 210 S 800 300, 760 330" fill="none" stroke={RED} strokeWidth={6} strokeDasharray="14 10" />
      {[[1200, 140], [930, 210], [760, 330]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={12} fill={RED} stroke="#fff" strokeWidth={3} />
      ))}
    </svg>
    <div style={{ position: "absolute", left: 44, top: 70 }}>
      <div style={{ fontFamily: body, fontWeight: 800, fontSize: 26, letterSpacing: 5, color: YELLOW }}>HIJACKED · 24 DEC 1999</div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 104, lineHeight: 1.0, color: "#fff", marginTop: 10, textShadow: "0 6px 24px #000" }}>
        ONE<br />DECISION.
      </div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 104, lineHeight: 1.0, color: RED, textShadow: "0 6px 24px #000" }}>
        20 YEARS.
      </div>
    </div>
    <div style={{ position: "absolute", left: 44, top: 540, background: "#fff", color: "#000", fontFamily: body, fontWeight: 900, fontSize: 30, padding: "6px 14px" }}>
      WHAT INDIA TRADED AT KANDAHAR
    </div>
    <div style={{ position: "absolute", right: 16, top: 70, fontFamily: body, fontSize: 16, color: "rgba(255,255,255,0.7)" }}>Indian Airlines A300 — same type as IC-814</div>
    <Brand x={44} y={642} />
    <Credit text="Photo: Aeroprints.com / Wikimedia Commons, CC BY-SA 3.0" />
  </AbsoluteFill>
);
