import Link from "next/link";
import type { ReactNode } from "react";
import { sectionHref, type VariantSection } from "@/components/variantSections";

type VariantFrameProps = {
  section: VariantSection;
  variantTitle: string;
  variantSummary: string;
  children: ReactNode;
};

const MONO_LABEL_CLASS = "font-mono text-[11px] uppercase tracking-widest";

export function VariantFrame({ section, variantTitle, variantSummary, children }: VariantFrameProps) {
  return (
    <main className="flex h-dvh flex-col bg-void text-paper">
      <header
        className={`${MONO_LABEL_CLASS} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-4 py-3`}
      >
        <Link href={sectionHref(section)} className="hover:bg-paper hover:text-void">
          [ ← Back ]
        </Link>
        <h1>
          {section.slug} / {variantTitle}
        </h1>
        <p className="w-full normal-case tracking-normal text-mid md:w-auto md:max-w-xl md:text-right">
          {variantSummary}
        </p>
      </header>
      <div className="relative min-h-0 flex-1 overflow-y-auto">{children}</div>
    </main>
  );
}
