import Link from "next/link";
import { STRATA_CTF_LINK, type StrataSection } from "@/content/strataSections";

export function SectionCopy({ section }: { section: StrataSection }) {
  return (
    <>
      <p className="font-mono text-[11px] uppercase tracking-widest text-mid">
        {section.label}
      </p>
      <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-paper md:text-5xl">
        {section.heading}
      </h2>
      {section.body.map((paragraph) => (
        <p key={paragraph} className="mt-4 max-w-xl text-sm leading-relaxed text-light md:text-base">
          {paragraph}
        </p>
      ))}
      {section.id === "join" && (
        <Link
          href={STRATA_CTF_LINK}
          target="_blank"
          rel="noreferrer"
          className="mt-6 block w-fit font-mono text-[11px] uppercase tracking-widest text-paper hover:bg-paper hover:text-void"
        >
          CTFtime profile ↗
        </Link>
      )}
    </>
  );
}

export function ScrollHint() {
  return (
    <p className="pointer-events-none absolute bottom-3 right-4 font-mono text-[10px] uppercase tracking-widest text-mid">
      Scroll to descend
    </p>
  );
}
