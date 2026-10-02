import type { CSSProperties } from "react";
import type { DomLoaderProps } from "./DomLoaderDemo";
import { LoaderStage, TaglineText } from "./LoaderStage";

type CrackPoint = { xPercent: number; yPercent: number };

const CRACK_POINTS: readonly CrackPoint[] = [
  { xPercent: 50, yPercent: 0 },
  { xPercent: 46, yPercent: 12 },
  { xPercent: 54, yPercent: 24 },
  { xPercent: 44, yPercent: 37 },
  { xPercent: 53, yPercent: 49 },
  { xPercent: 45, yPercent: 61 },
  { xPercent: 55, yPercent: 73 },
  { xPercent: 47, yPercent: 86 },
  { xPercent: 50, yPercent: 100 },
];

function formatPoint({ xPercent, yPercent }: CrackPoint): string {
  return `${xPercent}% ${yPercent}%`;
}

function buildHalfPolygon(sideEdgePercent: number): string {
  const topEdge = formatPoint({ xPercent: sideEdgePercent, yPercent: 0 });
  const bottomEdge = formatPoint({ xPercent: sideEdgePercent, yPercent: 100 });
  return [topEdge, ...CRACK_POINTS.map(formatPoint), bottomEdge].join(", ");
}

const CRACK_PATH = CRACK_POINTS.map((point, pointIndex) => `${pointIndex === 0 ? "M" : "L"}${point.xPercent} ${point.yPercent}`).join(" ");

const POLYGON_STYLE = {
  "--crack-left-polygon": buildHalfPolygon(0),
  "--crack-right-polygon": buildHalfPolygon(100),
} as CSSProperties;

export function CrackSplitLoader({ durationMilliseconds }: DomLoaderProps) {
  return (
    <LoaderStage durationMilliseconds={durationMilliseconds}>
      <div className="loader-center">
        <TaglineText />
      </div>
      <div className="absolute inset-0" style={POLYGON_STYLE}>
        <div className="crack-half crack-half-left" />
        <div className="crack-half crack-half-right" />
        <svg className="crack-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={CRACK_PATH} />
        </svg>
      </div>
    </LoaderStage>
  );
}
