import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import {
  msToFrames,
  paragraphStartMs,
  phaseIndexFor,
  photosFor,
  Segment,
} from "../data";
import { PhotoCard } from "./PhotoCard";
import { Captions } from "./Captions";
import { HeadlineCard } from "./HeadlineCard";
import { MapScene } from "./MapScene";
import {
  ChapterTag,
  CitationCard,
  DarkGrade,
  DisputedStamp,
  LowerThird,
  PhaseStrip,
} from "./Overlays";

const kickerFor = (s: Segment) =>
  s.label !== s.title ? `${s.label}  ·  ${s.title.split(":")[0]}` : s.title;

const HeadlineBeats: React.FC<{ seg: Segment; durationInFrames: number }> = ({
  seg,
  durationInFrames,
}) => {
  const starts = seg.paragraphs.map((_, i) =>
    i === 0 ? 0 : msToFrames(paragraphStartMs(seg, i)) - 6,
  );
  return (
    <>
      {seg.paragraphs.map((p, i) => {
        const from = starts[i];
        const dur =
          (starts[i + 1] ?? durationInFrames) -
          from +
          (i < seg.paragraphs.length - 1 ? 6 : 0);
        return (
          <Sequence
            key={i}
            from={from}
            durationInFrames={dur}
            name={`beat ${i + 1}`}
          >
            <HeadlineCard
              kicker={kickerFor(seg)}
              headline={p.headline}
              subline={p.subline}
              chips={p.bold.slice(1, 4)}
              durationInFrames={dur}
              seed={seg.index * 3 + i}
            />
          </Sequence>
        );
      })}
    </>
  );
};

export const SegmentScene: React.FC<{
  seg: Segment;
  durationInFrames: number;
}> = ({ seg, durationInFrames }) => {
  const { fps } = useVideoConfig();
  const phase = phaseIndexFor(seg);
  const cueFrame = (after: number | null, lagMs: number) =>
    msToFrames(paragraphStartMs(seg, after ?? 0) + lagMs);

  const ltFrom = cueFrame(seg.lower_third_after_paragraph, 1000);
  const citeFrom = cueFrame(seg.citation_after_paragraph, 500);
  const citeSources = seg.citation_card_text
    .replace(/^Sources\s+—\s+/i, "")
    .split(/;\s*/);
  const clampDur = (from: number, want: number) =>
    Math.max(1, Math.min(want, durationInFrames - from));

  return (
    <AbsoluteFill>
      {seg.visual_type === "map" ? (
        <MapScene seg={seg} durationInFrames={durationInFrames} />
      ) : (
        <HeadlineBeats seg={seg} durationInFrames={durationInFrames} />
      )}

      {photosFor(seg).map((ph, i) => (
        <Sequence
          key={`photo${i}`}
          from={ph.from}
          durationInFrames={Math.max(
            1,
            Math.min(ph.frames, durationInFrames - ph.from),
          )}
          name={`photo ${i + 1}`}
        >
          <PhotoCard
            images={ph.images}
            labels={ph.labels}
            caption={ph.caption}
            fit={ph.fit}
            durationInFrames={Math.max(
              1,
              Math.min(ph.frames, durationInFrames - ph.from),
            )}
          />
        </Sequence>
      ))}

      {seg.dark_grade && <DarkGrade />}

      {seg.visual_type === "map" &&
        seg.label !== "COLD OPEN" &&
        phase < 0 &&
        !seg.map_zoom_out &&
        seg.site_pins.length > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              top: phase >= 0 ? 110 : 0,
            }}
          >
            <ChapterTag label={seg.label} title={seg.title} />
          </div>
        )}

      {phase >= 0 && <PhaseStrip current={phase} />}
      {seg.end_card && (
        <Sequence
          durationInFrames={msToFrames(paragraphStartMs(seg, 1) || 20000)}
          name="phase recap"
        >
          <PhaseStrip current={-1} allLit />
        </Sequence>
      )}

      {seg.disputed && (
        <Sequence
          from={msToFrames(paragraphStartMs(seg, 1))}
          name="disputed stamp"
        >
          <DisputedStamp line1="ALLEGATION" line2="NOT ESTABLISHED IN COURT" />
        </Sequence>
      )}

      {seg.lower_third_text && (
        <Sequence
          from={ltFrom}
          durationInFrames={clampDur(ltFrom, fps * 9)}
          name="lower third"
        >
          <LowerThird
            text={seg.lower_third_text}
            durationInFrames={clampDur(ltFrom, fps * 9)}
            top={seg.site_pins.length > 0}
          />
        </Sequence>
      )}

      {seg.citation_card_text && (
        <Sequence
          from={citeFrom}
          durationInFrames={clampDur(citeFrom, fps * 8)}
          name="citation"
        >
          <CitationCard
            sources={citeSources}
            durationInFrames={clampDur(citeFrom, fps * 8)}
          />
        </Sequence>
      )}

      {seg.audio_file && <Audio src={staticFile(seg.audio_file)} />}
      {seg.words && <Captions words={seg.words} />}
    </AbsoluteFill>
  );
};
