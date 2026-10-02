"use client";

import { AsciiEyes } from "./AsciiEyes";
import { Configurable } from "./Configurable";
import { ASCII_EYES_CONTROLS } from "./controls/asciiEyesControls";

export function AsciiEyesDemo() {
  return (
    <Configurable controls={ASCII_EYES_CONTROLS}>
      {(config) => <AsciiEyes config={config} />}
    </Configurable>
  );
}
