import type { CSSProperties } from "react";
import type { DomLoaderProps } from "./DomLoaderDemo";
import { LoaderStage, TaglineText } from "./LoaderStage";

const BAR_COUNT = 6;
const ACCENT_BAR_INDEX = 3;
const BAR_START_OFFSET_PERCENT = 101;
const BAR_INDEXES = Array.from({ length: BAR_COUNT }, (_, barIndex) => barIndex);

function barStyle(barIndex: number): CSSProperties {
  const startDirection = barIndex % 2 === 0 ? -1 : 1;
  return {
    "--bar-index": barIndex,
    "--bar-start-offset": `${startDirection * BAR_START_OFFSET_PERCENT}%`,
  } as CSSProperties;
}

export function SlabCurtainLoader({ durationMilliseconds }: DomLoaderProps) {
  return (
    <LoaderStage durationMilliseconds={durationMilliseconds}>
      <div className="loader-center curtain-text">
        <TaglineText />
      </div>
      <div className="absolute inset-0" style={{ "--bar-count": BAR_COUNT } as CSSProperties}>
        {BAR_INDEXES.map((barIndex) => (
          <div
            key={barIndex}
            className={`curtain-bar ${barIndex === ACCENT_BAR_INDEX ? "curtain-bar-accent" : ""}`}
            style={barStyle(barIndex)}
          />
        ))}
      </div>
    </LoaderStage>
  );
}
