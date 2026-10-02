"use client";

import { Configurable } from "./Configurable";
import { OverflowStack } from "./OverflowStack";
import { OVERFLOW_STACK_CONTROLS } from "./controls/overflowStackControls";

export function OverflowStackDemo() {
  return (
    <Configurable controls={OVERFLOW_STACK_CONTROLS}>
      {(config) => <OverflowStack config={config} />}
    </Configurable>
  );
}
