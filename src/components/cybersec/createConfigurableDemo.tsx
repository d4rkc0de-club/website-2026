import type { ComponentType } from "react";
import type { ConfigOf, Control } from "@/lib/variantControls";
import { Configurable } from "../variants/Configurable";

export function createConfigurableDemo<const Controls extends readonly Control[]>(
  controls: Controls,
  Visualisation: ComponentType<{ config: ConfigOf<Controls> }>,
) {
  return function ConfigurableDemo() {
    return (
      <Configurable controls={controls}>
        {(config) => <Visualisation config={config} />}
      </Configurable>
    );
  };
}
