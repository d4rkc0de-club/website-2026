import { notFound } from "next/navigation";
import { VariantFrame } from "@/components/VariantFrame";
import { COMPONENT_SECTION } from "@/components/variantSections";
import { COMPONENT_VARIANTS, findComponentVariant } from "@/components/variants/componentVariants";

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPONENT_VARIANTS.map(({ slug }) => ({ variant: slug }));
}

export default async function ComponentVariantPage({
  params,
}: PageProps<"/components/[variant]">) {
  const { variant } = await params;
  const componentVariant = findComponentVariant(variant);
  if (!componentVariant) notFound();

  return (
    <VariantFrame
      section={COMPONENT_SECTION}
      variantTitle={componentVariant.title}
      variantSummary={componentVariant.summary}
    >
      <componentVariant.Component />
    </VariantFrame>
  );
}
