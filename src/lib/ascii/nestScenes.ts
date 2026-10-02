import { HERO_SLOGAN_LEAD, HERO_SLOGAN_TAIL, HERO_TAGLINE } from "@/content/heroContent";
import {
  NEST_ABOUT_FACTS,
  NEST_ABOUT_HEADING,
  NEST_ABOUT_PARAGRAPHS,
  NEST_COORDINATORS,
  NEST_COORDINATORS_HEADING,
  NEST_EVENTS,
  NEST_EVENTS_HEADING,
  NEST_HERO_HINT,
  NEST_JOIN_BUTTON_LABEL,
  NEST_JOIN_HEADING,
  NEST_JOIN_TEXT,
  NEST_WIN_RESULT,
} from "@/content/nestContent";
import { formatIndexLabel } from "@/lib/formatIndexLabel";
import {
  blockTextColumns,
  blockTextRows,
  drawBlockText,
  fitBlockScale,
  type BlockScale,
} from "./blockFont";
import { headingLines } from "./descentScenes";
import { progressBetween, smoothStep } from "./easing";
import { hashUnit } from "./fieldArt";
import { readColorVariable } from "./glyphStyle";
import {
  clearRegion,
  createSceneGrid,
  drawFrame,
  drawHexFrame,
  slantRowsForContentRows,
  wrapText,
  writeCenteredText,
  writeText,
  type SceneGrid,
  type SceneRegion,
  type SceneTheme,
} from "./sceneGrid";
import type { GlyphMetrics } from "./types";

const WIDE_LAYOUT_MIN_WIDTH_PIXELS = 768;
const MARGIN_COLUMNS = 3;
const MARGIN_ROWS = 2;
const REGION_GAP_COLUMNS = 3;
const WIDE_ART_START_SHARE = 0.5;
const NARROW_ART_START_SHARE = 0.62;
const TEXT_GAP_ROWS = 1;
const CAPTION_GAP_ROWS = 1;
const HEADING_GAP_ROWS = 2;
const PARAGRAPH_GAP_ROWS = 1;
const BLOCK_LINE_GAP_ROWS = 1;
const BODY_MAX_COLUMNS = 56;
const HERO_HEADING_ROW_SHARE = 0.6;
const HEADING_MAX_ROW_SHARE = 0.34;
const HONEYCOMB_PATTERNS = [" __   ", "/  \\__", "\\__/  "] as const;
const HONEYCOMB_BLOCK_COLUMNS = 6;
const HONEYCOMB_BLOCK_ROWS = 2;
const GLOW_HASH_OFFSET = 97;
const HERO_CRATER_SHARE = 0.2;
const HERO_INTACT_SHARE = 0.75;
const HERO_GLOW_SCALE = 0.7;
const DEBRIS_DENSITY = 0.14;
const DEBRIS_HASH_OFFSET = 53;
const DEBRIS_CHARACTERS = [".", ":", "+", "*"] as const;
const DEBRIS_BRIGHT_SHARE = 0.25;
const ABOUT_GLOW_SHARE = 0.2;
const FACT_SCALE: BlockScale = { pixelColumns: 1, pixelRows: 1 };
const FACT_HEX_PADDING_COLUMNS = 2;
const FACT_LABEL_GAP_ROWS = 1;
const FACT_HEX_GAP_ROWS = 1;
const TIMELINE_RAIL_CHARACTER = "│";
const TIMELINE_CONNECTOR = "──";
const TIMELINE_NODE = "◇";
const TIMELINE_WIN_NODE = "◆";
const TIMELINE_RAIL_INSET_COLUMNS = 2;
const TIMELINE_YEAR_OFFSET_COLUMNS = 4;
const TIMELINE_YEAR_GAP_COLUMNS = 2;
const TIMELINE_MAXIMUM_ENTRY_ROWS = 6;
const TIMELINE_LAST_ENTRY_ROWS = 2;
const TIMELINE_YEAR_COLUMNS =
  Math.max(...NEST_EVENTS.map(({ year }) => year.length)) + TIMELINE_YEAR_GAP_COLUMNS;
