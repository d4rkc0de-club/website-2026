"use client";

import { GlyphCanvas, type CanvasPress } from "@/components/hero/GlyphCanvas";
import { WORM_SPREAD_HINT } from "@/content/componentDemoContent";
import { drawGlyphCell } from "@/lib/ascii/drawGlyphCell";
import { clearFrame, createThemeColorReader, type ThemeColorName } from "@/lib/ascii/glyphStyle";
import { createNetworkGraph, type NetworkGraph } from "@/lib/ascii/networkGraph";
import type { GlyphFrame, GlyphMetrics } from "@/lib/ascii/types";
import type { ConfigOf } from "@/lib/variantControls";
import type { WORM_SPREAD_CONTROLS } from "./controls/wormSpreadControls";

type WormSpreadConfig = ConfigOf<typeof WORM_SPREAD_CONTROLS>;

type NodeStatus = "healthy" | "infected" | "patching" | "patched";

type NodeState = {
  status: NodeStatus;
  patchCompleteSeconds: number;
  nextPacketSeconds: number;
};

type Packet = {
  edgeIndex: number;
  isReversed: boolean;
  progressShare: number;
  targetNodeIndex: number;
};

type WormScene = {
  graph: NetworkGraph;
  nodeStates: NodeState[];
  packets: Packet[];
  currentSeconds: number;
  readThemeColor: ReturnType<typeof createThemeColorReader>;
};

const NODE_GLYPHS: Record<NodeStatus, string> = {
  healthy: "(o)",
  infected: "(@)",
  patching: "(~)",
  patched: "(+)",
};

const PACKET_GLYPH = "*";
const EDGE_COLOR_NAME: ThemeColorName = "line";
const HUD_COLOR_NAME: ThemeColorName = "mid";
const PACKET_EMIT_INTERVAL_SECONDS = 1;
const MAX_STEP_SECONDS = 0.1;
const HIT_RADIUS_CELL_WIDTHS = 3;
const HUD_ROWS = 4;
const SIDE_MARGIN_COLUMNS = 4;
const BOTTOM_MARGIN_ROWS = 3;
const NODE_HALF_WIDTH_COLUMNS = 1;

function createScene(metrics: GlyphMetrics, config: WormSpreadConfig): WormScene {
  const region = {
    column: SIDE_MARGIN_COLUMNS,
    row: HUD_ROWS,
    columns: Math.max(1, metrics.columns - 2 * SIDE_MARGIN_COLUMNS),
    rows: Math.max(1, metrics.rows - HUD_ROWS - BOTTOM_MARGIN_ROWS),
  };
  const graph = createNetworkGraph(metrics, region, config.nodeCount, config.linksPerNode);
  return {
    graph,
    nodeStates: graph.nodes.map(() => ({
      status: "healthy",
      patchCompleteSeconds: 0,
      nextPacketSeconds: 0,
    })),
    packets: [],
    currentSeconds: 0,
    readThemeColor: createThemeColorReader(),
  };
}

function emitPackets(scene: WormScene, nodeIndex: number): void {
  scene.graph.nodes[nodeIndex].edgeIndexes.forEach((edgeIndex) => {
    const { startNodeIndex, endNodeIndex } = scene.graph.edges[edgeIndex];
    const isReversed = endNodeIndex === nodeIndex;
    scene.packets.push({
      edgeIndex,
      isReversed,
      progressShare: 0,
      targetNodeIndex: isReversed ? startNodeIndex : endNodeIndex,
    });
  });
}

function infectNode(scene: WormScene, nodeIndex: number): void {
  const nodeState = scene.nodeStates[nodeIndex];
  if (nodeState.status !== "healthy") return;
  nodeState.status = "infected";
  nodeState.nextPacketSeconds = scene.currentSeconds;
}

function startPatching(scene: WormScene, nodeIndex: number, healTimeSeconds: number): void {
  const nodeState = scene.nodeStates[nodeIndex];
  if (nodeState.status !== "healthy" && nodeState.status !== "infected") return;
  nodeState.status = "patching";
  nodeState.patchCompleteSeconds = scene.currentSeconds + healTimeSeconds;
}

function updateNodes(scene: WormScene): void {
  scene.nodeStates.forEach((nodeState, nodeIndex) => {
    if (nodeState.status === "patching" && scene.currentSeconds >= nodeState.patchCompleteSeconds) {
      nodeState.status = "patched";
    }
    if (nodeState.status === "infected" && scene.currentSeconds >= nodeState.nextPacketSeconds) {
      emitPackets(scene, nodeIndex);
      nodeState.nextPacketSeconds = scene.currentSeconds + PACKET_EMIT_INTERVAL_SECONDS;
    }
  });
}

