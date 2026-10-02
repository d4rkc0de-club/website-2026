export const HASH_ALGORITHM_NAMES = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

export type HashAlgorithmName = (typeof HASH_ALGORITHM_NAMES)[number];

const BITS_PER_BYTE = 8;

export async function digestToBits(algorithmName: HashAlgorithmName, text: string): Promise<number[]> {
  const digestBytes = new Uint8Array(
    await crypto.subtle.digest(algorithmName, new TextEncoder().encode(text)),
  );
  return Array.from(digestBytes).flatMap((byteValue) =>
    Array.from({ length: BITS_PER_BYTE }, (_, bitIndex) => (byteValue >> (BITS_PER_BYTE - 1 - bitIndex)) & 1),
  );
}