const COORDINATOR_MARKER = "◆";
const COORDINATOR_LINE_COUNT = 3;
const COORDINATOR_HEXES_PER_ROW = 2;
const COORDINATOR_HEX_ROW_COUNT = Math.ceil(NEST_COORDINATORS.length / COORDINATOR_HEXES_PER_ROW);
const COORDINATOR_HEX_PADDING_COLUMNS = 2;
const COORDINATOR_HEX_GAP_COLUMNS = 1;
const COORDINATOR_MINIMUM_SLANT_ROWS = 2;
const COORDINATOR_MAXIMUM_SLANT_ROWS = 5;
const JOIN_FILL_CHARACTER = "░";
const JOIN_LABEL_WIDTH_SHARE = 0.7;
const JOIN_LABEL_HEIGHT_SHARE = 0.5;
const JOIN_PLATE_PADDING_COLUMNS = 4;
const JOIN_PLATE_PADDING_ROWS = 2;

export type NestTheme = SceneTheme & { text: string };

type NestSceneContext = {
  scene: SceneGrid;
  metrics: GlyphMetrics;
  theme: NestTheme;
  textRegion: SceneRegion;
  artRegion: SceneRegion;
  headingScale: BlockScale;
  sectionIndex: number;
};

type TextEntry =
  | { kind: "block"; text: string; scale: BlockScale }
  | { kind: "line"; text: string; color: string }
  | { kind: "gap"; rows: number };

type NestSection = {
  paintArt: (context: NestSceneContext) => void;
  createText: (context: NestSceneContext) => TextEntry[];
};

type HoneycombShading = {
  intactShare: (column: number, row: number) => number;
  glowShare: (column: number, row: number) => number;
};

export function readNestTheme(): NestTheme {
  return {
    dim: readColorVariable("--color-wasp-dim"),
    mid: readColorVariable("--color-wasp-mid"),
    bright: readColorVariable("--color-wasp"),
    text: readColorVariable("--color-light"),
  };
}

function centeredOffset(availableSize: number, contentSize: number): number {
  return Math.max(0, Math.floor((availableSize - contentSize) / 2));
}

function findRegions(metrics: GlyphMetrics): { artRegion: SceneRegion; textRegion: SceneRegion } {
  const isWide = metrics.canvasWidth >= WIDE_LAYOUT_MIN_WIDTH_PIXELS;
  const fullColumns = metrics.columns - 2 * MARGIN_COLUMNS;
  const fullRows = metrics.rows - 2 * MARGIN_ROWS;
  if (isWide) {
    const artStartColumn = Math.floor(metrics.columns * WIDE_ART_START_SHARE);
    return {
      textRegion: {
        column: MARGIN_COLUMNS,
        row: MARGIN_ROWS,
        columns: artStartColumn - MARGIN_COLUMNS - REGION_GAP_COLUMNS,
        rows: fullRows,
      },
      artRegion: {
        column: artStartColumn,
        row: MARGIN_ROWS,
        columns: metrics.columns - artStartColumn - MARGIN_COLUMNS,
        rows: fullRows,
      },
    };
  }
  const artStartRow = Math.floor(metrics.rows * NARROW_ART_START_SHARE);
  return {
    textRegion: {
      column: MARGIN_COLUMNS,
      row: MARGIN_ROWS,
      columns: fullColumns,
      rows: artStartRow - MARGIN_ROWS - TEXT_GAP_ROWS,
    },
    artRegion: {
      column: MARGIN_COLUMNS,
      row: artStartRow,
      columns: fullColumns,
      rows: metrics.rows - artStartRow - MARGIN_ROWS,
    },
  };
}

function gapEntry(rows: number): TextEntry {
  return { kind: "gap", rows };
}

function lineEntry(text: string, color: string): TextEntry {
  return { kind: "line", text, color };
}

function blockEntry(text: string, scale: BlockScale): TextEntry {
  return { kind: "block", text, scale };
}

function entryRows(entry: TextEntry): number {
  if (entry.kind === "block") return blockTextRows(entry.scale);
  if (entry.kind === "gap") return entry.rows;
  return 1;
}

