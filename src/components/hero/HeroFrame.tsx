import Link from "next/link";
import type { ReactNode } from "react";
import {
  CTFTIME_TEAM_URL,
  HERO_ANSWERS,
  HERO_DOMAINS,
  HERO_TAGLINE,
  NAV_ITEMS,
} from "@/content/heroContent";
import { formatIndexLabel } from "@/lib/formatIndexLabel";

type HeroFrameProps = {
  variantTitle: string;
  children: ReactNode;
};

const MONO_LABEL_CLASS = "font-mono text-[11px] uppercase tracking-widest";

export function HeroFrame({ variantTitle, children }: HeroFrameProps) {
  return (
    <main className="flex h-dvh flex-col bg-void text-paper">
      <h1 className="sr-only">d4rkc0de</h1>

      <nav
        aria-label="Main"
        className={`${MONO_LABEL_CLASS} flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-line px-4 py-3`}
      >
        <ol className="flex flex-wrap gap-x-5 gap-y-1">
          {NAV_ITEMS.map(({ label, href }, itemIndex) => {
            const entryText = `${formatIndexLabel(itemIndex)} / ${label}`;
            return (
              <li key={label}>
                {href ? (
                  <Link href={href} className="hover:bg-paper hover:text-void">
                    {entryText}
                  </Link>
                ) : (
                  <span aria-disabled="true" className="text-mid">
                    {entryText}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <p className="text-mid">Variant / {variantTitle}</p>
      </nav>

      <div className="relative min-h-0 flex-1">{children}</div>

      <footer className="max-h-[45dvh] overflow-y-auto border-t border-line px-4 py-4">
        <div className="grid gap-6 md:grid-cols-[1fr_3fr]">
          <div className="flex flex-col gap-2">
            <p className={MONO_LABEL_CLASS}>{HERO_TAGLINE.join(" / ")}</p>
            <p className="font-mono text-[11px] text-mid">
              {HERO_DOMAINS.join(" · ")}
            </p>
            <a
              href={CTFTIME_TEAM_URL}
              target="_blank"
              rel="noreferrer"
              className={`${MONO_LABEL_CLASS} w-fit hover:bg-paper hover:text-void`}
            >
              CTFtime ↗
            </a>
          </div>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {HERO_ANSWERS.map(({ question, answer }) => (
              <div key={question}>
                <dt className={`${MONO_LABEL_CLASS} text-mid`}>{question}</dt>
                <dd className="mt-1 text-xs leading-snug text-light md:text-sm">
                  {answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </footer>
    </main>
  );
}
