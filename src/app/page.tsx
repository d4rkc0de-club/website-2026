import Link from "next/link";
import { VARIANT_SECTIONS, sectionHref } from "@/components/variantSections";
import { formatIndexLabel } from "@/lib/formatIndexLabel";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { section: requestedSectionSlug } = await searchParams;
  const activeSection =
    VARIANT_SECTIONS.find(({ slug }) => slug === requestedSectionSlug) ?? VARIANT_SECTIONS[0];

  return (
    <main className="min-h-dvh bg-void px-4 py-10 text-paper md:px-10">
      <h1 className="font-mono text-xs uppercase tracking-widest text-mid">
        d4rkc0de / {activeSection.title.toLowerCase()}
      </h1>
      <nav
        aria-label="Variant sections"
        className="mt-6 flex w-fit max-w-full flex-wrap border border-line font-mono text-xs uppercase tracking-widest"
      >
        {VARIANT_SECTIONS.map((section) => {
          const isActive = section === activeSection;
          return (
            <Link
              key={section.slug}
              href={sectionHref(section)}
              aria-current={isActive ? "page" : undefined}
              className={`px-4 py-2 ${isActive ? "bg-paper text-void" : "hover:bg-line"}`}
            >
              {section.title}
            </Link>
          );
        })}
      </nav>
      <ol className="mt-10 border-t border-line">
        {activeSection.variants.map(({ slug, title, summary }, variantIndex) => (
          <li key={slug} className="border-b border-line">
            <Link
              href={`${activeSection.routeBase}/${slug}`}
              className="grid gap-2 py-6 hover:bg-paper hover:text-void md:grid-cols-[6rem_1fr_2fr] md:px-2"
            >
              <span className="font-mono text-xs">{formatIndexLabel(variantIndex)}</span>
              <span className="text-3xl font-black uppercase tracking-tight md:text-5xl">
                {title}
              </span>
              <span className="text-sm">{summary}</span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
