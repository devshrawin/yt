import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { body, C } from "../theme";

export type MapPinProps = {
  label: string;
  x: number;
  y: number;
  color?: string;
  /** frame (relative to parent sequence) at which the pin drops in */
  delay?: number;
  /** strike style: expanding shock rings instead of a soft pulse */
  strike?: boolean;
  /** dim once a newer pin becomes active */
  dimFrom?: number | null;
  labelSide?: "left" | "right";
  number?: number;
  small?: boolean;
  sublabel?: string;
  /** >1 = faster pulse rings (tension) */
  ringSpeed?: number;
};

export const MapPin: React.FC<MapPinProps> = ({
  label,
  x,
  y,
  color = C.accent,
  delay = 0,
  strike = false,
  dimFrom = null,
  labelSide = "right",
  number,
  small = false,
  sublabel,
  ringSpeed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - delay;
  if (t < 0) return null;

  const drop = spring({
    frame: t,
    fps,
    config: { damping: 12, stiffness: 140 },
  });
  const dropY = interpolate(drop, [0, 1], [-60, 0]);
  const labelIn = interpolate(t, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dim =
    dimFrom != null
      ? interpolate(frame, [dimFrom, dimFrom + 15], [1, 0.45], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  const size = small ? 10 : 18;

  const ringPeriod = (strike ? 45 : 60) / ringSpeed;
  const rings = [0, 1].map((k) => {
    const p = ((t + k * (ringPeriod / 2)) % ringPeriod) / ringPeriod;
    return {
      r: size * (1 + p * (strike ? 2.4 : 3)),
      o: (1 - p) * (strike ? 0.7 : 0.5),
    };
  });
  const flash = strike
    ? interpolate(t, [0, 4, 20], [0, 1, 0], { extrapolateRight: "clamp" })
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: dim,
        transform: `translateY(${dropY}px)`,
      }}
    >
      <svg
        width={1}
        height={1}
        style={{ overflow: "visible", position: "absolute" }}
      >
        {flash > 0 && (
          <circle
            r={size * 4 * (1 - flash) + size}
            fill={color}
            opacity={flash * 0.35}
          />
        )}
        {!small &&
          rings.map((r, i) => (
            <circle
              key={i}
              r={r.r}
              fill="none"
              stroke={color}
              strokeWidth={2}
              opacity={r.o * drop}
            />
          ))}
        <circle r={size / 2 + 3} fill="#000" opacity={0.6} />
        <circle r={size / 2} fill={color} />
        {number != null && (
          <text
            textAnchor="middle"
            dy={5}
            fontFamily={body}
            fontWeight={700}
            fontSize={13}
            fill="#000"
          >
            {number}
          </text>
        )}
      </svg>
      <div
        style={{
          position: "absolute",
          top: small ? -11 : -18,
          [labelSide === "right" ? "left" : "right"]: size + 10,
          whiteSpace: "nowrap",
          opacity: labelIn,
          transform: `translateX(${(1 - labelIn) * (labelSide === "right" ? -12 : 12)}px)`,
          textAlign: labelSide === "right" ? "left" : "right",
        }}
      >
        <div
          style={{
            fontFamily: body,
            fontWeight: small ? 500 : 700,
            fontSize: small ? 18 : 28,
            color: small ? C.dim : C.ink,
            textShadow: "0 2px 8px #000, 0 0 2px #000",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              fontFamily: body,
              fontSize: 18,
              color: C.dim,
              textShadow: "0 2px 6px #000",
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};
