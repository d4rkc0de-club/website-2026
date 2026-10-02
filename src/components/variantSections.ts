import type { VariantEntry } from "@/lib/variantRegistry";
import { CYBERSEC_VARIANTS } from "./cybersec/cybersecVariants";
import { HERO_VARIANTS } from "./hero/heroVariants";
import { LOADER_VARIANTS } from "./loaders/loaderVariants";
import { MICRO_VARIANTS } from "./micro/microVariants";
import { COMPONENT_VARIANTS } from "./variants/componentVariants";

export type VariantSection = {
  slug: string;
  title: string;
  routeBase: string;
  variants: readonly VariantEntry[];
};

export const HERO_SECTION: VariantSection = {
  slug: "hero",
  title: "Hero variants",
  routeBase: "/lab",
  variants: HERO_VARIANTS,
};

export const COMPONENT_SECTION: VariantSection = {
  slug: "component",
  title: "Component variants",
  routeBase: "/components",
  variants: COMPONENT_VARIANTS,
};

export const LOADER_SECTION: VariantSection = {
  slug: "loader",
  title: "Loader variants",
  routeBase: "/loaders",
  variants: LOADER_VARIANTS,
};

export const MICRO_SECTION: VariantSection = {
  slug: "micro",
  title: "Micro interactions",
  routeBase: "/micro",
  variants: MICRO_VARIANTS,
};

export const CYBERSEC_SECTION: VariantSection = {
  slug: "cybersec",
  title: "Cybersec components (visualised)",
  routeBase: "/cybersec",
  variants: CYBERSEC_VARIANTS,
};

export const VARIANT_SECTIONS: readonly VariantSection[] = [
  HERO_SECTION,
  COMPONENT_SECTION,
  LOADER_SECTION,
  MICRO_SECTION,
  CYBERSEC_SECTION,
];

export function sectionHref({ slug }: VariantSection): string {
  return `/?section=${slug}`;
}
