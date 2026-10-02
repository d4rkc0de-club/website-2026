import { findVariantBySlug, type VariantEntry } from "@/lib/variantRegistry";
import {
  AsciiRevealLoaderDemo,
  CounterSwapLoaderDemo,
  CrackSplitLoaderDemo,
  HomoglyphResolveLoaderDemo,
  MonolithLoaderDemo,
  OverflowLoaderDemo,
  RedactionPeelLoaderDemo,
  SlabCurtainLoaderDemo,
  SliceAssembleLoaderDemo,
  TerminalRevealLoaderDemo,
} from "./loaderDemos";

export const LOADER_VARIANTS: readonly VariantEntry[] = [
  {
    slug: "ascii-reveal",
    title: "ASCII Reveal",
    summary:
      "Noise flickers on the screen. The glyphs settle at random and form the tagline.",
    Component: AsciiRevealLoaderDemo,
  },
  {
    slug: "terminal-reveal",
    title: "Terminal Reveal",
    summary:
      "A boot log runs with a progress bar. A prompt types a command. The tagline decrypts in big letters.",
    Component: TerminalRevealLoaderDemo,
  },
  {
    slug: "homoglyph-resolve",
    title: "Homoglyph Resolve",
    summary:
      "Each letter starts as a look-alike. From left to right, the look-alikes turn into the real letters.",
    Component: HomoglyphResolveLoaderDemo,
  },
  {
    slug: "redaction-peel",
    title: "Redaction Peel",
    summary:
      "Black bars hide the page. The bars peel away from the center and show the tagline.",
    Component: RedactionPeelLoaderDemo,
  },
  {
    slug: "overflow",
    title: "Overflow",
    summary:
      "A buffer fills with A. It overflows and floods the screen. The flood clears and leaves the tagline.",
    Component: OverflowLoaderDemo,
  },
  {
    slug: "crack-split",
    title: "Crack Split",
    summary:
      "A paper slab covers the screen. A red crack runs down the slab. The two halves slide apart.",
    Component: CrackSplitLoaderDemo,
  },
  {
    slug: "slab-curtain",
    title: "Slab Curtain",
    summary:
      "Six slabs slide in from alternate sides and cover the screen. They slide out the other side and leave the tagline.",
    Component: SlabCurtainLoaderDemo,
  },
  {
    slug: "counter-swap",
    title: "Counter Swap",
    summary:
      "A large counter runs from 0 to 100 above a red bar. The counter rises out of view. The tagline rises in.",
    Component: CounterSwapLoaderDemo,
  },
  {
    slug: "slice-assemble",
    title: "Slice Assemble",
    summary:
      "The tagline starts as ten broken strips. Each strip slides sideways into place.",
    Component: SliceAssembleLoaderDemo,
  },
  {
    slug: "monolith",
    title: "Monolith",
    summary:
      "A tall slab rises, widens to fill the screen, and retreats. The tagline inverts its colors as the slab passes.",
    Component: MonolithLoaderDemo,
  },
];

export function findLoaderVariant(slug: string): VariantEntry | undefined {
  return findVariantBySlug(LOADER_VARIANTS, slug);
}
