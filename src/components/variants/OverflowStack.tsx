import type { ConfigOf } from "@/lib/variantControls";
import { formatByte } from "@/lib/byteFormat";
import type { OVERFLOW_STACK_CONTROLS, PAYLOAD_PATTERN_NAMES } from "./controls/overflowStackControls";

type OverflowStackConfig = ConfigOf<typeof OVERFLOW_STACK_CONTROLS>;

type PayloadPatternName = (typeof PAYLOAD_PATTERN_NAMES)[number];

type StackRegion = "buffer" | "canary" | "savedBasePointer" | "returnAddress";

type StackByte = {
  value: number;
  region: StackRegion;
  isOverwritten: boolean;
};

const WORD_SIZE_BYTES = 4;
const BUFFER_BASE_ADDRESS = 0x7ffe1000;
const CANARY_BYTES = [0x00, 0x1c, 0x3a, 0x8f];
const SAVED_BASE_POINTER_BYTES = [0x40, 0x1a, 0xfe, 0x7f];
const RETURN_ADDRESS_BYTES = [0x16, 0x92, 0x04, 0x08];
const EMPTY_BUFFER_BYTE = 0x00;
const FILL_BYTE = 0x41;
const NOP_BYTE = 0x90;
const CYCLIC_LETTER_COUNT = 26;
const FIRST_LETTER_CODE = 0x61;
const FILLER_LETTER_CODE = 0x61;
const FIRST_PRINTABLE_CODE = 0x20;
const LAST_PRINTABLE_CODE = 0x7e;

const REGION_LABELS: Record<StackRegion, string> = {
  buffer: "buffer",
  canary: "canary 0x8f3a1c00",
  savedBasePointer: "saved EBP 0x7ffe1a40",
  returnAddress: "return address 0x08049216",
};

const UNTOUCHED_CLASS = "text-mid";
const OVERWRITTEN_CLASS_BY_REGION: Record<StackRegion, string> = {
  buffer: "text-paper",
  canary: "text-accent",
  savedBasePointer: "text-wasp",
  returnAddress: "text-accent",
};

function payloadByteAt(offset: number, patternName: PayloadPatternName): number {
  if (patternName === "A fill") return FILL_BYTE;
  if (patternName === "NOP sled") return NOP_BYTE;
  const isWordStart = offset % WORD_SIZE_BYTES === 0;
  return isWordStart
    ? FIRST_LETTER_CODE + (Math.floor(offset / WORD_SIZE_BYTES) % CYCLIC_LETTER_COUNT)
    : FILLER_LETTER_CODE;
}

function buildOriginalStack(config: OverflowStackConfig): Omit<StackByte, "isOverwritten">[] {
  const bufferBytes = Array.from({ length: config.bufferSizeBytes }, () => ({
    value: EMPTY_BUFFER_BYTE,
    region: "buffer" as const,
  }));
  const canaryBytes = config.isCanaryEnabled
    ? CANARY_BYTES.map((value) => ({ value, region: "canary" as const }))
    : [];
  return [
    ...bufferBytes,
    ...canaryBytes,
    ...SAVED_BASE_POINTER_BYTES.map((value) => ({ value, region: "savedBasePointer" as const })),
    ...RETURN_ADDRESS_BYTES.map((value) => ({ value, region: "returnAddress" as const })),
  ];
}

function buildStackAfterInput(config: OverflowStackConfig): StackByte[] {
  return buildOriginalStack(config).map((originalByte, offset) => {
    const isOverwritten = offset < config.payloadLengthBytes;
    return {
      region: originalByte.region,
      isOverwritten,
      value: isOverwritten ? payloadByteAt(offset, config.payloadPatternName) : originalByte.value,
    };
  });
}

function toPrintableCharacter(byteValue: number): string {
  const isPrintable = byteValue >= FIRST_PRINTABLE_CODE && byteValue <= LAST_PRINTABLE_CODE;
  return isPrintable ? String.fromCharCode(byteValue) : ".";
}

function readLittleEndianWord(wordBytes: StackByte[]): string {
  const reversedHex = [...wordBytes].reverse().map(({ value }) => formatByte(value, "hex"));
  return `0x${reversedHex.join("")}`;
}

function describeOutcome(stackBytes: StackByte[], config: OverflowStackConfig): string {
  const overwrittenIn = (region: StackRegion) =>
    stackBytes.some((stackByte) => stackByte.region === region && stackByte.isOverwritten);

  if (config.isCanaryEnabled && overwrittenIn("canary")) {
    return "The canary changed. The program stops: stack smashing detected.";
  }
  if (overwrittenIn("returnAddress")) {
    const returnWord = readLittleEndianWord(stackBytes.filter(({ region }) => region === "returnAddress"));
    return `The return address changed. The function returns to ${returnWord}. The attacker controls the program.`;
  }
  if (overwrittenIn("savedBasePointer")) {
    return "The saved EBP changed. The caller frame is now wrong.";
  }
  if (config.payloadLengthBytes > config.bufferSizeBytes) {
    return "The input is longer than the buffer.";
  }
  return "The input fits in the buffer. The stack is safe.";
}

function groupIntoWords(stackBytes: StackByte[]): { startOffset: number; wordBytes: StackByte[] }[] {
  return Array.from({ length: stackBytes.length / WORD_SIZE_BYTES }, (_, wordIndex) => ({
    startOffset: wordIndex * WORD_SIZE_BYTES,
    wordBytes: stackBytes.slice(wordIndex * WORD_SIZE_BYTES, (wordIndex + 1) * WORD_SIZE_BYTES),
  }));
}

function formatAddress(address: number): string {
  return `0x${address.toString(16).padStart(8, "0")}`;
}

type OverflowStackProps = {
  config: OverflowStackConfig;
};

export function OverflowStack({ config }: OverflowStackProps) {
  const stackBytes = buildStackAfterInput(config);
  const wordsFromHighToLowAddress = groupIntoWords(stackBytes).reverse();
  const border = `+${"-".repeat(12)}+${"-".repeat(WORD_SIZE_BYTES * 3 + 1)}+${"-".repeat(WORD_SIZE_BYTES + 2)}+`;

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <section aria-label="Stack frame" className="max-w-full overflow-x-auto font-mono text-sm">
        <p className="mb-2 text-xs uppercase tracking-widest text-mid">High address</p>
        <pre className="leading-snug">
          <span className="text-line">{border}</span>
          {wordsFromHighToLowAddress.map(({ startOffset, wordBytes }) => (
            <span key={startOffset} className="block">
              <span className="text-line">| </span>
              <span className="text-mid">{formatAddress(BUFFER_BASE_ADDRESS + startOffset)}</span>
              <span className="text-line"> | </span>
              {wordBytes.map(({ value, region, isOverwritten }, byteIndex) => (
                <span key={byteIndex} className={isOverwritten ? OVERWRITTEN_CLASS_BY_REGION[region] : UNTOUCHED_CLASS}>
                  {formatByte(value, "hex")}{" "}
                </span>
              ))}
              <span className="text-line">| </span>
              <span className="text-light">{wordBytes.map(({ value }) => toPrintableCharacter(value)).join("")}</span>
              <span className="text-line"> | </span>
              <span className="text-mid">{REGION_LABELS[wordBytes[0].region]}</span>
              {"\n"}
              <span className="text-line">{border}</span>
            </span>
          ))}
        </pre>
        <p className="mt-2 text-xs uppercase tracking-widest text-mid">Low address</p>
        <p className="mt-4 max-w-md text-sm text-light">{describeOutcome(stackBytes, config)}</p>
      </section>
    </div>
  );
}
