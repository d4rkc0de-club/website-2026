import { clamp, lerp } from "./easing";

export type LuminanceImage = { columns: number; rows: number; data: string };

export function createImageSampler(image: LuminanceImage) {
  const pixels = Uint8Array.from(atob(image.data), (character) => character.charCodeAt(0));
  return (widthShare: number, heightShare: number): number => {
    const sourceX = clamp(widthShare * image.columns - 0.5, 0, image.columns - 1);
    const sourceY = clamp(heightShare * image.rows - 0.5, 0, image.rows - 1);
    const leftColumn = Math.floor(sourceX);
    const topRow = Math.floor(sourceY);
    const rightColumn = Math.min(leftColumn + 1, image.columns - 1);
    const bottomRow = Math.min(topRow + 1, image.rows - 1);
    const pixelAt = (column: number, row: number) => pixels[row * image.columns + column] / 255;
    return lerp(
      lerp(pixelAt(leftColumn, topRow), pixelAt(rightColumn, topRow), sourceX - leftColumn),
      lerp(pixelAt(leftColumn, bottomRow), pixelAt(rightColumn, bottomRow), sourceX - leftColumn),
      sourceY - topRow,
    );
  };
}
