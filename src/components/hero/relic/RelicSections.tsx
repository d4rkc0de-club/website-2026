import Image from "next/image";
import type { ComponentType, ReactNode } from "react";
import {
  RELIC_ABOUT,
  RELIC_DOMAINS,
  RELIC_EVENTS,
  RELIC_HERO,
  RELIC_JOIN,
  RELIC_LINKS,
  RELIC_BRAND,
  RELIC_PORTRAIT_BASE_URL,
  RELIC_TEAM,
  type RelicSectionId,
} from "@/content/relicContent";
import type { FaceAccessoryName } from "@/lib/ascii/faceAccessories";
import { FaceAccessory } from "./FaceAccessory";

export type SectionBodyProps = { goTo: (sectionId: RelicSectionId) => void };

const BODY_CLASS =
  "flex h-full flex-col gap-4 px-5 pb-6 pt-20 md:px-10 md:pt-24";
const LABEL_CLASS = "font-mono text-xs tracking-widest";
const BUTTON_CLASS = `${LABEL_CLASS} inline-block border border-current px-4 py-2 hover:border-accent hover:text-accent`;
const RULE_CLASS = "border-current/30";

function SectionHeading({ index, title, note }: { index: number; title: string; note?: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className={LABEL_CLASS}>{`[ ${String(index).padStart(2, "0")} ]`}</span>
      <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
      {note && <span className={`${LABEL_CLASS} hidden opacity-70 md:inline`}>{note}</span>}
    </div>
  );
}

function ArtSlot({ art, index, className }: { art: string; index?: number; className: string }) {
  return <div data-art={art} data-art-index={index} className={className} />;
}

function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className={BUTTON_CLASS}>
      {`[ ${children} ]`}
    </a>
  );
}

function ActionButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={BUTTON_CLASS}>
      {`[ ${children} ]`}
    </button>
  );
}

