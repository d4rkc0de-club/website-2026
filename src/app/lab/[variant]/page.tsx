import { notFound } from "next/navigation";
import { HeroFrame } from "@/components/hero/HeroFrame";
import { HERO_VARIANTS, findHeroVariant } from "@/components/hero/heroVariants";

export const dynamicParams = false;

export function generateStaticParams() {
  return HERO_VARIANTS.map(({ slug }) => ({ variant: slug }));
}

export default async function HeroVariantPage({
  params,
}: PageProps<"/lab/[variant]">) {
  const { variant } = await params;
  const heroVariant = findHeroVariant(variant);
  if (!heroVariant) notFound();

  if (heroVariant.isFullBleed) return <heroVariant.Component />;

  return (
    <HeroFrame variantTitle={heroVariant.title}>
      <heroVariant.Component />
    </HeroFrame>
  );
}
