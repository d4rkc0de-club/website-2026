"use client";

import { Configurable } from "./Configurable";
import { HashAvalanche } from "./HashAvalanche";
import { HASH_AVALANCHE_CONTROLS } from "./controls/hashAvalancheControls";

export function HashAvalancheDemo() {
  return (
    <Configurable controls={HASH_AVALANCHE_CONTROLS}>
      {(config) => <HashAvalanche config={config} />}
    </Configurable>
  );
}
