import { CTFTIME_TEAM_URL, HERO_DOMAINS } from "@/content/heroContent";
import { STRATA_SECTIONS, type StrataSection } from "@/content/strataSections";
import { formatIndexLabel } from "@/lib/formatIndexLabel";
import {
  createDomainShapeField,
  createSonarField,
  createTunnelField,
} from "./descentArt";
import { hashUnit } from "./fieldArt";
import {
  blitLuminance,
  createSceneGrid,
  drawFrame,
  drawHorizontalRule,
  hasArea,
  regionMetrics,
  wrapText,
  writeCenteredText,
  writeFadeBar,
  writeText,
  type SceneGrid,
  type SceneRegion,
  type SceneTheme,
} from "./sceneGrid";
import type { SceneTextLine } from "./sceneText";
import type { GlyphMetrics, LuminanceGrid } from "./types";

const MARGIN_COLUMNS = 3;
const CONTENT_TOP_ROW = 3;
const CONTENT_BOTTOM_ROWS = 4;
const REGION_GAP_COLUMNS = 3;
const TEXT_COLUMN_SHARE = 0.38;
const DEPTH_STEP_METERS = 100;
const DOMAIN_TILE_COLUMNS = 3;
const DOMAIN_TILE_ROWS = 2;
const MINIMUM_TILE_SIZE = 6;
const JOIN_CAPTION_ROWS = 2;
const LAST_SECTION_CUE = "■ BOTTOM";
const NEXT_SECTION_CUE = "▼ SCROLL TO DESCEND";
const MONOSPACE_ADVANCE_RATIO = 0.6;
const MAX_HEADING_LINES = 2;
const DESCENT_PARAGRAPH_GAP_ROWS = 1;
const HEADING_BAR_ROWS = 2;
const BODY_MAX_COLUMNS = 46;
const NARROW_LAYOUT_MAX_COLUMNS = 90;
const WORDMARK_WIDTH_SHARE = 0.7;
const WORDMARK_HEIGHT_SHARE = 0.4;
const WORDMARK_CENTER_SHARE = 0.28;
const TAGLINE_GAP_ROWS = 2;
const HORIZON_SHARE = 0.68;
const STAR_DENSITY = 0.02;
const STAR_CHARACTERS = [".", ".", "+", "*"] as const;
const BRIGHT_STAR_MINIMUM_INDEX = 2;
const WAVE_LENGTH_RADIANS = 0.22;
const WAVE_DRIFT_RADIANS = 0.06;
const WAVE_SHARE_NEAR_HORIZON = 0.75;
const NEAR_WATER_MAXIMUM_DEPTH = 0.35;
const MID_WATER_MAXIMUM_DEPTH = 0.65;
const RULER_TICK_SPACING_ROWS = 4;

const DESCENT_THEMES: Record<string, SceneTheme> = {
  hero: { dim: "#444444", mid: "#9a9a9a", bright: "#f4f4f4" },
  domains: { dim: "#0d4a3a", mid: "#27c08a", bright: "#b8ffe6" },
  team: { dim: "#5a3d0a", mid: "#e0931a", bright: "#ffe0a3" },
  join: { dim: "#5a1414", mid: "#e03030", bright: "#ffb3b3" },
};

export type DescentScene = {
  cells: SceneGrid;
  textLines: SceneTextLine[];
};

export type TextColumnContext = {
  scene: SceneGrid;
  textLines: SceneTextLine[];
  metrics: GlyphMetrics;
  theme: SceneTheme;
};

export type TextColumnCopy = {
  heading: string;
  paragraphs: readonly string[];
  longestHeadingCharacters: number;
  paragraphGapRows: number;
};

type PaintContext = TextColumnContext & { section: StrataSection };

const LONGEST_HEADING_CHARACTERS = Math.max(
  ...STRATA_SECTIONS.filter((section) => !section.useWordmarkGrid)
    .flatMap((section) => headingLines(section.heading))
    .map((line) => line.length),
);

export function headingLines(heading: string): string[] {
  const words = heading.toUpperCase().split(" ");
  if (words.length <= 2) return words;
  const splitIndex = Math.ceil(words.length / 2);
  return [words.slice(0, splitIndex).join(" "), words.slice(splitIndex).join(" ")];
}

function regionEndColumn(region: SceneRegion): number {
  return region.column + region.columns;
}

