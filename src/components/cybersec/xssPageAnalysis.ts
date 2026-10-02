import {
  XSS_BROKEN_IMAGE_TEXT,
  XSS_EMPTY_PAGE_TEXT,
  XSS_PAGE_CLOSE_TAG,
  XSS_PAGE_OPEN_TAG,
} from "@/content/cybersecContent";

export type XssTone = "pageCode" | "commentText" | "commentCode" | "escapedText";

export type XssCell = { character: string; tone: XssTone };

export type PageEffect = "text" | "tag" | "script";

export type CommentAnalysis = {
  pageCells: readonly XssCell[];
  visibleText: string;
  pageEffect: PageEffect;
  injectedCodeCount: number;
  isScriptRunning: boolean;
  isCookieSent: boolean;
};

const MARKUP_SEGMENT_PATTERN = /<script>.*?<\/script>|<[^>]*>|[^<]+/g;
const SCRIPT_BLOCK_PATTERN = /<script>.*?<\/script>/g;
const IMAGE_TAG_PATTERN = /<img[^>]*>/g;
const ANY_TAG_PATTERN = /<[^>]*>/g;
const HAS_ANY_TAG_PATTERN = /<[^>]*>/;
const HAS_SCRIPT_PATTERN = /<script>|onerror=/;

const ESCAPED_TEXT_BY_CHARACTER: Readonly<Record<string, string>> = {
  "<": "&lt;",
  ">": "&gt;",
};

function toUniformCells(text: string, tone: XssTone): XssCell[] {
  return [...text].map((character) => ({ character, tone }));
}

function buildEscapedCommentCells(commentText: string): XssCell[] {
  return [...commentText].flatMap((character) => {
    const escapedText = ESCAPED_TEXT_BY_CHARACTER[character];
    return escapedText ? toUniformCells(escapedText, "escapedText") : toUniformCells(character, "commentText");
  });
}

function buildRawCommentCells(commentText: string): XssCell[] {
  const markupSegments = commentText.match(MARKUP_SEGMENT_PATTERN) ?? [];
  return markupSegments.flatMap((segment) =>
    toUniformCells(segment, segment.startsWith("<") ? "commentCode" : "commentText"),
  );
}

function readVisibleText(commentText: string, isEscapeEnabled: boolean): string {
  if (isEscapeEnabled) return commentText;
  const visibleText = commentText
    .replace(SCRIPT_BLOCK_PATTERN, "")
    .replace(IMAGE_TAG_PATTERN, XSS_BROKEN_IMAGE_TEXT)
    .replace(ANY_TAG_PATTERN, "")
    .trim();
  return visibleText || XSS_EMPTY_PAGE_TEXT;
}

function readPageEffect(commentText: string, isEscapeEnabled: boolean): PageEffect {
  if (isEscapeEnabled) return "text";
  if (HAS_SCRIPT_PATTERN.test(commentText)) return "script";
  return HAS_ANY_TAG_PATTERN.test(commentText) ? "tag" : "text";
}

export function analyseComment(
  commentText: string,
  isEscapeEnabled: boolean,
  isCookieProtected: boolean,
): CommentAnalysis {
  const commentCells = isEscapeEnabled ? buildEscapedCommentCells(commentText) : buildRawCommentCells(commentText);
  const pageEffect = readPageEffect(commentText, isEscapeEnabled);
  const isScriptRunning = pageEffect === "script";
  return {
    pageCells: [
      ...toUniformCells(XSS_PAGE_OPEN_TAG, "pageCode"),
      ...commentCells,
      ...toUniformCells(XSS_PAGE_CLOSE_TAG, "pageCode"),
    ],
    visibleText: readVisibleText(commentText, isEscapeEnabled),
    pageEffect,
    injectedCodeCount: commentCells.filter(({ tone }) => tone === "commentCode").length,
    isScriptRunning,
    isCookieSent: isScriptRunning && !isCookieProtected,
  };
}
