import type { CSSProperties } from "react";
import type { DomLoaderProps } from "./DomLoaderDemo";
import { LoaderStage, TaglineText } from "./LoaderStage";

const SLICE_COUNT = 10;
const SLICE_INDEXES = Array.from({ length: SLICE_COUNT }, (_, sliceIndex) => sliceIndex);
const MIN_START_OFFSET_VIEWPORT_WIDTH = 25;
const START_OFFSET_STEP_VIEWPORT_WIDTH = 9;
const START_OFFSET_STEP_COUNT = 5;

function sliceStyle(sliceIndex: number): CSSProperties {
  const startDirection = sliceIndex % 2 === 0 ? -1 : 1;
  const startOffset =
    MIN_START_OFFSET_VIEWPORT_WIDTH +
    ((sliceIndex * 3) % START_OFFSET_STEP_COUNT) * START_OFFSET_STEP_VIEWPORT_WIDTH;
  return {
    "--slice-index": sliceIndex,
    "--slice-start-offset": `${startDirection * startOffset}vw`,
  } as CSSProperties;
}

export function SliceAssembleLoader({ durationMilliseconds }: DomLoaderProps) {
  return (
    <LoaderStage durationMilliseconds={durationMilliseconds}>
      <div className="loader-center">
        <div className="slice-stack" style={{ "--slice-count": SLICE_COUNT } as CSSProperties}>
          <TaglineText className="slice-sizer" />
          {SLICE_INDEXES.map((sliceIndex) => (
            <div key={sliceIndex} className="slice-layer" style={sliceStyle(sliceIndex)} aria-hidden="true">
              <TaglineText />
            </div>
          ))}
        </div>
      </div>
    </LoaderStage>
  );
}
