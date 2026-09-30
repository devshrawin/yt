import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { body, C, display } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type PhotoCardProps = {
  images: { src: string; credit: string }[];
  labels?: string[];
  caption: string;
  durationInFrames: number;
  fit?: "cover" | "contain";
  person?: { name: string; role: string; years?: string };
  quote?: { text: string; by: string };
};

/** Full-screen attributed quote, with the speaker's photo as a small inset when available. */
const Quote: React.FC<{ q: NonNullable<PhotoCardProps["quote"]>; img?: { src: string; credit: string }; frame: number }> = ({ q, img, frame }) => {
  const t = interpolate(frame, [0, 22], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#06080c", justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #141a26 0%, #06080c 70%)" }} />
      <div style={{ position: "absolute", left: 200, right: 200, top: 250, fontFamily: display, fontSize: 70, lineHeight: 1.18, color: C.ink, textAlign: "center", opacity: t, transform: `translateY(${(1 - t) * 20}px)` }}>
        <span style={{ color: C.accent }}>“</span>{q.text}<span style={{ color: C.accent }}>”</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, opacity: interpolate(frame, [18, 36], [0, 1], clamp) }}>
        {img && <Img src={staticFile(img.src)} style={{ width: 86, height: 86, borderRadius: 43, objectFit: "cover", objectPosition: "50% 25%", border: `2px solid ${C.accent}` }} />}
        <div style={{ fontFamily: body, fontSize: 30, color: C.dim, letterSpacing: 2 }}>— {q.by}</div>
      </div>
      {img && <div style={{ position: "absolute", right: 40, top: 30, fontFamily: body, fontSize: 16, color: C.faint }}>{img.credit}</div>}
    </AbsoluteFill>
  );
};

// deterministic pan direction per image so consecutive photos drift differently
const drift = (src: string) => ([...src].reduce((a, c) => a + c.charCodeAt(0), 0) % 2 ? 1 : -1);

/** Dossier portrait: framed photo left, name / role / years right. */
const Portrait: React.FC<{ src: string; credit: string; person: NonNullable<PhotoCardProps["person"]>; caption: string; frame: number; durationInFrames: number }> = ({ src, credit, person, caption, frame, durationInFrames }) => {
  const inT = interpolate(frame, [0, 18], [0, 1], clamp);
  const txt = interpolate(frame, [10, 30], [0, 1], clamp);
  const zoom = interpolate(frame, [0, durationInFrames], [1.02, 1.1]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#07090d" }}>
      <Img src={staticFile(src)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: "blur(50px) brightness(0.25) saturate(0.6)", transform: "scale(1.2)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(7,9,13,0.2) 0%, rgba(7,9,13,0.85) 55%, #07090d 100%)" }} />
      <div style={{ position: "absolute", left: 150, top: 150, width: 620, height: 760, overflow: "hidden", border: `3px solid ${C.ink}`, boxShadow: "0 30px 80px rgba(0,0,0,0.7)", opacity: inT, transform: `translateY(${(1 - inT) * 30}px)` }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%", transform: `scale(${zoom})`, filter: "contrast(1.08) saturate(0.9)" }} />
      </div>
      <div style={{ position: "absolute", left: 150, top: 924, width: 620, fontFamily: body, fontSize: 15, color: C.faint, opacity: inT }}>{credit}</div>
      <div style={{ position: "absolute", left: 860, top: 300, right: 120, fontFamily: body, opacity: txt, transform: `translateX(${(1 - txt) * 30}px)` }}>
        <div style={{ fontSize: 22, letterSpacing: 8, color: C.accent, fontWeight: 700 }}>DOSSIER</div>
        <div style={{ width: 120, height: 4, background: C.red, margin: "18px 0 26px" }} />
        <div style={{ fontFamily: display, fontSize: 96, lineHeight: 1.0, color: C.ink, fontWeight: 700 }}>{person.name}</div>
        <div style={{ fontSize: 36, color: C.ink, marginTop: 22, lineHeight: 1.3 }}>{person.role}</div>
        {person.years && <div style={{ fontFamily: display, fontSize: 40, color: C.accent, marginTop: 18, letterSpacing: 3 }}>{person.years}</div>}
        {caption && <div style={{ fontSize: 24, color: C.dim, marginTop: 30, lineHeight: 1.4 }}>{caption}</div>}
      </div>
    </AbsoluteFill>
  );
};

/** Full-frame licensed photo (or before/after pair) with slow push-in, caption and credit. */
export const PhotoCard: React.FC<PhotoCardProps> = ({
  images,
  labels = [],
  caption,
  durationInFrames,
  fit = "cover",
  person,
  quote,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06]);
  if (quote) {
    return (
      <AbsoluteFill style={{ opacity: o }}>
        <Quote q={quote} img={images[0]} frame={frame} />
      </AbsoluteFill>
    );
  }
  const credits = [...new Set(images.map((i) => i.credit))];
  const pair = images.length > 1;
  const pan = interpolate(frame, [0, durationInFrames], [0, 2.2 * drift(images[0].src)]);
  if (person && !pair) {
    return (
      <AbsoluteFill style={{ opacity: o }}>
        <Portrait src={images[0].src} credit={images[0].credit} person={person} caption={caption} frame={frame} durationInFrames={durationInFrames} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#040507", opacity: o }}>
      {pair ? (
        <AbsoluteFill
          style={{
            flexDirection: "row",
            gap: 24,
            padding: "110px 70px 250px",
            alignItems: "center",
          }}
        >
          {images.map((im, i) => {
            const inI = interpolate(
              frame,
              [i * 20, i * 20 + 15],
              [0, 1],
              clamp,
            );
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  opacity: inI,
                }}
              >
                <Img
                  src={staticFile(im.src)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transform: `scale(${zoom})`,
                  }}
                />
                {labels[i] && (
                  <div
                    style={{
                      position: "absolute",
                      left: 18,
                      top: "calc(50% - 230px)",
                      padding: "6px 16px",
                      fontFamily: display,
                      fontSize: 30,
                      letterSpacing: 4,
                      color: "#000",
                      background: i === 0 ? C.ink : C.red,
                    }}
                  >
                    {labels[i]}
                  </div>
                )}
              </div>
            );
          })}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          {fit === "contain" && (
            <Img
              src={staticFile(images[0].src)}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "blur(40px) brightness(0.35)",
                transform: "scale(1.2)",
              }}
            />
          )}
          <Img
            src={staticFile(images[0].src)}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              objectFit: fit,
              transform: `scale(${zoom + 0.03}) translateX(${pan}%)`,
              filter: "saturate(0.85) contrast(1.05)",
            }}
          />
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.85) 100%)",
            }}
          />
        </AbsoluteFill>
      )}

      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          bottom: 170,
          fontFamily: body,
        }}
      >
        <div
          style={{
            display: "inline-block",
            borderLeft: `5px solid ${C.accent}`,
            paddingLeft: 18,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: C.ink,
              textShadow: "0 2px 10px #000",
            }}
          >
            {caption}
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 40,
          top: 30,
          fontFamily: body,
          fontSize: 17,
          color: "#c9ced8",
          background: "rgba(0,0,0,0.55)",
          padding: "4px 10px",
          textAlign: "right",
        }}
      >
        {credits.join(" · ")}
      </div>
    </AbsoluteFill>
  );
};