function Rail({ items, className }: { items: readonly string[]; className: string }) {
  return (
    <ul className={`${LABEL_CLASS} hidden flex-col gap-1 opacity-80 md:flex ${className}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function HomeBody({ goTo }: SectionBodyProps) {
  return (
    <div className="relative h-full">
      <ArtSlot
        art="bust"
        className="absolute inset-x-0 top-0 aspect-[280/183] md:left-[3%] md:right-auto md:top-1/2 md:w-[62%] md:-translate-y-1/2"
      />
      <div className="relative flex h-full flex-col justify-end gap-4 px-5 pb-6 md:flex-row md:items-center md:px-10">
        <Rail items={RELIC_HERO.leftRail} className="self-end" />
        <div className="flex flex-col gap-4 md:ml-auto md:w-[30%]">
          <p className={`${LABEL_CLASS} hidden opacity-70 md:block`}>{RELIC_BRAND.year}</p>
          <h1 className="font-display text-[clamp(2.6rem,6vw,6rem)] leading-none">{RELIC_BRAND.name}</h1>
          <p className="font-mono text-sm tracking-wider">
            {RELIC_BRAND.lines[1]}
            <br />
            {RELIC_BRAND.lines[0]}
          </p>
          <p className="max-w-sm font-mono text-sm leading-relaxed opacity-90">{RELIC_HERO.tagline}</p>
          <div>
            <ActionButton onClick={() => goTo("about")}>{RELIC_HERO.button}</ActionButton>
          </div>
        </div>
        <Rail items={RELIC_HERO.rightRail} className="self-end text-right" />
      </div>
    </div>
  );
}

function AboutBody({ goTo }: SectionBodyProps) {
  return (
    <div className={BODY_CLASS}>
      <SectionHeading index={2} title={RELIC_ABOUT.heading} />
      <div className="my-auto flex flex-col gap-6 md:flex-row md:items-end md:gap-10">
        <div className={`flex flex-col gap-4 border-l pl-4 md:w-[30%] md:shrink-0 ${RULE_CLASS}`}>
          {RELIC_ABOUT.paragraphs.map((paragraph) => (
            <p key={paragraph} className="font-mono text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
          <div>
            <ActionButton onClick={() => goTo("events")}>{RELIC_ABOUT.button}</ActionButton>
          </div>
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col gap-3">
          <ol className={`${LABEL_CLASS} grid grid-cols-4 opacity-80 md:absolute md:inset-x-0 md:top-0 md:pr-36`}>
            {RELIC_ABOUT.flow.map((step, stepIndex) => (
              <li key={step}>{stepIndex ? `→ ${step}` : step}</li>
            ))}
          </ol>
          <ul className={`${LABEL_CLASS} flex flex-wrap gap-x-4 gap-y-1 border p-3 md:absolute md:right-0 md:top-0 md:flex-col ${RULE_CLASS}`}>
            {RELIC_ABOUT.domains.map((domain) => (
              <li key={domain}>{domain}</li>
            ))}
          </ul>
          <ArtSlot art="mountains" className="aspect-[2/1] w-full md:aspect-[10/3]" />
        </div>
      </div>
    </div>
  );
}

function DomainsBody() {
  return (
    <div className={BODY_CLASS}>
      <SectionHeading index={3} title={RELIC_DOMAINS.heading} />
      <ul className="grid min-h-0 flex-1 grid-cols-2 gap-3 md:grid-cols-6">
        {RELIC_DOMAINS.items.map(({ name, art, text }, itemIndex) => (
          <li key={name} className={`flex min-h-0 flex-col gap-2 border p-3 ${RULE_CLASS}`}>
            <span className={`${LABEL_CLASS} opacity-70`}>{`[ ${String(itemIndex + 1).padStart(2, "0")} ]`}</span>
            <ArtSlot art={art} className="min-h-0 flex-1" />
            <h3 className="font-display text-lg">{name}</h3>
            <p className="font-mono text-sm leading-snug opacity-90 md:text-xs">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EventsBody() {
  return (
    <div className={BODY_CLASS}>
      <SectionHeading index={4} title={RELIC_EVENTS.heading} note={RELIC_EVENTS.subheading} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row md:gap-6">
        <div className="flex flex-col gap-3 md:w-[26%]">
          <ul className={`min-h-0 overflow-y-auto border-t max-md:max-h-[26dvh] ${RULE_CLASS}`}>
            {RELIC_EVENTS.years.map(({ year, name }) => (
              <li key={year + name} className={`border-b ${RULE_CLASS}`}>
                <details className="group">
                  <summary className="grid cursor-pointer list-none grid-cols-[3.5rem_1fr_auto] items-center py-2 font-mono text-sm hover:text-accent">
                    <span>{year}</span>
                    <span>{name}</span>
                    <span className="group-open:rotate-45">+</span>
                  </summary>
                  <p className="pb-2 font-mono text-sm opacity-80">{RELIC_EVENTS.placeholderDetail}</p>
                </details>
              </li>
            ))}
          </ul>
          <div>
            <LinkButton href={RELIC_LINKS.allEvents}>{RELIC_EVENTS.allEventsButton}</LinkButton>
          </div>
        </div>
        <ArtSlot art="skyline" className="aspect-[800/420] w-full min-w-0 md:flex-1 md:self-end" />
      </div>
    </div>
  );
}

function TeamTile({ name, role, children }: { name: string; role: string; children: ReactNode }) {
  return (
    <li className={`flex min-w-0 flex-col gap-2 border p-2 ${RULE_CLASS}`}>
      <div className="@container relative aspect-[3/4] w-full overflow-hidden">{children}</div>
      <p className="break-words font-mono text-sm font-bold md:text-xs">{name}</p>
      <p className="font-mono text-sm opacity-70 md:text-xs">{role}</p>
    </li>
  );
}

function TeamPhoto({
  name,
  portraitPath,
  accessories,
}: {
  name: string;
  portraitPath: string;
  accessories: readonly FaceAccessoryName[];
}) {
  return (
    <>
      <Image
        src={`${RELIC_PORTRAIT_BASE_URL}/${portraitPath}.jpg`}
        alt={name}
        fill
        sizes="(min-width: 768px) 12vw, 25vw"
        className="object-cover"
      />
      {accessories.map((accessoryName) => (
        <FaceAccessory key={accessoryName} accessoryName={accessoryName} />
      ))}
    </>
  );
}

function TeamBody() {
  const { members, more } = RELIC_TEAM;
  return (
    <div className={BODY_CLASS}>
      <SectionHeading index={5} title={RELIC_TEAM.heading} note={RELIC_TEAM.subheading} />
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 md:flex-row md:items-center">
        <ul className="grid flex-1 grid-cols-4 gap-2 md:grid-cols-8">
          {members.map(({ name, role, portraitPath, accessories }) => (
            <TeamTile key={name} name={name} role={role}>
              <TeamPhoto name={name} portraitPath={portraitPath} accessories={accessories} />
            </TeamTile>
          ))}
          <TeamTile {...more}>
            <ArtSlot art="silhouette" index={members.length} className="h-full w-full" />
          </TeamTile>
        </ul>
        <blockquote className={`border p-4 font-mono text-sm leading-relaxed md:w-48 ${RULE_CLASS}`}>
          {RELIC_TEAM.quote}
        </blockquote>
      </div>
    </div>
  );
}

function JoinBody() {
  return (
    <div className={BODY_CLASS}>
      <SectionHeading index={6} title={RELIC_JOIN.heading} note={RELIC_JOIN.subheading} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row md:gap-8">
        <h3 className={`font-display text-[clamp(1.6rem,4vw,3.2rem)] leading-tight md:w-[26%] md:border-l md:pl-4 ${RULE_CLASS}`}>
          {RELIC_JOIN.headline.map((word) => (
            <span key={word} className="block">
              {word}
            </span>
          ))}
        </h3>
        <div className="flex flex-col justify-center gap-4 md:w-[30%]">
          <p className="font-mono text-sm leading-relaxed">{RELIC_JOIN.text}</p>
          <ul className="flex flex-col gap-1 font-mono text-sm">
            {RELIC_JOIN.checklist.map((item) => (
              <li key={item}>{`[  ] ${item}`}</li>
            ))}
          </ul>
          <div>
            <LinkButton href={RELIC_LINKS.join}>{RELIC_JOIN.button}</LinkButton>
          </div>
        </div>
        <ArtSlot art="doorway" className="min-h-0 flex-1 max-md:order-first max-md:min-h-[26dvh]" />
        <p className={`${LABEL_CLASS} hidden w-28 flex-col justify-center md:flex`}>
          {RELIC_JOIN.note.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </div>
    </div>
  );
}

export const RELIC_SECTION_BODIES: Record<RelicSectionId, ComponentType<SectionBodyProps>> = {
  home: HomeBody,
  about: AboutBody,
  domains: DomainsBody,
  events: EventsBody,
  team: TeamBody,
  join: JoinBody,
};
