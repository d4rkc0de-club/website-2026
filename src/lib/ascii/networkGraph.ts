import type { SceneRegion } from "./sceneGrid";
import type { GlyphMetrics } from "./types";

const MINIMUM_SPACING_SHARE = 0.7;
const MAX_PLACEMENT_ATTEMPTS = 60;

export type CellPosition = { column: number; row: number };

export type EdgeCell = CellPosition & { character: string };

export type NetworkEdge = {
  startNodeIndex: number;
  endNodeIndex: number;
  pathCells: EdgeCell[];
};

export type NetworkNode = CellPosition & { edgeIndexes: number[] };

export type NetworkGraph = { nodes: NetworkNode[]; edges: NetworkEdge[] };

function randomPositionInRegion(region: SceneRegion): CellPosition {
  return {
    column: region.column + Math.floor(Math.random() * region.columns),
    row: region.row + Math.floor(Math.random() * region.rows),
  };
}

function spacedDistance(first: CellPosition, second: CellPosition, cellAspect: number): number {
  return Math.hypot(first.column - second.column, (first.row - second.row) * cellAspect);
}

function placeNodes(region: SceneRegion, cellAspect: number, nodeCount: number): CellPosition[] {
  const regionArea = region.columns * region.rows * cellAspect;
  const minimumDistance = MINIMUM_SPACING_SHARE * Math.sqrt(regionArea / nodeCount);
  const positions: CellPosition[] = [];

  for (let nodeNumber = 0; nodeNumber < nodeCount; nodeNumber++) {
    let candidate = randomPositionInRegion(region);
    for (
      let attempt = 0;
      attempt < MAX_PLACEMENT_ATTEMPTS &&
      positions.some((position) => spacedDistance(position, candidate, cellAspect) < minimumDistance);
      attempt++
    ) {
      candidate = randomPositionInRegion(region);
    }
    positions.push(candidate);
  }
  return positions;
}

function lineGlyph(from: CellPosition, to: CellPosition): string {
  const deltaColumns = to.column - from.column;
  const deltaRows = to.row - from.row;
  if (deltaRows === 0) return "-";
  if (deltaColumns === 0) return "|";
  return deltaColumns * deltaRows > 0 ? "\\" : "/";
}

function cellLinePath(start: CellPosition, end: CellPosition): EdgeCell[] {
  const deltaColumns = Math.abs(end.column - start.column);
  const deltaRows = Math.abs(end.row - start.row);
  const columnStep = start.column < end.column ? 1 : -1;
  const rowStep = start.row < end.row ? 1 : -1;
  const positions: CellPosition[] = [];
  let error = deltaColumns - deltaRows;
  let { column, row } = start;

  for (;;) {
    positions.push({ column, row });
    if (column === end.column && row === end.row) break;
    const doubledError = 2 * error;
    if (doubledError > -deltaRows) {
      error -= deltaRows;
      column += columnStep;
    }
    if (doubledError < deltaColumns) {
      error += deltaColumns;
      row += rowStep;
    }
  }

  return positions.map((position, positionIndex) => {
    const isLast = positionIndex === positions.length - 1;
    const from = isLast ? positions[Math.max(0, positionIndex - 1)] : position;
    const to = isLast ? position : positions[positionIndex + 1];
    return { ...position, character: from === to ? "." : lineGlyph(from, to) };
  });
}

function connectNearestNodes(
  positions: CellPosition[],
  cellAspect: number,
  linksPerNode: number,
): NetworkEdge[] {
  const edgeKeys = new Set<string>();
  const edges: NetworkEdge[] = [];

  positions.forEach((position, nodeIndex) => {
    positions
      .map((otherPosition, otherIndex) => ({
        otherIndex,
        distance: spacedDistance(position, otherPosition, cellAspect),
      }))
      .filter(({ otherIndex }) => otherIndex !== nodeIndex)
      .sort((first, second) => first.distance - second.distance)
      .slice(0, linksPerNode)
      .forEach(({ otherIndex }) => {
        const edgeKey = `${Math.min(nodeIndex, otherIndex)}-${Math.max(nodeIndex, otherIndex)}`;
        if (edgeKeys.has(edgeKey)) return;
        edgeKeys.add(edgeKey);
        edges.push({
          startNodeIndex: nodeIndex,
          endNodeIndex: otherIndex,
          pathCells: cellLinePath(position, positions[otherIndex]),
        });
      });
  });
  return edges;
}

export function createNetworkGraph(
  { cellAspect }: GlyphMetrics,
  region: SceneRegion,
  nodeCount: number,
  linksPerNode: number,
): NetworkGraph {
  const positions = placeNodes(region, cellAspect, nodeCount);
  const edges = connectNearestNodes(positions, cellAspect, linksPerNode);
  const nodes = positions.map((position, nodeIndex) => ({
    ...position,
    edgeIndexes: edges.flatMap((edge, edgeIndex) =>
      edge.startNodeIndex === nodeIndex || edge.endNodeIndex === nodeIndex ? [edgeIndex] : [],
    ),
  }));
  return { nodes, edges };
}
