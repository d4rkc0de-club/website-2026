"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "ABOUT", href: "/about" },
  { label: "PAST EVENTS", href: "/events" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="border-b border-line bg-panel">
      <div
        className={`mx-auto flex w-full items-center justify-between gap-6 px-6 py-5 transition-[max-width] duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] will-change-[max-width] sm:px-10 ${
          isHome ? "max-w-[100vw]" : "max-w-5xl"
        }`}
      >
        <Link
          href="/"
          className="font-mono text-lg tracking-tight text-accent transition-opacity hover:opacity-80 sm:text-xl"
        >
          d4rkc0de
        </Link>

        <nav className="hidden items-center gap-8 md:flex lg:gap-12">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`font-mono text-sm transition-colors hover:text-accent sm:text-base ${
                pathname === link.href ? "text-accent" : "text-foreground/85"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/join"
          className="rounded-sm bg-accent px-5 py-2 font-mono text-sm text-black transition-opacity hover:opacity-85 sm:px-7 sm:text-base"
        >
          join
        </Link>
      </div>
    </header>
  );
}
