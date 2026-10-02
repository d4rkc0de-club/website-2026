"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HERO_TAGLINE } from "@/content/heroContent";
import { GLYPH_RAMP } from "@/lib/ascii/glyphStyle";

const BYTES_PER_ROW = 16;
const ROW_COUNT = 24;
const TOTAL_BYTES = BYTES_PER_ROW * ROW_COUNT;
const SUPERSAMPLE = 3;
const EASTER_EGG_SEQUENCE = "d4c0de";
const ENTROPY_BAR_GLYPHS = ["▁", "▂", "▃", "▅", "▇"] as const;
const ENTROPY_BUCKET_COUNT = ENTROPY_BAR_GLYPHS.length;

function rasteriseWordmarkToBytes(): Uint8Array {
  const rasterWidth = BYTES_PER_ROW * SUPERSAMPLE;
  const rasterHeight = ROW_COUNT * SUPERSAMPLE;

  const offscreen = document.createElement("canvas");
  offscreen.width = rasterWidth;
  offscreen.height = rasterHeight;
  const context = offscreen.getContext("2d");
  if (!context) return new Uint8Array(TOTAL_BYTES);

  context.fillStyle = "#000";
  context.fillRect(0, 0, rasterWidth, rasterHeight);
  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.textBaseline = "middle";

  const fontSize = rasterWidth * 0.28;
  context.font = `900 ${fontSize}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  context.fillText("d4rk", rasterWidth / 2, rasterHeight * 0.38);
  context.fillText("c0de", rasterWidth / 2, rasterHeight * 0.62);

  const imageData = context.getImageData(0, 0, rasterWidth, rasterHeight);
  const bytes = new Uint8Array(TOTAL_BYTES);
  const samplesPerCell = SUPERSAMPLE * SUPERSAMPLE;

  for (let row = 0; row < ROW_COUNT; row++) {
    for (let column = 0; column < BYTES_PER_ROW; column++) {
      let luminanceSum = 0;
      for (let sampleY = 0; sampleY < SUPERSAMPLE; sampleY++) {
        for (let sampleX = 0; sampleX < SUPERSAMPLE; sampleX++) {
          const pixelX = column * SUPERSAMPLE + sampleX;
          const pixelY = row * SUPERSAMPLE + sampleY;
          luminanceSum += imageData.data[(pixelY * rasterWidth + pixelX) * 4];
        }
      }
      bytes[row * BYTES_PER_ROW + column] = Math.round(luminanceSum / samplesPerCell);
    }
  }

  return bytes;
}

function byteToHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

function byteToGlyph(value: number): string {
  const glyphIndex = Math.min(GLYPH_RAMP.length - 1, Math.floor((value / 256) * GLYPH_RAMP.length));
  return GLYPH_RAMP[glyphIndex];
}

function byteToBinary(value: number): string {
  return value.toString(2).padStart(8, "0");
}

function byteToPrintableAscii(value: number): string {
  return value >= 32 && value <= 126 ? String.fromCharCode(value) : ".";
}

function formatOffset(byteIndex: number, displayOffset: number): string {
  return ((byteIndex + displayOffset) & 0xffffffff).toString(16).padStart(8, "0");
}

function computeEntropyBar(bytes: Uint8Array, patchedBytes: Map<number, number>): string {
  const bucketCounts = new Array(ENTROPY_BUCKET_COUNT).fill(0);
  const bucketSize = 256 / ENTROPY_BUCKET_COUNT;

  for (let byteIndex = 0; byteIndex < bytes.length; byteIndex++) {
    const value = patchedBytes.has(byteIndex) ? patchedBytes.get(byteIndex)! : bytes[byteIndex];
    const bucketIndex = Math.min(ENTROPY_BUCKET_COUNT - 1, Math.floor(value / bucketSize));
    bucketCounts[bucketIndex]++;
  }

  const maxCount = Math.max(...bucketCounts);
  if (maxCount === 0) return ENTROPY_BAR_GLYPHS.map(() => ENTROPY_BAR_GLYPHS[0]).join("");

  return bucketCounts
    .map((count) => {
      const scaledIndex = Math.round((count / maxCount) * (ENTROPY_BAR_GLYPHS.length - 1));
      return ENTROPY_BAR_GLYPHS[scaledIndex];
    })
    .join("");
}

function isWordmarkByte(value: number): boolean {
  return value > 30;
}

export function HexdumpHero() {
  const [originalBytes, setOriginalBytes] = useState<Uint8Array | null>(null);
  const [patchedBytes, setPatchedBytes] = useState<Map<number, number>>(() => new Map());
  const [cursorIndex, setCursorIndex] = useState<number | null>(null);
  const [editingHexInput, setEditingHexInput] = useState("");
  const [hoveredByteIndex, setHoveredByteIndex] = useState<number | null>(null);
  const [easterEggTriggered, setEasterEggTriggered] = useState(false);
  const keystrokeBufferRef = useRef("");
  const displayOffsetRef = useRef(0);
  const animationFrameRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOriginalBytes(rasteriseWordmarkToBytes());
  }, []);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotionQuery.matches) return;

    let lastTimestamp = performance.now();

    const tick = (timestamp: number) => {
      const deltaSeconds = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      displayOffsetRef.current = (displayOffsetRef.current + deltaSeconds * 0.5) % 0x100000;
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const getEffectiveByteValue = useCallback(
    (byteIndex: number): number => {
      if (!originalBytes) return 0;
      return patchedBytes.has(byteIndex) ? patchedBytes.get(byteIndex)! : originalBytes[byteIndex];
    },
    [originalBytes, patchedBytes],
  );

  const commitHexEdit = useCallback(
    (byteIndex: number, hexString: string) => {
      const parsedValue = parseInt(hexString, 16);
      if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 255) return;
      setPatchedBytes((previous) => {
        const updated = new Map(previous);
        updated.set(byteIndex, parsedValue);
        return updated;
      });
    },
    [],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!originalBytes) return;

      const key = event.key.toLowerCase();

      keystrokeBufferRef.current += key;
      if (keystrokeBufferRef.current.length > EASTER_EGG_SEQUENCE.length) {
        keystrokeBufferRef.current = keystrokeBufferRef.current.slice(-EASTER_EGG_SEQUENCE.length);
      }
      if (keystrokeBufferRef.current === EASTER_EGG_SEQUENCE && !easterEggTriggered) {
        setEasterEggTriggered(true);
      }

      if (key === "escape") {
        setCursorIndex(null);
        setEditingHexInput("");
        return;
      }

      if (key === "r" && cursorIndex === null) {
        setPatchedBytes(new Map());
        return;
      }

      if (cursorIndex !== null) {
        if (key === "arrowleft") {
          event.preventDefault();
          setCursorIndex(Math.max(0, cursorIndex - 1));
          setEditingHexInput("");
          return;
        }
        if (key === "arrowright") {
          event.preventDefault();
          setCursorIndex(Math.min(TOTAL_BYTES - 1, cursorIndex + 1));
          setEditingHexInput("");
          return;
        }
        if (key === "arrowup") {
          event.preventDefault();
          setCursorIndex(Math.max(0, cursorIndex - BYTES_PER_ROW));
          setEditingHexInput("");
          return;
        }
        if (key === "arrowdown") {
          event.preventDefault();
          setCursorIndex(Math.min(TOTAL_BYTES - 1, cursorIndex + BYTES_PER_ROW));
          setEditingHexInput("");
          return;
        }

        if (/^[0-9a-f]$/.test(key)) {
          event.preventDefault();
          const updatedInput = editingHexInput + key;
          if (updatedInput.length >= 2) {
            commitHexEdit(cursorIndex, updatedInput);
            setEditingHexInput("");
            setCursorIndex(Math.min(TOTAL_BYTES - 1, cursorIndex + 1));
          } else {
            setEditingHexInput(updatedInput);
          }
          return;
        }
      }
    },
    [originalBytes, cursorIndex, editingHexInput, easterEggTriggered, commitHexEdit],
  );

  if (!originalBytes) {
    return <div className="flex h-full items-center justify-center font-mono text-xs text-mid">Loading...</div>;
  }

  const activeByteIndex = hoveredByteIndex ?? cursorIndex;
  const entropyBar = computeEntropyBar(originalBytes, patchedBytes);
  const rowCount = Math.ceil(TOTAL_BYTES / BYTES_PER_ROW);

  const rows: React.ReactNode[] = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rowStartByteIndex = rowIndex * BYTES_PER_ROW;
    const offsetLabel = formatOffset(rowStartByteIndex, Math.floor(displayOffsetRef.current));

    const hexSpans: React.ReactNode[] = [];
    const gutterSpans: React.ReactNode[] = [];

    for (let columnIndex = 0; columnIndex < BYTES_PER_ROW; columnIndex++) {
      const byteIndex = rowStartByteIndex + columnIndex;
      if (byteIndex >= TOTAL_BYTES) break;

      const byteValue = getEffectiveByteValue(byteIndex);
      const isPatched = patchedBytes.has(byteIndex);
      const isHighlighted = byteIndex === activeByteIndex;
      const isCursor = byteIndex === cursorIndex;
      const isEasterEggGlyph = easterEggTriggered && isWordmarkByte(originalBytes[byteIndex]);

      let hexColorClass = "text-paper";
      if (isPatched) hexColorClass = "text-accent";
      if (isHighlighted) hexColorClass = "text-white";

      const hexDisplay = isCursor && editingHexInput.length === 1
        ? editingHexInput + "_"
        : byteToHex(byteValue);

      hexSpans.push(
        <span
          key={byteIndex}
          className={`${hexColorClass} cursor-pointer ${isCursor ? "animate-hexdump-blink" : ""}`}
          onPointerEnter={() => setHoveredByteIndex(byteIndex)}
          onPointerLeave={() => setHoveredByteIndex(null)}
          onClick={() => {
            setCursorIndex(byteIndex);
            setEditingHexInput("");
            containerRef.current?.focus();
          }}
        >
          {isPatched && !isHighlighted ? "*" : " "}
          {hexDisplay}
        </span>,
      );

      if (columnIndex === 7) {
        hexSpans.push(<span key="gap" className="text-line"> </span>);
      }

      let gutterColorClass = "text-light";
      if (isPatched) gutterColorClass = "text-accent";
      if (isHighlighted) gutterColorClass = "text-white";
      if (isEasterEggGlyph) gutterColorClass = "text-accent";

      gutterSpans.push(
        <span
          key={byteIndex}
          className={`${gutterColorClass} cursor-pointer`}
          onPointerEnter={() => setHoveredByteIndex(byteIndex)}
          onPointerLeave={() => setHoveredByteIndex(null)}
          onClick={() => {
            setCursorIndex(byteIndex);
            setEditingHexInput("");
            containerRef.current?.focus();
          }}
        >
          {byteToGlyph(byteValue)}
        </span>,
      );
    }

    rows.push(
      <div key={rowIndex} className="flex">
        <span className="text-mid select-none">{offsetLabel}</span>
        <span className="text-line select-none">  </span>
        <span className="inline-flex">{hexSpans}</span>
        <span className="text-line select-none">  </span>
        <span className="text-mid select-none">|</span>
        <span className="inline-flex">{gutterSpans}</span>
        <span className="text-mid select-none">|</span>
      </div>,
    );
  }

  const activeByteValue = activeByteIndex !== null ? getEffectiveByteValue(activeByteIndex) : null;

  const previewGlyphs: string[] = [];
  for (let byteIndex = 0; byteIndex < TOTAL_BYTES; byteIndex++) {
    previewGlyphs.push(byteToGlyph(getEffectiveByteValue(byteIndex)));
  }
  const previewRows: string[] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rowStart = rowIndex * BYTES_PER_ROW;
    previewRows.push(previewGlyphs.slice(rowStart, rowStart + BYTES_PER_ROW).join(""));
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex h-full flex-col bg-void font-mono text-xs leading-relaxed outline-none md:text-sm"
    >
      <header className="border-b border-line px-3 py-3 md:px-6 md:py-4">
        <p className="text-[10px] uppercase tracking-widest text-mid md:text-[11px]">
          {HERO_TAGLINE.join(" / ")}
        </p>
        <h2 className="mt-1 text-lg font-black uppercase tracking-tight text-paper md:text-2xl">
          d4rkc0de
        </h2>
        <p className="mt-2 max-w-2xl text-[11px] leading-snug text-light md:text-xs">
          This view shows the club wordmark as raw bytes. You can read and patch bytes. The preview shows the same data as ASCII art.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="hidden min-h-0 flex-1 overflow-y-auto px-3 py-3 md:block md:px-6 md:py-4">
          <pre className="whitespace-pre">{rows}</pre>
        </div>
        <aside className="flex shrink-0 flex-col border-line md:w-64 md:border-l">
          <p className="border-b border-line px-3 py-2 text-[10px] uppercase tracking-widest text-mid">
            Wordmark preview
          </p>
          <pre className="overflow-x-auto px-3 py-3 text-[10px] leading-none text-paper md:text-xs">
            {previewRows.join("\n")}
          </pre>
        </aside>
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-line px-3 py-3 md:hidden md:border-t-0 md:px-6 md:py-4">
          <pre className="whitespace-pre">{rows}</pre>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-3 py-2 text-[10px] uppercase tracking-widest text-mid md:px-6 md:text-xs">
        <span>
          offset: {activeByteIndex !== null ? `0x${formatOffset(activeByteIndex, 0)}` : "---"}
        </span>
        {activeByteValue !== null && (
          <>
            <span className="text-line">·</span>
            <span className="text-paper">
              0x{byteToHex(activeByteValue)} · {activeByteValue} · &apos;{byteToPrintableAscii(activeByteValue)}&apos; · {byteToBinary(activeByteValue)}
            </span>
          </>
        )}
        <span className="text-line">·</span>
        <span>
          patched: <span className={patchedBytes.size > 0 ? "text-accent" : "text-mid"}>{patchedBytes.size}</span>
        </span>
        <span className="text-line">·</span>
        <span className="text-light">{entropyBar}</span>
        {cursorIndex !== null && (
          <>
            <span className="text-line">·</span>
            <span className="text-mid">esc exit · ←→↑↓ move · hex edit · r repair</span>
          </>
        )}
      </div>
    </div>
  );
}
