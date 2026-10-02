import { notFound } from "next/navigation";
import { CYBERSEC_VARIANTS, findCybersecVariant } from "@/components/cybersec/cybersecVariants";
import { VariantFrame } from "@/components/VariantFrame";
import { CYBERSEC_SECTION } from "@/components/variantSections";

export const dynamicParams = false;

export function generateStaticParams() {
  return CYBERSEC_VARIANTS.map(({ slug }) => ({ variant: slug }));
}

export default async function CybersecVariantPage({
  params,
}: PageProps<"/cybersec/[variant]">) {
  const { variant } = await params;
  const cybersecVariant = findCybersecVariant(variant);
  if (!cybersecVariant) notFound();

  return (
    <VariantFrame
      section={CYBERSEC_SECTION}
      variantTitle={cybersecVariant.title}
      variantSummary={cybersecVariant.summary}
    >
      <cybersecVariant.Component />
    </VariantFrame>
  );
}