export function isInsideRegion(region: SceneRegion, column: number, row: number): boolean {
  return (
    column >= region.column &&
    column < regionEndColumn(region) &&
    row >= region.row &&
    row < region.row + region.rows
  );
}

export function addTextLine(
  context: TextColumnContext,
  text: string,
  column: number,
  centerRow: number,
  scale: number,
  align: CanvasTextAlign,
): void {
  context.textLines.push({
    text,
    column,
    centerRow,
    fontSizePixels: (scale * context.metrics.cellWidth) / MONOSPACE_ADVANCE_RATIO,
    color: context.theme.bright,
    align,
  });
}

function blitField(
  context: PaintContext,
  luminanceGrid: LuminanceGrid,
  region: SceneRegion,
): void {
  blitLuminance(context.scene, context.metrics, luminanceGrid, region, context.theme);
}

function paintChrome(context: PaintContext, sectionIndex: number): void {
  const { scene, metrics, section, theme } = context;
  const lastRow = metrics.rows - 1;
  const isLastSection = sectionIndex === STRATA_SECTIONS.length - 1;
  const depthText = `DEPTH ${String(sectionIndex * DEPTH_STEP_METERS).padStart(4, "0")} M`;
  const cueText = isLastSection ? LAST_SECTION_CUE : NEXT_SECTION_CUE;
  const brandText = "d4rkc0de";
  const rulerColumn = metrics.columns - 2;
  const rulerTopRow = 2;
  const rulerBottomRow = lastRow - 2;
  const markerRow =
    rulerTopRow +
    Math.round((sectionIndex / (STRATA_SECTIONS.length - 1)) * (rulerBottomRow - rulerTopRow));

  writeText(scene, metrics, `${formatIndexLabel(sectionIndex)} / ${section.label}`, MARGIN_COLUMNS, 0, theme.mid);
  writeText(scene, metrics, depthText, metrics.columns - MARGIN_COLUMNS - depthText.length, 0, theme.mid);
  drawHorizontalRule(scene, metrics, 1, theme.dim);
  drawHorizontalRule(scene, metrics, lastRow - 1, theme.dim);
  writeText(scene, metrics, cueText, MARGIN_COLUMNS, lastRow, theme.mid);
  writeText(scene, metrics, brandText, metrics.columns - MARGIN_COLUMNS - brandText.length, lastRow, theme.mid);

  for (let row = rulerTopRow; row <= rulerBottomRow; row++) {
    const isTick = (row - rulerTopRow) % RULER_TICK_SPACING_ROWS === 0;
    const isMarker = row === markerRow;
    writeText(
      scene,
      metrics,
      isMarker ? "■" : isTick ? "┤" : "│",
      rulerColumn,
      row,
      isMarker ? theme.bright : theme.dim,
    );
  }
}

function contentRegion(metrics: GlyphMetrics): SceneRegion {
  return {
    column: MARGIN_COLUMNS,
    row: CONTENT_TOP_ROW,
    columns: metrics.columns - MARGIN_COLUMNS * 2,
    rows: metrics.rows - CONTENT_TOP_ROW - CONTENT_BOTTOM_ROWS,
  };
}

function splitRegion(region: SceneRegion, leftShare: number): [SceneRegion, SceneRegion] {
  const leftColumns = Math.floor(region.columns * leftShare);
  const left = { ...region, columns: leftColumns };
  const right = {
    ...region,
    column: region.column + leftColumns + REGION_GAP_COLUMNS,
    columns: region.columns - leftColumns - REGION_GAP_COLUMNS,
  };
  return [left, right];
}

function paintStars(
  context: PaintContext,
  content: SceneRegion,
  horizonRow: number,
  clearRegions: SceneRegion[],
): void {
  const { scene, metrics, theme } = context;
  for (let row = content.row; row < horizonRow; row++) {
    for (let column = content.column; column < regionEndColumn(content); column++) {
      if (hashUnit(column, row) > STAR_DENSITY) continue;
      if (clearRegions.some((region) => isInsideRegion(region, column, row))) continue;
      const starIndex = Math.floor(hashUnit(column + 101, row + 37) * STAR_CHARACTERS.length);
      const color = starIndex >= BRIGHT_STAR_MINIMUM_INDEX ? theme.mid : theme.dim;
      writeText(scene, metrics, STAR_CHARACTERS[starIndex], column, row, color);
    }
  }
}

