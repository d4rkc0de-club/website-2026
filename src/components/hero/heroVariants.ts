import { findVariantBySlug, type VariantEntry } from "@/lib/variantRegistry";
import { DecodeHero } from "./DecodeHero";
import { DescentHero } from "./DescentHero";
import { HexdumpHero } from "./HexdumpHero";
import { HomoglyphHero } from "./HomoglyphHero";
import { NestHero } from "./NestHero";
import { PhysicsHero } from "./PhysicsHero";
import { ReconstructHero } from "./ReconstructHero";
import { RelicHero } from "./RelicHero";
import { ShatterHero } from "./ShatterHero";
import { SolidsHero } from "./SolidsHero";
import { SpecimenHero } from "./SpecimenHero";
import { StrataHero } from "./StrataHero";
import { SwarmHero } from "./SwarmHero";

type HeroVariant = VariantEntry & { isFullBleed?: boolean };

export const HERO_VARIANTS: readonly HeroVariant[] = [
  {
    slug: "relic",
    title: "Relic",
    summary:
      "A full page in ASCII. Scroll down. A halftone bust, mountains, six domain shapes, a campus, eight faces, and a door. The same glyphs fly from one section to the next.",
    Component: RelicHero,
    isFullBleed: true,
  },
  {
    slug: "nest-2",
    title: "Nest 2",
    summary:
      "A wasp flies over a glyph field. The pointer calls the wasp. Scroll down. The glyphs fly out and write each section in ASCII: about, events, coordinators, and a join button.",
    Component: NestHero,
  },
  {
    slug: "homoglyph",
    title: "Homoglyph",
    summary:
      "The slogan swaps letters for look-alikes. Hover a letter to restore it and read its code point. Click to restore all.",
    Component: HomoglyphHero,
  },
  {
    slug: "descent",
    title: "Descent",
    summary:
      "One pool of glyphs. Scroll down. The glyphs fly out at random and form the next section.",
    Component: DescentHero,
  },
  {
    slug: "reconstruct",
    title: "Reconstruct",
    summary:
      "Noise forms an artwork. The artwork breaks apart. The pieces form the wordmark. The cursor adds density.",
    Component: ReconstructHero,
  },
  {
    slug: "decode",
    title: "Decode",
    summary:
      "A slider moves the wordmark from noise to signal. Use the mouse, touch, or keyboard.",
    Component: DecodeHero,
  },
  {
    slug: "physics",
    title: "Physics",
    summary:
      "Each character is a particle. The cursor pushes the particles away. They return to form the wordmark.",
    Component: PhysicsHero,
  },
  {
    slug: "hexdump",
    title: "Hexdump",
    summary:
      "The club wordmark as a byte dump. Read the header, preview the ASCII art, and patch bytes in the editor.",
    Component: HexdumpHero,
  },
  {
    slug: "swarm",
    title: "Swarm",
    summary:
      "Glyphs swarm into a tight wordmark. The pointer repels them slightly. Click to cycle club slides.",
    Component: SwarmHero,
  },
  {
    slug: "solids",
    title: "Solids",
    summary:
      "Brutalist 3D technical geometry. ASCII-shaded solids rendered by a software projector.",
    Component: SolidsHero,
  },
  {
    slug: "specimen",
    title: "Specimen",
    summary:
      "Club slides in ASCII halftone. Click to move from wordmark to tagline, domains, and join.",
    Component: SpecimenHero,
  },
  {
    slug: "strata",
    title: "Strata",
    summary:
      "Scroll down through club sections. The same glyphs rise and morph between each layer.",
    Component: StrataHero,
  },
  {
    slug: "shatter",
    title: "Shatter",
    summary:
      "One stone slab. Click to break it into six domain shards. Press Escape to fuse it again.",
    Component: ShatterHero,
  },
];

export function findHeroVariant(slug: string): HeroVariant | undefined {
  return findVariantBySlug(HERO_VARIANTS, slug);
}
