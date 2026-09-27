import "./index.css";
import { CalculateMetadataFunction, Composition } from "remotion";
import { buildTimeline, config } from "./data";
import { Documentary } from "./Documentary";
import { Teaser, teaserFrames } from "./Teaser";

const calculateMetadata: CalculateMetadataFunction<
  Record<string, unknown>
> = () => ({
  durationInFrames: buildTimeline().reduce((n, b) => n + b.frames, 0),
});

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Documentary"
      component={Documentary}
      durationInFrames={config.fps * 60}
      fps={config.fps}
      width={config.width}
      height={config.height}
      defaultProps={{}}
      calculateMetadata={calculateMetadata}
    />
    <Composition
      id="Teaser"
      component={Teaser}
      durationInFrames={teaserFrames()}
      fps={config.fps}
      width={1080}
      height={1920}
      defaultProps={{}}
    />
  </>
);
