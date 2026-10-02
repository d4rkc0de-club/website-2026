"use client";

import { useCallback, useEffect, useRef, type PointerEvent } from "react";
import { HERO_DOMAINS, HERO_SLOGAN_LEAD, HERO_SLOGAN_TAIL } from "@/content/heroContent";
import {
  advanceShatter,
  createShatterInput,
  createShatterState,
  drawShatter,
  rebuildShatterLayout,
  type ShatterState,
} from "@/lib/ascii/shatterScene";
import type { GlyphFrame, PointerPosition } from "@/lib/ascii/types";
import { GlyphCanvas } from "./GlyphCanvas";

const INTERACTIVE_TAG_NAMES = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"]);

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && INTERACTIVE_TAG_NAMES.has(target.tagName);
}

function readPointerPosition(event: PointerEvent<HTMLDivElement>): PointerPosition {
  const bounds = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}

export function ShatterHero() {
  const inputRef = useRef(createShatterInput());

  const drawScene = useCallback((state: ShatterState, frame: GlyphFrame) => {
    advanceShatter(state, inputRef.current, frame);
    drawShatter(state, frame);
  }, []);

  useEffect(() => {
    const input = inputRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
      if (event.repeat || hasModifier || isInteractiveTarget(event.target)) return;

      switch (event.key) {
        case " ":
          event.preventDefault();
          input.isSpaceHeld = true;
          input.fractureRequest = { origin: null };
          break;
        case "Enter":
          input.fractureRequest = { origin: null };
          break;
        case "Escape":
          input.isFuseRequested = true;
          break;
        case "ArrowLeft":
          input.focusStep -= 1;
          break;
        case "ArrowRight":
          input.focusStep += 1;
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === " ") input.isSpaceHeld = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    inputRef.current.isPointerHeld = true;
    inputRef.current.pressPosition = readPointerPosition(event);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (inputRef.current.isPointerHeld) {
      inputRef.current.fractureRequest = { origin: readPointerPosition(event) };
    }
    inputRef.current.isPointerHeld = false;
    inputRef.current.pressPosition = null;
  };

  const handlePointerCancel = () => {
    inputRef.current.isPointerHeld = false;
    inputRef.current.pressPosition = null;
  };

  return (
    <div
      className="absolute inset-0 touch-none bg-void"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <GlyphCanvas
        createScene={createShatterState}
        drawScene={drawScene}
        mergeSceneOnResize={rebuildShatterLayout}
      />
      <div className="sr-only">
        <p>
          {HERO_SLOGAN_LEAD} {HERO_SLOGAN_TAIL}
        </p>
        <ul>
          {HERO_DOMAINS.map((domain) => (
            <li key={domain}>{domain}</li>
          ))}
        </ul>
        <p>
          Press Space to break the slab. Press the Left or Right arrow key to select a shard.
          Hold Space to pull the shard forward. Press Escape to fuse the slab.
        </p>
      </div>
    </div>
  );
}
