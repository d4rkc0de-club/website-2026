export const BYTE_FORMAT_NAMES = ["hex", "binary", "decimal"] as const;

export type ByteFormatName = (typeof BYTE_FORMAT_NAMES)[number];

const BYTE_FORMATS = {
  hex: { radix: 16, digitCount: 2 },
  binary: { radix: 2, digitCount: 8 },
  decimal: { radix: 10, digitCount: 3 },
} as const;

export function byteDigitCount(formatName: ByteFormatName): number {
  return BYTE_FORMATS[formatName].digitCount;
}

export function formatByte(byteValue: number, formatName: ByteFormatName): string {
  const { radix, digitCount } = BYTE_FORMATS[formatName];
  return byteValue.toString(radix).padStart(digitCount, "0");
}
