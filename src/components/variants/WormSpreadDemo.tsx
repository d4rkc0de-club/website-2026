"use client";

import { Configurable } from "./Configurable";
import { WormSpread } from "./WormSpread";
import { WORM_SPREAD_CONTROLS } from "./controls/wormSpreadControls";

export function WormSpreadDemo() {
  return (
    <Configurable controls={WORM_SPREAD_CONTROLS}>
      {(config) => <WormSpread config={config} />}
    </Configurable>
  );
}
