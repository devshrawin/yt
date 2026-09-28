// File 03 thumbnails (1280x720). Two variants for YouTube's thumbnail A/B test.
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
    <div style={{ fontFamily: body, fontWeight: 800, fontSize: 22, letterSpacing: 4, color: "#e8e8e8" }}>THE SISODIA FILES · 03</div>
  </div>
);
const Credit: React.FC = () => (
  <div style={{ position: "absolute", right: 12, bottom: 8, fontFamily: body, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
    Photo: U.S. Marshals Service (public domain)
  </div>
);

/** A — "The Handover": Rana in chains, walked to the plane; red ring on him. */
export const Thumb03A: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#050507", overflow: "hidden" }}>
    <Img src={staticFile("photos/rana_extradition2.jpg")} style={{
      position: "absolute", left: 450, top: -40, width: 1150, height: 810, objectFit: "cover", objectPosition: "0% 40%",
      filter: "contrast(1.2) saturate(0.85) brightness(0.8)",
    }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, #050507 30%, rgba(5,5,7,0.8) 45%, rgba(5,5,7,0) 60%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 22% 45% at 65% 42%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)" }} />
    {/* ring on Rana */}
    <div style={{ position: "absolute", left: 742, top: 140, width: 190, height: 330, borderRadius: "50%", border: `7px solid ${RED}`, boxShadow: `0 0 26px ${RED}` }} />
    <div style={{ position: "absolute", left: 40, top: 70 }}>
      <div style={{ display: "inline-block", background: RED, color: "#fff", fontFamily: display, fontWeight: 700, fontSize: 40, padding: "2px 14px", letterSpacing: 3 }}>
        EXTRADITED
      </div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 132, lineHeight: 0.92, color: "#fff", marginTop: 18, textShadow: "0 6px 24px #000" }}>
        THE<br />FRONT<br /><span style={{ color: YELLOW }}>MAN</span>
      </div>
    </div>
    <div style={{
      position: "absolute", left: 40, top: 540, background: "#fff", color: "#000", fontFamily: body, fontWeight: 900, fontSize: 30, padding: "6px 14px",
    }}>CLEARED IN THE US. TRIED IN INDIA.</div>
    <Brand x={40} y={640} />
    <Credit />
  </AbsoluteFill>
);

/** B — "The Verdict": two stamps across a split US / India frame, Rana in the gap. */
export const Thumb03B: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#050507", overflow: "hidden" }}>
    {/* US side */}
    <AbsoluteFill style={{ clipPath: "polygon(0 0, 52% 0, 40% 100%, 0 100%)" }}>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(180deg, #3a0d12 0 55px, #1b1f2b 55px 110px)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 420, height: 330, background: "#101a3a" }} />
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.45)" }} />
    </AbsoluteFill>
    {/* India side */}
    <AbsoluteFill style={{ clipPath: "polygon(52% 0, 100% 0, 100% 100%, 40% 100%)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 240, background: "#7a3c10" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 240, height: 240, background: "#2a2a2a" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 480, height: 240, background: "#0e3d17" }} />
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.45)" }} />
    </AbsoluteFill>
    {/* Rana, cut out of the handover photo, in the gap */}
    <div style={{ position: "absolute", left: 470, top: 90, width: 330, height: 630, overflow: "hidden", borderLeft: "5px solid #fff", borderRight: "5px solid #fff" }}>
      <Img src={staticFile("photos/rana_extradition2.jpg")} style={{
        position: "absolute", left: -300, top: -120, width: 1400, height: 982, objectFit: "cover", filter: "contrast(1.2) brightness(0.9)",
      }} />
    </div>
    <div style={{ position: "absolute", left: 40, top: 150, transform: "rotate(-8deg)", border: `7px solid ${BLUE}`, color: BLUE, fontFamily: display, fontWeight: 700, fontSize: 70, padding: "4px 18px", letterSpacing: 4, background: "rgba(0,0,0,0.55)" }}>
      NOT GUILTY
      <div style={{ fontFamily: body, fontSize: 20, letterSpacing: 3 }}>USA · 2011 · MUMBAI CHARGE</div>
    </div>
    <div style={{ position: "absolute", right: 40, top: 150, transform: "rotate(7deg)", border: `7px solid ${RED}`, color: RED, fontFamily: display, fontWeight: 700, fontSize: 70, padding: "4px 18px", letterSpacing: 4, background: "rgba(0,0,0,0.55)" }}>
      ON TRIAL
      <div style={{ fontFamily: body, fontSize: 20, letterSpacing: 3 }}>INDIA · 2025 · SAME ATTACK</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", fontFamily: display, fontWeight: 700, fontSize: 120, color: "#fff", textShadow: "0 6px 28px #000, 0 0 2px #000" }}>
      THE FRONT MAN
    </div>
    <Brand x={40} y={640} />
    <Credit />
  </AbsoluteFill>
);
