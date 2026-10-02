import { findVariantBySlug, type VariantEntry } from "@/lib/variantRegistry";
import { AsciiEyesDemo } from "./AsciiEyesDemo";
import { AsciiRevealCardDemo } from "./AsciiRevealCardDemo";
import { CursorTrailDemo } from "./CursorTrailDemo";
import { FlagLockDemo } from "./FlagLockDemo";
import { HashAvalancheDemo } from "./HashAvalancheDemo";
import { HexXRayDemo } from "./HexXRayDemo";
import { JacquardLoom } from "./JacquardLoom";
import { OverflowStackDemo } from "./OverflowStackDemo";
import { PendulumSentence } from "./PendulumSentence";
import { ShadowPuppetType } from "./ShadowPuppetType";
import { ShapeCardDemo } from "./ShapeCardDemo";
import { StencilCutter } from "./StencilCutter";
import { TerminalCardDemo } from "./TerminalCardDemo";
import { WormSpreadDemo } from "./WormSpreadDemo";
import { WovenSentence } from "./WovenSentence";

export const COMPONENT_VARIANTS: readonly VariantEntry[] = [
  {
    slug: "cursor-trail",
    title: "Cursor Trail",
    summary:
      "A thin line follows the cursor. Colored glyphs spin off the line and fade out. Move the cursor to draw.",
    Component: CursorTrailDemo,
  },
  {
    slug: "reveal-card",
    title: "Reveal Card",
    summary:
      "Glyphs cover each card. Scroll down. The glyphs clear and show the card. Text, charts, and images all work.",
    Component: AsciiRevealCardDemo,
  },
  {
    slug: "terminal-card",
    title: "Terminal Card",
    summary:
      "A terminal card with colored text. Each color shows a message type: command, success, warning, error.",
    Component: TerminalCardDemo,
  },
  {
    slug: "ascii-eyes",
    title: "ASCII Eyes",
    summary:
      "Two eyes in ASCII stipple. Each red retina is 4 by 4 cells. The retinas follow the cursor.",
    Component: AsciiEyesDemo,
  },
  {
    slug: "shape-card",
    title: "Shape Card",
    summary:
      "A basic card. Clip or round each corner. Set the size of each cut. Use the controls to change the shape.",
    Component: ShapeCardDemo,
  },
  {
    slug: "hex-xray",
    title: "Hex X-Ray",
    summary:
      "A paragraph of text. A lens follows the cursor. Inside the lens, each letter shows as a byte. Move the lens away. The letters come back.",
    Component: HexXRayDemo,
  },
  {
    slug: "worm-spread",
    title: "Worm Spread",
    summary:
      "An ASCII network. Click a node to infect it. Packets carry the worm along the links. Right-click a node to patch it.",
    Component: WormSpreadDemo,
  },
  {
    slug: "hash-avalanche",
    title: "Hash Avalanche",
    summary:
      "Type text. A grid shows the hash as bits. Change one letter. About half of the bits flip in a wave.",
    Component: HashAvalancheDemo,
  },
  {
    slug: "overflow-stack",
    title: "Overflow Stack",
    summary:
      "A stack frame in ASCII. Make the payload longer. The buffer fills. The canary breaks. The return address changes.",
    Component: OverflowStackDemo,
  },
  {
    slug: "flag-lock",
    title: "Flag Lock",
    summary:
      "Each slot of the flag spins like a slot machine. Type the flag. A right character locks. A wrong flag shakes the lock.",
    Component: FlagLockDemo,
  },
  {
    slug: "pendulum-sentence",
    title: "Pendulum Sentence",
    summary:
      "A sentence hangs from the top. Each word swings on its own rope. Touch a word, push it, or drag it and let go. The words settle again.",
    Component: PendulumSentence,
  },
  {
    slug: "jacquard-loom",
    title: "Jacquard Loom",
    summary:
      "A loom of glyph threads. Each crossing is over or under. Weave rows with the shuttle. A hidden word appears from the weave.",
    Component: JacquardLoom,
  },
  {
    slug: "shadow-puppet-type",
    title: "Shadow Puppet Type",
    summary:
      "Small paper shards hang near a light. Move the light. The big shadow changes. At one place, the shadow reads as a phrase.",
    Component: ShadowPuppetType,
  },
  {
    slug: "woven-sentence",
    title: "Woven Sentence",
    summary:
      "A word made from woven strands of text. Lift a strand, reverse a crossing, or pull a strand through the cloth.",
    Component: WovenSentence,
  },
  {
    slug: "stencil-cutter",
    title: "Stencil Cutter",
    summary:
      "A dense top layer hides a lower layer. Cut holes with the cutter. The lower layer shows through. Press R to restore the stencil.",
    Component: StencilCutter,
  },
];

export function findComponentVariant(slug: string): VariantEntry | undefined {
  return findVariantBySlug(COMPONENT_VARIANTS, slug);
}