function paintTextEntries(context: NestSceneContext, entries: TextEntry[]): void {
  const { scene, metrics, theme, textRegion } = context;
  const totalRows = entries.reduce((total, entry) => total + entryRows(entry), 0);
  let row = textRegion.row + centeredOffset(textRegion.rows, totalRows);
  entries.forEach((entry) => {
    if (entry.kind === "block") {
      drawBlockText(scene, metrics, entry.text, textRegion.column, row, entry.scale, theme.bright, theme.dim);
    }
    if (entry.kind === "line") {
      writeText(scene, metrics, entry.text, textRegion.column, row, entry.color);
    }
    row += entryRows(entry);
  });
}

function captionEntries({ sectionIndex, theme }: NestSceneContext): TextEntry[] {
  const captionText = `${formatIndexLabel(sectionIndex)} / ${formatIndexLabel(NEST_SECTIONS.length - 1)}`;
  return [lineEntry(captionText, theme.mid), gapEntry(CAPTION_GAP_ROWS)];
}

function createCopyEntries(
  context: NestSceneContext,
  heading: string,
  paragraphs: readonly string[],
): TextEntry[] {
  const { textRegion, theme, headingScale } = context;
  const bodyColumns = Math.min(textRegion.columns, BODY_MAX_COLUMNS);
  const paragraphEntries = paragraphs.flatMap((paragraph) => [
    ...wrapText(paragraph, bodyColumns).map((line) => lineEntry(line, theme.text)),
    gapEntry(PARAGRAPH_GAP_ROWS),
  ]);
  return [
    ...captionEntries(context),
    blockEntry(heading.toUpperCase(), headingScale),
    ...(paragraphs.length > 0 ? [gapEntry(HEADING_GAP_ROWS), ...paragraphEntries] : []),
  ];
}

function createHeroEntries(context: NestSceneContext): TextEntry[] {
  const { metrics, textRegion, theme } = context;
  const sloganLines = headingLines(HERO_SLOGAN_LEAD);
  const sloganScale = fitBlockScale(
    sloganLines,
    textRegion.columns,
    Math.floor(textRegion.rows * HERO_HEADING_ROW_SHARE),
    metrics.cellAspect,
    BLOCK_LINE_GAP_ROWS,
  );
  return [
    ...captionEntries(context),
    ...sloganLines.flatMap((line, lineIndex) => [
      ...(lineIndex > 0 ? [gapEntry(BLOCK_LINE_GAP_ROWS)] : []),
      blockEntry(line, sloganScale),
    ]),
    gapEntry(TEXT_GAP_ROWS),
    lineEntry(HERO_SLOGAN_TAIL, theme.bright),
    gapEntry(TEXT_GAP_ROWS),
    ...HERO_TAGLINE.map((line) => lineEntry(line, theme.text)),
    gapEntry(TEXT_GAP_ROWS),
    lineEntry(NEST_HERO_HINT, theme.mid),
  ];
}

function honeycombCharacter(column: number, row: number): string {
  const patternIndex = row === 0 ? 0 : 1 + ((row - 1) % 2);
  return HONEYCOMB_PATTERNS[patternIndex][column % HONEYCOMB_BLOCK_COLUMNS];
}

function paintHoneycomb(
  { scene, metrics, theme, artRegion }: NestSceneContext,
  shading: HoneycombShading,
): void {
  for (let row = 0; row < artRegion.rows; row++) {
    for (let column = 0; column < artRegion.columns; column++) {
      const blockColumn = Math.floor(column / HONEYCOMB_BLOCK_COLUMNS);
      const blockRow = Math.floor(row / HONEYCOMB_BLOCK_ROWS);
      const blockCenterColumn = (blockColumn + 0.5) * HONEYCOMB_BLOCK_COLUMNS;
      const blockCenterRow = (blockRow + 0.5) * HONEYCOMB_BLOCK_ROWS;
      if (hashUnit(blockColumn, blockRow) >= shading.intactShare(blockCenterColumn, blockCenterRow)) continue;
      const isGlowing =
        hashUnit(blockColumn + GLOW_HASH_OFFSET, blockRow) < shading.glowShare(blockCenterColumn, blockCenterRow);
      writeText(
        scene,
        metrics,
        honeycombCharacter(column, row),
        artRegion.column + column,
        artRegion.row + row,
        isGlowing ? theme.bright : theme.dim,
      );
    }
  }
}

