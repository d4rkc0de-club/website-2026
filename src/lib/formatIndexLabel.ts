export function formatIndexLabel(zeroBasedIndex: number): string {
  return String(zeroBasedIndex + 1).padStart(2, "0");
}
