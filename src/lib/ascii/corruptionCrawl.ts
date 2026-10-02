import type { SceneRegion } from "./sceneGrid";
import type { GlyphFrame } from "./types";

const CRAWLER_COUNT = 90;
const CRAWLER_STEP_SECONDS_MINIMUM = 0.07;
const CRAWLER_STEP_SECONDS_MAXIMUM = 0.22;
const CRAWLER_LIFE_SECONDS_MINIMUM = 3;
const CRAWLER_LIFE_SECONDS_MAXIMUM = 8;
const OUTWARD_STEP_PROBABILITY = 0.8;
const TRAIL_LIFE_SECONDS = 1.6;
const TRAIL_MAXIMUM_ALPHA = 0.7;
const TRAIL_CAPACITY = 2048;
const TRAIL_GLYPHS = "⠂⠄⠐⠠⠒⠤·:;01";
const NEVER_BORN_SECONDS = -1e9;

export type CrawlState = {
  origin: SceneRegion;
  crawlerColumns: Int16Array;
  crawlerRows: Int16Array;
  nextStepSeconds: Float64Array;
  expirySeconds: Float64Array;
  trailColumns: Int16Array;
  trailRows: Int16Array;
  trailBirthSeconds: Float64Array;
  trailGlyphs: string[];
  nextTrailIndex: number;
};

function randomBetween(minimum: number, maximum: number): number {
  return minimum + Math.random() * (maximum - minimum);
}

function randomInteger(count: number): number {
  return Math.floor(Math.random() * count);
}

export function createCrawlState(origin: SceneRegion): CrawlState {
  return {
    origin,
    crawlerColumns: new Int16Array(CRAWLER_COUNT),
    crawlerRows: new Int16Array(CRAWLER_COUNT),
    nextStepSeconds: new Float64Array(CRAWLER_COUNT),
    expirySeconds: new Float64Array(CRAWLER_COUNT),
    trailColumns: new Int16Array(TRAIL_CAPACITY),
    trailRows: new Int16Array(TRAIL_CAPACITY),
    trailBirthSeconds: new Float64Array(TRAIL_CAPACITY).fill(NEVER_BORN_SECONDS),
    trailGlyphs: new Array<string>(TRAIL_CAPACITY).fill(" "),
    nextTrailIndex: 0,
  };
}

function respawnCrawler(state: CrawlState, crawlerIndex: number, timeSeconds: number): void {
  const { column, row, columns, rows } = state.origin;
  const edgeColumn = column + randomInteger(columns);
  const edgeRow = row + randomInteger(rows);
  const side = randomInteger(4);
  state.crawlerColumns[crawlerIndex] = side === 2 ? column : side === 3 ? column + columns - 1 : edgeColumn;
  state.crawlerRows[crawlerIndex] = side === 0 ? row : side === 1 ? row + rows - 1 : edgeRow;
  state.expirySeconds[crawlerIndex] =
    timeSeconds + randomBetween(CRAWLER_LIFE_SECONDS_MINIMUM, CRAWLER_LIFE_SECONDS_MAXIMUM);
}

function stepCrawler(state: CrawlState, crawlerIndex: number, cellAspect: number): void {
  const { column, row, columns, rows } = state.origin;
  const outwardColumns = state.crawlerColumns[crawlerIndex] - (column + columns / 2);
  const outwardRows = (state.crawlerRows[crawlerIndex] - (row + rows / 2)) * cellAspect;
  const horizontalWeight =
    Math.abs(outwardColumns) / (Math.abs(outwardColumns) + Math.abs(outwardRows) || 1);
  const isOutwardStep = Math.random() < OUTWARD_STEP_PROBABILITY;
  const isHorizontalStep = (Math.random() < horizontalWeight) === isOutwardStep;
  const outwardDistance = isHorizontalStep ? outwardColumns : outwardRows;
  const stepDirection = isOutwardStep ? Math.sign(outwardDistance) || 1 : Math.random() < 0.5 ? -1 : 1;
  if (isHorizontalStep) state.crawlerColumns[crawlerIndex] += stepDirection;
  else state.crawlerRows[crawlerIndex] += stepDirection;
}

function leaveTrail(state: CrawlState, crawlerIndex: number, timeSeconds: number): void {
  const trailIndex = state.nextTrailIndex;
  state.trailColumns[trailIndex] = state.crawlerColumns[crawlerIndex];
  state.trailRows[trailIndex] = state.crawlerRows[crawlerIndex];
  state.trailBirthSeconds[trailIndex] = timeSeconds;
  state.trailGlyphs[trailIndex] = TRAIL_GLYPHS[randomInteger(TRAIL_GLYPHS.length)];
  state.nextTrailIndex = (trailIndex + 1) % TRAIL_CAPACITY;
}

function advanceCrawlers(state: CrawlState, frame: GlyphFrame): void {
  const { timeSeconds, metrics } = frame;
  for (let crawlerIndex = 0; crawlerIndex < CRAWLER_COUNT; crawlerIndex++) {
    const isOutsideStage =
      state.crawlerColumns[crawlerIndex] < 0 ||
      state.crawlerRows[crawlerIndex] < 0 ||
      state.crawlerColumns[crawlerIndex] >= metrics.columns ||
      state.crawlerRows[crawlerIndex] >= metrics.rows;
    if (isOutsideStage || timeSeconds >= state.expirySeconds[crawlerIndex]) {
      respawnCrawler(state, crawlerIndex, timeSeconds);
    }
    if (timeSeconds < state.nextStepSeconds[crawlerIndex]) continue;
    stepCrawler(state, crawlerIndex, metrics.cellAspect);
    leaveTrail(state, crawlerIndex, timeSeconds);
    state.nextStepSeconds[crawlerIndex] =
      timeSeconds + randomBetween(CRAWLER_STEP_SECONDS_MINIMUM, CRAWLER_STEP_SECONDS_MAXIMUM);
  }
}

export function drawCorruptionCrawl(
  state: CrawlState,
  frame: GlyphFrame,
  visibility: number,
  color: string,
): void {
  if (visibility <= 0) return;
  const { context, metrics, timeSeconds } = frame;
  advanceCrawlers(state, frame);
  context.fillStyle = color;
  for (let trailIndex = 0; trailIndex < TRAIL_CAPACITY; trailIndex++) {
    const trailAge = timeSeconds - state.trailBirthSeconds[trailIndex];
    if (trailAge >= TRAIL_LIFE_SECONDS) continue;
    context.globalAlpha = (1 - trailAge / TRAIL_LIFE_SECONDS) * TRAIL_MAXIMUM_ALPHA * visibility;
    context.fillText(
      state.trailGlyphs[trailIndex],
      state.trailColumns[trailIndex] * metrics.cellWidth,
      state.trailRows[trailIndex] * metrics.cellHeight,
    );
  }
  context.globalAlpha = 1;
}
