"use client";

import {
  CTFTIME_TEAM_URL,
  HERO_ANSWERS,
  HERO_DOMAINS,
} from "@/content/heroContent";
import { REVEAL_DEMO_BAR_HEIGHTS, REVEAL_DEMO_HINT, REVEAL_DEMO_LINK_TEXT } from "@/content/componentDemoContent";
import { AsciiRevealCard } from "./AsciiRevealCard";
import { Configurable } from "./Configurable";
import { REVEAL_CARD_CONTROLS } from "./controls/revealCardControls";

const CARD_CLASS = "border border-line bg-panel p-6";
const LABEL_CLASS = "font-mono text-[11px] uppercase tracking-widest";
const BAR_SLOT_WIDTH = 40;
const BAR_WIDTH = 24;
const CHART_HEIGHT = 120;

export function AsciiRevealCardDemo() {
  return (
    <Configurable controls={REVEAL_CARD_CONTROLS}>
      {(config) => (
        <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 pb-[60dvh] pt-10">
          <p className={`${LABEL_CLASS} text-mid`}>{REVEAL_DEMO_HINT}</p>
          <div aria-hidden="true" className="h-[60dvh]" />

          <AsciiRevealCard config={config}>
            <dl className={`${CARD_CLASS} grid gap-4 md:grid-cols-2`}>
              {HERO_ANSWERS.map(({ question, answer }) => (
                <div key={question}>
                  <dt className={`${LABEL_CLASS} text-mid`}>{question}</dt>
                  <dd className="mt-1 text-sm text-light">{answer}</dd>
                </div>
              ))}
            </dl>
          </AsciiRevealCard>

          <AsciiRevealCard config={config}>
            <ul className={`${CARD_CLASS} flex flex-wrap gap-3`}>
              {HERO_DOMAINS.map((domain) => (
                <li key={domain} className={`${LABEL_CLASS} border border-line px-3 py-1`}>
                  {domain}
                </li>
              ))}
            </ul>
          </AsciiRevealCard>

          <AsciiRevealCard config={config}>
            <svg
              viewBox={`0 0 ${REVEAL_DEMO_BAR_HEIGHTS.length * BAR_SLOT_WIDTH} ${CHART_HEIGHT}`}
              role="img"
              aria-label="Bar chart"
              className={`${CARD_CLASS} w-full text-signal`}
            >
              {REVEAL_DEMO_BAR_HEIGHTS.map((barHeight, barIndex) => (
                <rect
                  key={barIndex}
                  x={barIndex * BAR_SLOT_WIDTH + (BAR_SLOT_WIDTH - BAR_WIDTH) / 2}
                  y={CHART_HEIGHT - barHeight}
                  width={BAR_WIDTH}
                  height={barHeight}
                  fill="currentColor"
                />
              ))}
            </svg>
          </AsciiRevealCard>

          <AsciiRevealCard config={config}>
            <div className={`${CARD_CLASS} flex flex-col items-start gap-4`}>
              <p className="text-sm text-light">{REVEAL_DEMO_LINK_TEXT}</p>
              <a
                href={CTFTIME_TEAM_URL}
                target="_blank"
                rel="noreferrer"
                className={`${LABEL_CLASS} border border-current px-4 py-2 hover:bg-paper hover:text-void`}
              >
                [ CTFtime ↗ ]
              </a>
            </div>
          </AsciiRevealCard>
        </div>
      )}
    </Configurable>
  );
}
