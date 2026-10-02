import type { ComponentType } from "react";

export type VariantEntry = {
  slug: string;
  title: string;
  summary: string;
  Component: ComponentType;
};

export function findVariantBySlug<Variant extends VariantEntry>(
  variants: readonly Variant[],
  slug: string,
): Variant | undefined {
  return variants.find((variant) => variant.slug === slug);
}