function movePackets(scene: WormScene, stepSeconds: number, config: WormSpreadConfig): void {
  scene.packets = scene.packets.filter((packet) => {
    const pathLength = scene.graph.edges[packet.edgeIndex].pathCells.length;
    packet.progressShare += (stepSeconds * config.spreadSpeedCellsPerSecond) / pathLength;
    if (packet.progressShare < 1) return true;
    if (Math.random() < config.infectionChance) infectNode(scene, packet.targetNodeIndex);
    return false;
  });
}

function updateScene(scene: WormScene, { timeSeconds, deltaSeconds }: GlyphFrame, config: WormSpreadConfig): void {
  scene.currentSeconds = timeSeconds;
  updateNodes(scene);
  movePackets(scene, Math.min(deltaSeconds, MAX_STEP_SECONDS), config);
}

function statusColorName(status: NodeStatus, config: WormSpreadConfig): ThemeColorName {
  if (status === "infected") return config.infectedColorName;
  if (status === "healthy") return config.healthyColorName;
  return config.patchedColorName;
}

function drawEdges(scene: WormScene, { context, metrics }: GlyphFrame): void {
  const edgeColor = scene.readThemeColor(EDGE_COLOR_NAME);
  scene.graph.edges.forEach(({ pathCells }) => {
    pathCells.forEach(({ character, column, row }) => {
      drawGlyphCell(context, metrics, character, column, row, edgeColor);
    });
  });
}

function drawPackets(scene: WormScene, { context, metrics }: GlyphFrame, config: WormSpreadConfig): void {
  const packetColor = scene.readThemeColor(config.packetColorName);
  scene.packets.forEach(({ edgeIndex, isReversed, progressShare }) => {
    const { pathCells } = scene.graph.edges[edgeIndex];
    const forwardIndex = Math.min(pathCells.length - 1, Math.floor(progressShare * pathCells.length));
    const { column, row } = pathCells[isReversed ? pathCells.length - 1 - forwardIndex : forwardIndex];
    drawGlyphCell(context, metrics, PACKET_GLYPH, column, row, packetColor);
  });
}

function drawNodes(scene: WormScene, { context, metrics }: GlyphFrame, config: WormSpreadConfig): void {
  scene.graph.nodes.forEach(({ column, row }, nodeIndex) => {
    const { status } = scene.nodeStates[nodeIndex];
    const color = scene.readThemeColor(statusColorName(status, config));
    drawGlyphCell(context, metrics, NODE_GLYPHS[status], column - NODE_HALF_WIDTH_COLUMNS, row, color);
  });
}

function drawHud(scene: WormScene, { context, metrics }: GlyphFrame): void {
  const countOf = (status: NodeStatus) =>
    scene.nodeStates.filter((nodeState) => nodeState.status === status).length;
  const patchedCount = countOf("patching") + countOf("patched");
  const hudColor = scene.readThemeColor(HUD_COLOR_NAME);
  const statusLine = `HEALTHY ${countOf("healthy")}  INFECTED ${countOf("infected")}  PATCHED ${patchedCount}`;
  drawGlyphCell(context, metrics, statusLine, SIDE_MARGIN_COLUMNS, 1, hudColor);
  drawGlyphCell(context, metrics, WORM_SPREAD_HINT, SIDE_MARGIN_COLUMNS, 2, hudColor);
}

function findNodeAtPoint(graph: NetworkGraph, { x, y }: CanvasPress, metrics: GlyphMetrics): number {
  return graph.nodes.findIndex(
    ({ column, row }) =>
      Math.hypot(x - (column + 0.5) * metrics.cellWidth, y - (row + 0.5) * metrics.cellHeight) <=
      HIT_RADIUS_CELL_WIDTHS * metrics.cellWidth,
  );
}

type WormSpreadProps = {
  config: WormSpreadConfig;
};

export function WormSpread({ config }: WormSpreadProps) {
  const drawScene = (scene: WormScene, frame: GlyphFrame) => {
    updateScene(scene, frame, config);
    clearFrame(frame);
    drawEdges(scene, frame);
    drawPackets(scene, frame, config);
    drawNodes(scene, frame, config);
    drawHud(scene, frame);
  };

  const handlePress = (scene: WormScene, press: CanvasPress, metrics: GlyphMetrics) => {
    const nodeIndex = findNodeAtPoint(scene.graph, press, metrics);
    if (nodeIndex === -1) return;
    if (press.isSecondaryButton) startPatching(scene, nodeIndex, config.healTimeSeconds);
    else infectNode(scene, nodeIndex);
  };

  return (
    <GlyphCanvas
      key={`${config.nodeCount}-${config.linksPerNode}`}
      createScene={(metrics) => createScene(metrics, config)}
      drawScene={drawScene}
      onPress={handlePress}
    />
  );
}
