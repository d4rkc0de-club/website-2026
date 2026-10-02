import { FACE_ACCESSORIES, type FaceAccessoryName } from "@/lib/ascii/faceAccessories";

const MONOSPACE_CHARACTER_WIDTH_EM = 0.6;

export function FaceAccessory({ accessoryName }: { accessoryName: FaceAccessoryName }) {
  const { lines, centerShare, widthShare } = FACE_ACCESSORIES[accessoryName];
  const columnCount = Math.max(...lines.map((line) => line.length));
  const fontSizeInContainerWidthUnits =
    (widthShare * 100) / (columnCount * MONOSPACE_CHARACTER_WIDTH_EM);

  return (
    <pre
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 font-mono font-bold leading-none text-paper [text-shadow:0_0_2px_var(--color-void)]"
      style={{
        top: `${centerShare * 100}%`,
        fontSize: `${fontSizeInContainerWidthUnits}cqw`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {lines.join("\n")}
    </pre>
  );
}
