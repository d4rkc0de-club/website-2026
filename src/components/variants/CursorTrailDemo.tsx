"use client";

import { Configurable } from "./Configurable";
import { CursorTrail } from "./CursorTrail";
import { CURSOR_TRAIL_CONTROLS } from "./controls/cursorTrailControls";

export function CursorTrailDemo() {
  return (
    <Configurable controls={CURSOR_TRAIL_CONTROLS}>
      {(config) => <CursorTrail config={config} />}
    </Configurable>
  );
}
