"use client";

import { Configurable } from "./Configurable";
import { HexXRay } from "./HexXRay";
import { HEX_XRAY_CONTROLS } from "./controls/hexXRayControls";

export function HexXRayDemo() {
  return (
    <Configurable controls={HEX_XRAY_CONTROLS}>
      {(config) => <HexXRay config={config} />}
    </Configurable>
  );
}
