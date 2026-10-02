import { themeColorCssValue } from "@/lib/ascii/glyphStyle";
import type { ConfigOf } from "@/lib/variantControls";
import type { TERMINAL_CARD_CONTROLS, TERMINAL_TONES } from "./controls/terminalCardControls";

type TerminalTone = (typeof TERMINAL_TONES)[number];

export type TerminalSegment = { text: string; tone: TerminalTone };

export type TerminalLine = readonly TerminalSegment[];

export type TerminalCardConfig = ConfigOf<typeof TERMINAL_CARD_CONTROLS>;

type TerminalCardProps = {
  config: TerminalCardConfig;
  title: string;
  lines: readonly TerminalLine[];
};

const TITLE_BAR_DOT_CLASSES = ["bg-accent", "bg-wasp", "bg-signal"] as const;

export function TerminalCard({ config, title, lines }: TerminalCardProps) {
  const lastLineIndex = lines.length - 1;
  const borderColor = themeColorCssValue(config.borderColorName);

  return (
    <section
      aria-label={title}
      className="overflow-hidden border font-mono"
      style={{
        backgroundColor: themeColorCssValue(config.backgroundColorName),
        borderColor,
        borderWidth: config.borderWidthPixels,
        fontSize: config.fontSizePixels,
      }}
    >
      {config.showTitleBar && (
        <header
          className="flex items-center gap-3 border-b px-4 py-2 text-xs text-mid"
          style={{ borderColor, borderBottomWidth: config.borderWidthPixels }}
        >
          {config.showTitleDots && (
            <span aria-hidden="true" className="flex gap-1.5">
              {TITLE_BAR_DOT_CLASSES.map((dotClass) => (
                <span
                  key={dotClass}
                  className={dotClass}
                  style={{ width: config.titleDotSizePixels, height: config.titleDotSizePixels }}
                />
              ))}
            </span>
          )}
          <span>{title}</span>
        </header>
      )}
      <pre
        className="overflow-x-auto whitespace-pre-wrap"
        style={{ padding: config.paddingPixels, lineHeight: config.lineHeight }}
      >
        {lines.map((line, lineIndex) => (
          <span key={lineIndex} className="block">
            {line.map(({ text, tone }, segmentIndex) => (
              <span
                key={segmentIndex}
                style={{ color: themeColorCssValue(config[`${tone}ColorName`]) }}
              >
                {text}
              </span>
            ))}
            {config.showCursor && lineIndex === lastLineIndex && (
              <span
                aria-hidden="true"
                className="animate-hexdump-blink"
                style={{
                  backgroundColor: themeColorCssValue(config.cursorColorName),
                  animationDuration: `${config.cursorBlinkSeconds}s`,
                }}
              >
                {" "}
              </span>
            )}
          </span>
        ))}
      </pre>
    </section>
  );
}
