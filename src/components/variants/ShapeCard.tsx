import type { CSSProperties, ReactNode } from "react";
import { themeColorCssValue } from "@/lib/ascii/glyphStyle";
import type { ConfigOf } from "@/lib/variantControls";
import type { Corner, SHAPE_CARD_CONTROLS } from "./controls/shapeCardControls";

export type ShapeCardConfig = ConfigOf<typeof SHAPE_CARD_CONTROLS>;

type ShapeCardProps = {
  config: ShapeCardConfig;
  children: ReactNode;
};

const INNER_CLIP_BORDER_FACTOR = 2 - Math.SQRT2;

const CORNER_RADIUS_PROPERTIES = {
  TL: "borderTopLeftRadius",
  TR: "borderTopRightRadius",
  BL: "borderBottomLeftRadius",
  BR: "borderBottomRightRadius",
} as const;

const POLYGON_CORNER_ORDER = ["TL", "TR", "BR", "BL"] as const;

function polygonPointsForCorner(corner: Corner, isClipped: boolean, clipPixels: number): readonly string[] {
  const cut = `${clipPixels}px`;
  const farCut = `calc(100% - ${cut})`;
  switch (corner) {
    case "TL":
      return isClipped ? [`0 ${cut}`, `${cut} 0`] : ["0 0"];
    case "TR":
      return isClipped ? [`${farCut} 0`, `100% ${cut}`] : ["100% 0"];
    case "BR":
      return isClipped ? [`100% ${farCut}`, `${farCut} 100%`] : ["100% 100%"];
    case "BL":
      return isClipped ? [`${cut} 100%`, `0 ${farCut}`] : ["0 100%"];
  }
}

function buildShapeStyle(
  clippedCorners: readonly Corner[],
  roundedCorners: readonly Corner[],
  clipPixels: number,
  roundPixels: number,
): CSSProperties {
  const polygonPoints = POLYGON_CORNER_ORDER.flatMap((corner) =>
    polygonPointsForCorner(corner, clippedCorners.includes(corner), clipPixels),
  );
  const cornerRadii = Object.fromEntries(
    Object.entries(CORNER_RADIUS_PROPERTIES).map(([corner, property]) => [
      property,
      roundedCorners.some((roundedCorner) => roundedCorner === corner) ? roundPixels : 0,
    ]),
  );
  return { ...cornerRadii, clipPath: `polygon(${polygonPoints.join(", ")})` };
}

export function ShapeCard({ config, children }: ShapeCardProps) {
  const { borderWidthPixels } = config;
  const outerShapeStyle = buildShapeStyle(
    config.clippedCorners,
    config.roundedCorners,
    config.clipSizePixels,
    config.roundRadiusPixels,
  );
  const innerShapeStyle = buildShapeStyle(
    config.clippedCorners,
    config.roundedCorners,
    Math.max(0, config.clipSizePixels - borderWidthPixels * INNER_CLIP_BORDER_FACTOR),
    Math.max(0, config.roundRadiusPixels - borderWidthPixels),
  );

  return (
    <div
      className="grid"
      style={{
        ...outerShapeStyle,
        width: `min(100%, ${config.widthPixels}px)`,
        minHeight: config.minHeightPixels,
        padding: borderWidthPixels,
        backgroundColor: themeColorCssValue(config.borderColorName),
      }}
    >
      <div
        className="flex flex-col gap-3"
        style={{
          ...innerShapeStyle,
          padding: config.paddingPixels,
          backgroundColor: themeColorCssValue(config.backgroundColorName),
        }}
      >
        {children}
      </div>
    </div>
  );
}