function paintCrackedHive(context: NestSceneContext): void {
  const { scene, metrics, theme, artRegion } = context;
  const centerColumn = artRegion.columns / 2;
  const centerRow = artRegion.rows / 2;
  const reachRows = Math.hypot(centerColumn / metrics.cellAspect, centerRow);
  const distanceShare = (column: number, row: number) =>
    Math.hypot((column - centerColumn) / metrics.cellAspect, row - centerRow) / reachRows;
  const intactShare = (column: number, row: number) =>
    smoothStep(progressBetween(distanceShare(column, row), HERO_CRATER_SHARE, HERO_INTACT_SHARE));

  paintHoneycomb(context, {
    intactShare,
    glowShare: (column, row) => (1 - distanceShare(column, row)) * HERO_GLOW_SCALE,
  });

  for (let row = 0; row < artRegion.rows; row++) {
    for (let column = 0; column < artRegion.columns; column++) {
      const cellIndex = (artRegion.row + row) * metrics.columns + artRegion.column + column;
      if (scene[cellIndex]) continue;
      if (hashUnit(column + DEBRIS_HASH_OFFSET, row) >= DEBRIS_DENSITY * (1 - intactShare(column, row))) continue;
      const character = DEBRIS_CHARACTERS[Math.floor(hashUnit(row, column + DEBRIS_HASH_OFFSET) * DEBRIS_CHARACTERS.length)];
      const color = hashUnit(column, row + DEBRIS_HASH_OFFSET) < DEBRIS_BRIGHT_SHARE ? theme.mid : theme.dim;
      writeText(scene, metrics, character, artRegion.column + column, artRegion.row + row, color);
    }
  }
}

function paintFactHexes({ scene, metrics, theme, artRegion }: NestSceneContext): void {
  const valueRows = blockTextRows(FACT_SCALE);
  const slantRows = slantRowsForContentRows(valueRows + FACT_LABEL_GAP_ROWS + 1);
  const contentColumns =
    Math.max(...NEST_ABOUT_FACTS.map(({ value }) => blockTextColumns(value, FACT_SCALE))) +
    2 * FACT_HEX_PADDING_COLUMNS;
  const hexColumns = contentColumns + 2 * slantRows;
  const hexRows = 2 * slantRows + 1;
  const stackRows = NEST_ABOUT_FACTS.length * hexRows + (NEST_ABOUT_FACTS.length - 1) * FACT_HEX_GAP_ROWS;
  const stackTop = artRegion.row + centeredOffset(artRegion.rows, stackRows);

  NEST_ABOUT_FACTS.forEach(({ value, label }, factIndex) => {
    const isRightAligned = factIndex % 2 === 1;
    const left = artRegion.column + (isRightAligned ? Math.max(0, artRegion.columns - hexColumns) : 0);
    const top = stackTop + factIndex * (hexRows + FACT_HEX_GAP_ROWS);
    const content = drawHexFrame(scene, metrics, left, top, slantRows, contentColumns, theme.bright);
    const valueColumn = content.column + centeredOffset(content.columns, blockTextColumns(value, FACT_SCALE));
    drawBlockText(scene, metrics, value, valueColumn, content.row, FACT_SCALE, theme.bright, theme.dim);
    writeCenteredText(
      scene,
      metrics,
      label.toUpperCase(),
      content,
      content.row + valueRows + FACT_LABEL_GAP_ROWS,
      theme.text,
    );
  });
}

function paintAboutArt(context: NestSceneContext): void {
  paintHoneycomb(context, { intactShare: () => 1, glowShare: () => ABOUT_GLOW_SHARE });
  paintFactHexes(context);
}

