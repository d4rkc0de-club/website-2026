import Link from "next/link";
import type { ReactNode } from "react";
import { COMPONENT_SECTION, sectionHref } from "@/components/variantSections";

type ComponentFrameProps = {
  variantTitle: string;
  variantSummary: string;
  children: ReactNode;
};

const MONO_LABEL_CLASS = "font-mono text-[11px] uppercase tracking-widest";

export function ComponentFrame({ variantTitle, variantSummary, children }: ComponentFrameProps) {
  return (
    <main className="flex h-dvh flex-col bg-void text-paper">
      <header
        className={`${MONO_LABEL_CLASS} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-4 py-3`}
      >
        <Link href={sectionHref(COMPONENT_SECTION)} className="hover:bg-paper hover:text-void">
          [ ← Back ]
        </Link>
        <h1>Component / {variantTitle}</h1>
        <p className="w-full normal-case tracking-normal text-mid md:w-auto md:max-w-xl md:text-right">
          {variantSummary}
        </p>
      </header>
      <div className="relative min-h-0 flex-1 overflow-y-auto">{children}</div>
    </main>
  );
}
