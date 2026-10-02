import { defineControls, select, slider, toggle } from "@/lib/variantControls";

export const PAYLOAD_PATTERN_NAMES = ["A fill", "cyclic", "NOP sled"] as const;

export const OVERFLOW_STACK_CONTROLS = defineControls([
  slider("bufferSizeBytes", "Buffer size (bytes)", 8, 64, 4, 16),
  slider("payloadLengthBytes", "Payload length (bytes)", 0, 96, 1, 0),
  select("payloadPatternName", "Payload pattern", PAYLOAD_PATTERN_NAMES, "A fill"),
  toggle("isCanaryEnabled", "Stack canary", true),
]);