function paintEventTimeline({ scene, metrics, theme, artRegion }: NestSceneContext): void {
  const entryRowCount = Math.min(
    TIMELINE_MAXIMUM_ENTRY_ROWS,
    Math.floor(artRegion.rows / NEST_EVENTS.length),
  );
  const timelineRows = (NEST_EVENTS.length - 1) * entryRowCount + TIMELINE_LAST_ENTRY_ROWS;
  const firstRow = artRegion.row + centeredOffset(artRegion.rows, timelineRows);
  const railColumn = artRegion.column + TIMELINE_RAIL_INSET_COLUMNS;
  const yearColumn = railColumn + TIMELINE_YEAR_OFFSET_COLUMNS;
  const nameColumn = yearColumn + TIMELINE_YEAR_COLUMNS;

  for (let rowOffset = 0; rowOffset < timelineRows; rowOffset++) {
    writeText(scene, metrics, TIMELINE_RAIL_CHARACTER, railColumn, firstRow + rowOffset, theme.dim);
  }

  NEST_EVENTS.forEach(({ year, name, result }, eventIndex) => {
    const isWin = result === NEST_WIN_RESULT;
    const row = firstRow + eventIndex * entryRowCount;
    const accentColor = isWin ? theme.bright : theme.mid;
    writeText(scene, metrics, isWin ? TIMELINE_WIN_NODE : TIMELINE_NODE, railColumn, row, accentColor);
    writeText(scene, metrics, TIMELINE_CONNECTOR, railColumn + 1, row, theme.dim);
    writeText(scene, metrics, year, yearColumn, row, theme.bright);
    writeText(scene, metrics, name, nameColumn, row, theme.text);
    writeText(scene, metrics, result, nameColumn, row + 1, accentColor);
  });
}

function measureHexGrid(slantRows: number, contentColumns: number) {
  const hexColumns = contentColumns + 2 * slantRows;
  const hexRows = 2 * slantRows + 1;
  const pitchColumns = hexColumns + COORDINATOR_HEX_GAP_COLUMNS;
  const offsetColumns = Math.floor(pitchColumns / 2);
  return {
    hexRows,
    pitchColumns,
    offsetColumns,
    columns: COORDINATOR_HEXES_PER_ROW * pitchColumns - COORDINATOR_HEX_GAP_COLUMNS + offsetColumns,
    rows: COORDINATOR_HEX_ROW_COUNT * hexRows,
  };
}

function fitCoordinatorSlantRows(artRegion: SceneRegion, contentColumns: number): number {
  for (let slantRows = COORDINATOR_MAXIMUM_SLANT_ROWS; slantRows > COORDINATOR_MINIMUM_SLANT_ROWS; slantRows--) {
    const grid = measureHexGrid(slantRows, contentColumns);
    if (grid.columns <= artRegion.columns && grid.rows <= artRegion.rows) return slantRows;
  }
  return COORDINATOR_MINIMUM_SLANT_ROWS;
}

function paintCoordinatorHexes({ scene, metrics, theme, artRegion }: NestSceneContext): void {
  const longestLineColumns = Math.max(
    ...NEST_COORDINATORS.flatMap(({ name, role }) => [name.length, role.length]),
  );
  const contentColumns = longestLineColumns + 2 * COORDINATOR_HEX_PADDING_COLUMNS;
  const slantRows = fitCoordinatorSlantRows(artRegion, contentColumns);
  const grid = measureHexGrid(slantRows, contentColumns);
  const startColumn = artRegion.column + centeredOffset(artRegion.columns, grid.columns);
  const startRow = artRegion.row + centeredOffset(artRegion.rows, grid.rows);

  NEST_COORDINATORS.forEach(({ name, role }, coordinatorIndex) => {
    const gridRow = Math.floor(coordinatorIndex / COORDINATOR_HEXES_PER_ROW);
    const gridColumn = coordinatorIndex % COORDINATOR_HEXES_PER_ROW;
    const left = startColumn + gridColumn * grid.pitchColumns + (gridRow % 2) * grid.offsetColumns;
    const top = startRow + gridRow * grid.hexRows;
    const content = drawHexFrame(scene, metrics, left, top, slantRows, contentColumns, theme.mid);
    const firstLineRow = content.row + centeredOffset(content.rows, COORDINATOR_LINE_COUNT);
    writeCenteredText(scene, metrics, COORDINATOR_MARKER, content, firstLineRow, theme.bright);
    writeCenteredText(scene, metrics, name, content, firstLineRow + 1, theme.text);
    writeCenteredText(scene, metrics, role, content, firstLineRow + 2, theme.mid);
  });
}

