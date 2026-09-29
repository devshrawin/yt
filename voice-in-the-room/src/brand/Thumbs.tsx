// File 05 thumbnails (1280x720). Two variants for YouTube's thumbnail A/B test.
// Mir's only licence-clean image is the FBI's public-domain wanted photo (pre-2008).
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { body, display } from "../theme";
import { Monogram } from "./Brand";

const RED = "#ff2d2d";
const YELLOW = "#ffd23f";

const Brand: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 12 }}>
    <Monogram size={54} />
    <div style={{ fontFamily: body, fontWeight: 800, fontSize: 22, letterSpacing: 4, color: "#e8e8e8" }}>THE SISODIA FILES · 05</div>
  </div>
);
const Credit: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", right: 12, bottom: 8, fontFamily: body, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{text}</div>
);
const Wave: React.FC<{ x: number; y: number; w: number; color: string }> = ({ x, y, w, color }) => (
  <svg width={w} height={120} style={{ position: "absolute", left: x, top: y }}>
    {Array.from({ length: Math.floor(w / 14) }).map((_, i) => {
      const h = 10 + Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37)) * 100;
      return <rect key={i} x={i * 14} y={60 - h / 2} width={7} height={h} rx={3} fill={color} opacity={0.9} />;
    })}
  </svg>
);

/** A — "The Voice": the FBI wanted photo, a phone waveform, and three contradictory stamps. */
export const Thumb05A: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#05060a", overflow: "hidden" }}>
    <Img src={staticFile("photos/sajid_mir.png")} style={{
      position: "absolute", right: 40, top: 40, width: 470, height: 583, objectFit: "cover",
      filter: "grayscale(1) contrast(1.25) brightness(0.85)", border: "6px solid #e8e8e8",
    }} />
    <div style={{ position: "absolute", right: 40, top: 623, width: 470, background: RED, color: "#fff", fontFamily: display, fontWeight: 700, fontSize: 30, textAlign: "center", letterSpacing: 4, padding: "4px 0" }}>
      FBI · WANTED · $5 MILLION
    </div>
    <Wave x={40} y={330} w={700} color={RED} />
    <div style={{ position: "absolute", left: 44, top: 60 }}>
      <div style={{ fontFamily: body, fontWeight: 800, fontSize: 26, letterSpacing: 5, color: YELLOW }}>26/11 · THE MAN ON THE PHONE</div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 118, lineHeight: 0.95, color: "#fff", marginTop: 10, textShadow: "0 6px 24px #000" }}>
        THE VOICE<br /><span style={{ color: RED }}>IN THE ROOM</span>
      </div>
    </div>
    {[
      { t: "DEAD", x: 50, r: -8 },
      { t: "ALIVE", x: 250, r: 5 },
      { t: "CONVICTED", x: 460, r: -4 },
    ].map((s) => (
      <div key={s.t} style={{
        position: "absolute", left: s.x, top: 480, transform: `rotate(${s.r}deg)`, border: `5px solid ${YELLOW}`, color: YELLOW,
        fontFamily: display, fontWeight: 700, fontSize: 44, padding: "0 14px", letterSpacing: 3, background: "rgba(0,0,0,0.6)",
      }}>{s.t}?</div>
    ))}
    <Brand x={44} y={642} />
    <Credit text="Photo: FBI (public domain)" />
  </AbsoluteFill>
);

/** B — "Never Tried": Nariman House after the siege, with a case-status card. */
export const Thumb05B: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#050507", overflow: "hidden" }}>
    <Img src={staticFile("photos/nariman_building.jpg")} style={{
      position: "absolute", left: 420, top: -40, width: 900, height: 800, objectFit: "cover",
      filter: "grayscale(0.6) contrast(1.2) brightness(0.55)",
    }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, #050507 32%, rgba(5,5,7,0.8) 50%, rgba(5,5,7,0.1) 85%)" }} />
    <div style={{ position: "absolute", left: 44, top: 60, width: 760 }}>
      <div style={{ fontFamily: body, fontWeight: 800, fontSize: 24, letterSpacing: 5, color: YELLOW }}>NARIMAN HOUSE · 26/11</div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 96, lineHeight: 1.0, color: "#fff", marginTop: 10, textShadow: "0 6px 24px #000" }}>
        HE RAN IT<br />BY <span style={{ color: RED }}>PHONE.</span>
      </div>
    </div>
    <div style={{ position: "absolute", left: 44, top: 330, width: 620, background: "rgba(10,12,18,0.92)", borderLeft: `6px solid ${RED}`, padding: "16px 22px", fontFamily: body }}>
      <div style={{ fontSize: 20, letterSpacing: 4, color: "#aab3c5", fontWeight: 700 }}>CASE STATUS</div>
      {["Declared dead — no proof", "Convicted — terror financing only", "UN listing — blocked by China"].map((l) => (
        <div key={l} style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginTop: 8 }}>
          <span style={{ color: RED }}>■ </span>{l}
        </div>
      ))}
    </div>
    <div style={{
      position: "absolute", left: 620, top: 470, transform: "rotate(-6deg)", border: `7px solid ${RED}`, color: RED, fontFamily: display,
      fontWeight: 700, fontSize: 58, padding: "0 18px", letterSpacing: 3, background: "rgba(0,0,0,0.65)", textAlign: "center",
    }}>NEVER TRIED<br />FOR MUMBAI</div>
    <Brand x={44} y={642} />
    <Credit text="Photo: Nicholas (Nichalp) / Wikimedia Commons, CC BY-SA 3.0" />
  </AbsoluteFill>
);
