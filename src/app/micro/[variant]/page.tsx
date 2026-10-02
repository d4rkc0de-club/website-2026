import { notFound } from "next/navigation";
import { MicroStage } from "@/components/micro/MicroStage";
import { MICRO_VARIANTS, findMicroVariant } from "@/components/micro/microVariants";
import { VariantFrame } from "@/components/VariantFrame";
import { MICRO_SECTION } from "@/components/variantSections";

export const dynamicParams = false;

export function generateStaticParams() {
  return MICRO_VARIANTS.map(({ slug }) => ({ variant: slug }));
}

export default async function MicroVariantPage({
  params,
}: PageProps<"/micro/[variant]">) {
  const { variant } = await params;
  const microVariant = findMicroVariant(variant);
  if (!microVariant) notFound();

  return (
    <VariantFrame
      section={MICRO_SECTION}
      variantTitle={microVariant.title}
      variantSummary={microVariant.summary}
    >
      <MicroStage>
        <microVariant.Component />
      </MicroStage>
    </VariantFrame>
  );
}