function paintJoinButton({ scene, metrics, theme, artRegion }: NestSceneContext): void {
  for (let row = 1; row < artRegion.rows - 1; row++) {
    writeText(
      scene,
      metrics,
      JOIN_FILL_CHARACTER.repeat(artRegion.columns - 2),
      artRegion.column + 1,
      artRegion.row + row,
      theme.dim,
    );
  }
  drawFrame(scene, metrics, artRegion, theme.bright);

  const labelLines = headingLines(NEST_JOIN_BUTTON_LABEL);
  const labelScale = fitBlockScale(
    labelLines,
    Math.floor(artRegion.columns * JOIN_LABEL_WIDTH_SHARE),
    Math.floor(artRegion.rows * JOIN_LABEL_HEIGHT_SHARE),
    metrics.cellAspect,
    BLOCK_LINE_GAP_ROWS,
  );
  const labelColumns = Math.max(...labelLines.map((line) => blockTextColumns(line, labelScale)));
  const labelRows =
    labelLines.length * blockTextRows(labelScale) + (labelLines.length - 1) * BLOCK_LINE_GAP_ROWS;
  const plate: SceneRegion = {
    column: artRegion.column + centeredOffset(artRegion.columns, labelColumns + 2 * JOIN_PLATE_PADDING_COLUMNS),
    row: artRegion.row + centeredOffset(artRegion.rows, labelRows + 2 * JOIN_PLATE_PADDING_ROWS),
    columns: labelColumns + 2 * JOIN_PLATE_PADDING_COLUMNS,
    rows: labelRows + 2 * JOIN_PLATE_PADDING_ROWS,
  };
  clearRegion(scene, metrics, plate);
  drawFrame(scene, metrics, plate, theme.mid);

  labelLines.forEach((line, lineIndex) => {
    drawBlockText(
      scene,
      metrics,
      line,
      plate.column + JOIN_PLATE_PADDING_COLUMNS + centeredOffset(labelColumns, blockTextColumns(line, labelScale)),
      plate.row + JOIN_PLATE_PADDING_ROWS + lineIndex * (blockTextRows(labelScale) + BLOCK_LINE_GAP_ROWS),
      labelScale,
      theme.bright,
      theme.dim,
    );
  });
}

const LONGEST_HEADING =
  [NEST_ABOUT_HEADING, NEST_EVENTS_HEADING, NEST_COORDINATORS_HEADING, NEST_JOIN_HEADING]
    .map((heading) => heading.toUpperCase())
    .reduce((longest, heading) => (heading.length > longest.length ? heading : longest));

const NEST_SECTIONS: readonly NestSection[] = [
  { paintArt: paintCrackedHive, createText: createHeroEntries },
  {
    paintArt: paintAboutArt,
    createText: (context) => createCopyEntries(context, NEST_ABOUT_HEADING, NEST_ABOUT_PARAGRAPHS),
  },
  {
    paintArt: paintEventTimeline,
    createText: (context) => createCopyEntries(context, NEST_EVENTS_HEADING, []),
  },
  {
    paintArt: paintCoordinatorHexes,
    createText: (context) => createCopyEntries(context, NEST_COORDINATORS_HEADING, []),
  },
  {
    paintArt: paintJoinButton,
    createText: (context) => createCopyEntries(context, NEST_JOIN_HEADING, [NEST_JOIN_TEXT]),
  },
];

export function buildNestScenes(metrics: GlyphMetrics, theme: NestTheme): SceneGrid[] {
  const regions = findRegions(metrics);
  const headingScale = fitBlockScale(
    [LONGEST_HEADING],
    regions.textRegion.columns,
    Math.floor(regions.textRegion.rows * HEADING_MAX_ROW_SHARE),
    metrics.cellAspect,
    0,
  );
  return NEST_SECTIONS.map(({ paintArt, createText }, sectionIndex) => {
    const context: NestSceneContext = {
      scene: createSceneGrid(metrics),
      metrics,
      theme,
      headingScale,
      sectionIndex,
      ...regions,
    };
    paintArt(context);
    paintTextEntries(context, createText(context));
    return context.scene;
  });
}
