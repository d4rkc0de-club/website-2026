"use client";

import { ASCII_REVEAL_LOADER } from "./asciiRevealLoader";
import { CounterSwapLoader } from "./CounterSwapLoader";
import { CrackSplitLoader } from "./CrackSplitLoader";
import { DomLoaderDemo } from "./DomLoaderDemo";
import { HOMOGLYPH_RESOLVE_LOADER } from "./homoglyphResolveLoader";
import { LoaderDemo } from "./LoaderDemo";
import { MonolithLoader } from "./MonolithLoader";
import { OVERFLOW_LOADER } from "./overflowLoader";
import { REDACTION_PEEL_LOADER } from "./redactionPeelLoader";
import { SliceAssembleLoader } from "./SliceAssembleLoader";
import { SlabCurtainLoader } from "./SlabCurtainLoader";
import { TERMINAL_REVEAL_LOADER } from "./terminalRevealLoader";

export function AsciiRevealLoaderDemo() {
  return <LoaderDemo loader={ASCII_REVEAL_LOADER} />;
}

export function TerminalRevealLoaderDemo() {
  return <LoaderDemo loader={TERMINAL_REVEAL_LOADER} />;
}

export function HomoglyphResolveLoaderDemo() {
  return <LoaderDemo loader={HOMOGLYPH_RESOLVE_LOADER} />;
}

export function RedactionPeelLoaderDemo() {
  return <LoaderDemo loader={REDACTION_PEEL_LOADER} />;
}

export function OverflowLoaderDemo() {
  return <LoaderDemo loader={OVERFLOW_LOADER} />;
}

export function CrackSplitLoaderDemo() {
  return <DomLoaderDemo Loader={CrackSplitLoader} />;
}

export function SlabCurtainLoaderDemo() {
  return <DomLoaderDemo Loader={SlabCurtainLoader} />;
}

export function CounterSwapLoaderDemo() {
  return <DomLoaderDemo Loader={CounterSwapLoader} />;
}

export function SliceAssembleLoaderDemo() {
  return <DomLoaderDemo Loader={SliceAssembleLoader} />;
}

export function MonolithLoaderDemo() {
  return <DomLoaderDemo Loader={MonolithLoader} />;
}