function paintWaves(context: PaintContext, content: SceneRegion, horizonRow: number): void {
  const { scene, metrics, theme } = context;
  const lastRow = content.row + content.rows - 1;
  const waterRows = Math.max(1, lastRow - horizonRow);

  for (let row = horizonRow + 1; row <= lastRow; row++) {
    const depthShare = (row - horizonRow) / waterRows;
    const crestShareNeeded = 1 - WAVE_SHARE_NEAR_HORIZON * (1 - depthShare);
    const isNearWater = depthShare <= NEAR_WATER_MAXIMUM_DEPTH;
    const isMidWater = depthShare <= MID_WATER_MAXIMUM_DEPTH;
    const character = isNearWater ? "~" : isMidWater ? "-" : ".";
    const color = isNearWater ? theme.bright : isMidWater ? theme.mid : theme.dim;

    for (let column = content.column; column < regionEndColumn(content); column++) {
      const crest =
        Math.sin(column * WAVE_LENGTH_RADIANS + row * 1.6) * 0.6 +
        Math.sin(column * WAVE_DRIFT_RADIANS - row * 0.5) * 0.4;
      if (0.5 + 0.5 * crest >= crestShareNeeded) {
        writeText(scene, metrics, character, column, row, color);
      }
    }
  }
}

function paintHero(context: PaintContext, content: SceneRegion): void {
  const { scene, metrics, section, theme } = context;
  const halfLength = Math.ceil(section.heading.length / 2);
  const wordmarkLines =
    metrics.columns <= NARROW_LAYOUT_MAX_COLUMNS
      ? [section.heading.slice(0, halfLength), section.heading.slice(halfLength)]
      : [section.heading];
  const longestLine = Math.max(...wordmarkLines.map((line) => line.length));
  const wordmarkScale = Math.min(
    (content.columns * WORDMARK_WIDTH_SHARE) / longestLine,
    (content.rows * WORDMARK_HEIGHT_SHARE) / wordmarkLines.length,
  );
  const centerColumn = content.column + content.columns / 2;
  const wordmarkCenterRow = content.row + content.rows * WORDMARK_CENTER_SHARE;
  const wordmarkHeightRows = wordmarkLines.length * wordmarkScale;

  wordmarkLines.forEach((line, lineIndex) => {
    const lineOffset = lineIndex - (wordmarkLines.length - 1) / 2;
    addTextLine(context, line, centerColumn, wordmarkCenterRow + lineOffset * wordmarkScale, wordmarkScale, "center");
  });

  const taglineRow = Math.round(wordmarkCenterRow + wordmarkHeightRows / 2) + TAGLINE_GAP_ROWS;
  const tagline = section.body[0];
  writeCenteredText(scene, metrics, tagline, content, taglineRow, theme.bright);

  const horizonRow = content.row + Math.round(content.rows * HORIZON_SHARE);
  drawHorizontalRule(scene, metrics, horizonRow, theme.dim);
  paintStars(context, content, horizonRow, [
    {
      column: centerColumn - (longestLine * wordmarkScale) / 2 - 2,
      row: wordmarkCenterRow - wordmarkHeightRows / 2 - 1,
      columns: longestLine * wordmarkScale + 4,
      rows: wordmarkHeightRows + 2,
    },
    {
      column: centerColumn - tagline.length / 2 - 2,
      row: taglineRow - 1,
      columns: tagline.length + 4,
      rows: 3,
    },
  ]);
  paintWaves(context, content, horizonRow);
}

