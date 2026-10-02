"use client";

import { Configurable } from "./Configurable";
import { FlagLock } from "./FlagLock";
import { FLAG_LOCK_CONTROLS } from "./controls/flagLockControls";

export function FlagLockDemo() {
  return (
    <Configurable controls={FLAG_LOCK_CONTROLS}>
      {(config) => <FlagLock config={config} />}
    </Configurable>
  );
}
