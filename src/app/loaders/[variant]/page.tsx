import { notFound } from "next/navigation";
import { VariantFrame } from "@/components/VariantFrame";
import { LOADER_SECTION } from "@/components/variantSections";
import { LOADER_VARIANTS, findLoaderVariant } from "@/components/loaders/loaderVariants";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOADER_VARIANTS.map(({ slug }) => ({ variant: slug }));
}

export default async function LoaderVariantPage({
  params,
}: PageProps<"/loaders/[variant]">) {
  const { variant } = await params;
  const loaderVariant = findLoaderVariant(variant);
  if (!loaderVariant) notFound();

  return (
    <VariantFrame
      section={LOADER_SECTION}
      variantTitle={loaderVariant.title}
      variantSummary={loaderVariant.summary}
    >
      <loaderVariant.Component />
    </VariantFrame>
  );
}