export function paintTextColumn(
  context: TextColumnContext,
  region: SceneRegion,
  copy: TextColumnCopy,
): void {
  const { scene, metrics, theme } = context;
  const headings = headingLines(copy.heading);
  const bodyColumns = Math.min(region.columns, BODY_MAX_COLUMNS);
  const bodyParagraphs = copy.paragraphs.map((paragraph) => wrapText(paragraph, bodyColumns));
  const bodyRows =
    bodyParagraphs.reduce((totalRows, lines) => totalRows + lines.length, 0) +
    (bodyParagraphs.length - 1) * copy.paragraphGapRows;
  const availableHeadingRows = region.rows - bodyRows - HEADING_BAR_ROWS;
  const headingScale = Math.max(
    1,
    Math.min(
      Math.floor(region.columns / copy.longestHeadingCharacters),
      Math.floor(availableHeadingRows / MAX_HEADING_LINES),
    ),
  );

  headings.forEach((line, lineIndex) => {
    addTextLine(context, line, region.column, region.row + (lineIndex + 0.5) * headingScale, headingScale, "left");
  });
  writeFadeBar(
    scene,
    metrics,
    region.column,
    region.row + headings.length * headingScale,
    Math.max(...headings.map((line) => line.length)) * headingScale,
    theme.mid,
  );

  let nextRow = region.row + region.rows - bodyRows;
  bodyParagraphs.forEach((lines) => {
    lines.forEach((line) => {
      writeText(scene, metrics, line, region.column, nextRow, theme.bright);
      nextRow += 1;
    });
    nextRow += copy.paragraphGapRows;
  });
}

function paintDomainTiles(context: PaintContext, region: SceneRegion): void {
  const { scene, metrics, theme } = context;
  const tileColumns = Math.floor(region.columns / DOMAIN_TILE_COLUMNS);
  const tileRows = Math.floor(region.rows / DOMAIN_TILE_ROWS);

  HERO_DOMAINS.forEach((domain, domainIndex) => {
    const tile = {
      column: region.column + (domainIndex % DOMAIN_TILE_COLUMNS) * tileColumns,
      row: region.row + Math.floor(domainIndex / DOMAIN_TILE_COLUMNS) * tileRows,
      columns: tileColumns - 1,
      rows: tileRows - 1,
    };
    if (tile.columns < MINIMUM_TILE_SIZE || tile.rows < MINIMUM_TILE_SIZE) return;

    drawFrame(scene, metrics, tile, theme.dim);
    writeText(scene, metrics, ` ${formatIndexLabel(domainIndex)} / ${domain} `, tile.column + 2, tile.row, theme.mid);

    const shapeRegion = {
      column: tile.column + 2,
      row: tile.row + 2,
      columns: tile.columns - 4,
      rows: tile.rows - 3,
    };
    blitField(context, createDomainShapeField(regionMetrics(metrics, shapeRegion), domain), shapeRegion);
  });
}

function paintSonar(context: PaintContext, region: SceneRegion): void {
  if (!hasArea(region)) return;
  blitField(context, createSonarField(regionMetrics(context.metrics, region)), region);
}

function paintJoinTunnel(context: PaintContext, region: SceneRegion): void {
  const { scene, metrics, theme } = context;
  const tunnelRegion = { ...region, rows: region.rows - JOIN_CAPTION_ROWS };
  if (!hasArea(tunnelRegion)) return;
  blitField(context, createTunnelField(regionMetrics(metrics, tunnelRegion)), tunnelRegion);
  writeCenteredText(
    scene,
    metrics,
    `> ${CTFTIME_TEAM_URL.replace("https://", "")}`,
    region,
    region.row + region.rows - 1,
    theme.bright,
  );
}

const ART_PAINTERS: Record<string, (context: PaintContext, region: SceneRegion) => void> = {
  domains: paintDomainTiles,
  team: paintSonar,
  join: paintJoinTunnel,
};

function buildScene(
  metrics: GlyphMetrics,
  section: StrataSection,
  sectionIndex: number,
): DescentScene {
  const context: PaintContext = {
    scene: createSceneGrid(metrics),
    textLines: [],
    metrics,
    section,
    theme: DESCENT_THEMES[section.id],
  };
  const content = contentRegion(metrics);

  paintChrome(context, sectionIndex);
  if (section.useWordmarkGrid) {
    paintHero(context, content);
  } else {
    const [textRegion, artRegion] = splitRegion(content, TEXT_COLUMN_SHARE);
    paintTextColumn(context, textRegion, {
      heading: section.heading,
      paragraphs: section.body,
      longestHeadingCharacters: LONGEST_HEADING_CHARACTERS,
      paragraphGapRows: DESCENT_PARAGRAPH_GAP_ROWS,
    });
    ART_PAINTERS[section.id](context, artRegion);
  }
  return { cells: context.scene, textLines: context.textLines };
}

export function buildDescentScenes(metrics: GlyphMetrics): DescentScene[] {
  return STRATA_SECTIONS.map((section, sectionIndex) =>
    buildScene(metrics, section, sectionIndex),
  );
}
