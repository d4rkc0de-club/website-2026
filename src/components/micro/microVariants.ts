import { findVariantBySlug, type VariantEntry } from "@/lib/variantRegistry";
import { CursorPillCard } from "./CursorPillCard";
import { DrawCheckButton } from "./DrawCheckButton";
import { GlitchButton } from "./GlitchButton";
import { HoldButton } from "./HoldButton";
import { MagneticButton } from "./MagneticButton";
import { MorphMenuIcon } from "./MorphMenuIcon";
import { RedactReveal } from "./RedactReveal";
import { RippleButton } from "./RippleButton";
import { RollCounter } from "./RollCounter";
import { ScrambleText } from "./ScrambleText";
import { ShakeInput } from "./ShakeInput";
import { TiltCard } from "./TiltCard";

export const MICRO_VARIANTS: readonly VariantEntry[] = [
  {
    slug: "glitch-button",
    title: "Glitch Button",
    summary:
      "A button with a label. Put the cursor on the button. A red layer and a blue layer cut the label into slices. The slices jump. Move the cursor away. The layers go away.",
    Component: GlitchButton,
  },
  {
    slug: "ripple-button",
    title: "Ripple Button",
    summary:
      "Press the button. A ring grows from the press point. The ring inverts the label colors and fades out. Each press makes a new ring.",
    Component: RippleButton,
  },
  {
    slug: "magnetic-button",
    title: "Magnetic Button",
    summary:
      "Move the cursor into the dashed area. The button moves toward the cursor. Move the cursor out. The button returns to its place.",
    Component: MagneticButton,
  },
  {
    slug: "scramble-text",
    title: "Scramble Text",
    summary:
      "Put the cursor on the text. The letters change to random glyphs. The letters then stop on the true text, one by one.",
    Component: ScrambleText,
  },
  {
    slug: "morph-menu",
    title: "Morph Menu",
    summary:
      "Click the icon. The three lines turn into a cross. Click again. The cross turns back into three lines.",
    Component: MorphMenuIcon,
  },
  {
    slug: "draw-check",
    title: "Draw Check",
    summary:
      "Click the button. A ring and a check mark draw in green. The label changes to Copied. After two seconds, the button resets.",
    Component: DrawCheckButton,
  },
  {
    slug: "cursor-pill",
    title: "Cursor Pill",
    summary:
      "Move the cursor over the card. The cursor goes away. A pill that says View follows the cursor. Move the cursor off the card. The pill goes away.",
    Component: CursorPillCard,
  },
  {
    slug: "hold-button",
    title: "Hold Button",
    summary:
      "Press and hold the button. A red bar fills the button from left to right. Hold for one second. The label changes to Wiped. Release early. The bar goes back. After two seconds, the button resets.",
    Component: HoldButton,
  },
  {
    slug: "tilt-card",
    title: "Tilt Card",
    summary:
      "Move the cursor over the card. The card tilts toward the cursor. A light spot follows the cursor. Move the cursor away. The card becomes flat again.",
    Component: TiltCard,
  },
  {
    slug: "redact-reveal",
    title: "Redact Reveal",
    summary:
      "A white bar hides each secret word. Put the cursor on a bar, or select it with the keyboard. The bar slides away and shows the word.",
    Component: RedactReveal,
  },
  {
    slug: "roll-counter",
    title: "Roll Counter",
    summary:
      "Click the button. The number goes up by one. Each digit rolls to its new value.",
    Component: RollCounter,
  },
  {
    slug: "shake-input",
    title: "Shake Input",
    summary:
      "Type text in the field. Press Enter. The text must have the flag{...} format. If the format is wrong, the field shakes and the border turns red. If the format is correct, the border turns green.",
    Component: ShakeInput,
  },
];

export function findMicroVariant(slug: string): VariantEntry | undefined {
  return findVariantBySlug(MICRO_VARIANTS, slug);
}
