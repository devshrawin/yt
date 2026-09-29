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
};

/** Full-frame licensed photo (or before/after pair) with slow push-in, caption and credit. */
export const PhotoCard: React.FC<PhotoCardProps> = ({
  images,
  labels = [],
  caption,
  durationInFrames,
  fit = "cover",
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06]);
  const credits = [...new Set(images.map((i) => i.credit))];
  const pair = images.length > 1;

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
              transform: `scale(${zoom})`,
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
