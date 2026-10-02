import type { GlyphFrame, PointerPosition } from "./types";

const DRAG_START_DISTANCE_PIXELS = 6;

export type PressPhase = "idle" | "started" | "held" | "tapped" | "dragEnded";

export type PressTracker = {
  wasPointerDown: boolean;
  origin: PointerPosition | null;
  hasMoved: boolean;
};

export function createPressTracker(): PressTracker {
  return { wasPointerDown: false, origin: null, hasMoved: false };
}

export function updatePressTracker(tracker: PressTracker, frame: GlyphFrame): PressPhase {
  const { isPointerDown, pointer } = frame;
  let phase: PressPhase = "idle";

  if (isPointerDown && !tracker.wasPointerDown) {
    tracker.origin = pointer;
    tracker.hasMoved = false;
    phase = "started";
  } else if (isPointerDown) {
    const { origin } = tracker;
    if (origin && pointer) {
      const travelPixels = Math.hypot(pointer.x - origin.x, pointer.y - origin.y);
      if (travelPixels > DRAG_START_DISTANCE_PIXELS) tracker.hasMoved = true;
    }
    phase = "held";
  } else if (tracker.wasPointerDown) {
    phase = tracker.hasMoved ? "dragEnded" : "tapped";
  }

  tracker.wasPointerDown = isPointerDown;
  return phase;
}
