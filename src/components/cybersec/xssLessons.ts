import { XSS_PAGE_EFFECT_TEXT } from "@/content/cybersecContent";
import { describeSwitchState } from "@/lib/describeSwitchState";
import { COMMENT_TEXT_BY_NAME, type XssConfig } from "./controls/xssControls";
import type { GlossaryEntry, LessonStep } from "./lessonTypes";
import { analyseComment } from "./xssPageAnalysis";

function readAnalysis({ commentText, isEscapeEnabled, isCookieProtected }: XssConfig) {
  return analyseComment(commentText, isEscapeEnabled, isCookieProtected);
}

function describeCodeShare(config: XssConfig): string {
  const { injectedCodeCount } = readAnalysis(config);
  return `Comment: ${config.commentText}. ${injectedCodeCount} of ${config.commentText.length} characters run as code.`;
}

function describePageEffect(config: XssConfig): string {
  const { pageEffect, injectedCodeCount } = readAnalysis(config);
  return `The page runs ${XSS_PAGE_EFFECT_TEXT[pageEffect]}. ${injectedCodeCount} characters of the comment run as code.`;
}

function describeCookieTheft(config: XssConfig): string {
  const { isScriptRunning, isCookieSent } = readAnalysis(config);
  return `Scripts run: ${Number(isScriptRunning)}. Cookies sent to the attacker: ${Number(isCookieSent)}.`;
}

function describeEscapeComparison({ commentText, isCookieProtected }: XssConfig): string {
  const escapeOff = analyseComment(commentText, false, isCookieProtected);
  const escapeOn = analyseComment(commentText, true, isCookieProtected);
  return `Escape off: ${escapeOff.injectedCodeCount} characters run as code, ${Number(escapeOff.isCookieSent)} cookies sent. Escape on: ${escapeOn.injectedCodeCount} characters run as code, ${Number(escapeOn.isCookieSent)} cookies sent.`;
}

function describeDefence(config: XssConfig): string {
  return `Cookie protection is ${describeSwitchState(config.isCookieProtected)}. ${describeCookieTheft(config)}`;
}

export const XSS_LESSON_STEPS: readonly LessonStep<XssConfig>[] = [
  {
    title: "Watch a comment",
    explanationLines: [
      "A visitor writes a comment. The site writes it into a page.",
      "The next visitor opens the page. The browser shows the comment.",
      "White cells are the code of the site. Yellow cells are the comment.",
    ],
    taskText: "Click the picture. Watch the comment go to the browser.",
    describeLiveFact: describeCodeShare,
  },
  {
    title: "Add a tag",
    explanationLines: [
      "A tag is a word between < and >. A browser reads a tag as code.",
      "This comment has a bold tag. The browser makes the text bold.",
      "The site wanted plain text. The comment changed the page.",
    ],
    taskText: `Turn off Escape output. Set Comment to ${COMMENT_TEXT_BY_NAME.boldTag}.`,
    isTaskDone: ({ commentText, isEscapeEnabled }) =>
      commentText === COMMENT_TEXT_BY_NAME.boldTag && !isEscapeEnabled,
    describeLiveFact: describePageEffect,
  },
  {
    title: "Run a script",
    explanationLines: [
      "A script is a small program. A script tag makes the browser run it.",
      "This script reads the cookie of the visitor. It sends the cookie to the attacker.",
      "The visitor does nothing wrong. Opening the page is enough.",
    ],
    taskText: `Turn off Escape output and Cookie protection. Set Comment to ${COMMENT_TEXT_BY_NAME.scriptTag}.`,
    isTaskDone: ({ commentText, isEscapeEnabled, isCookieProtected }) =>
      commentText === COMMENT_TEXT_BY_NAME.scriptTag && !isEscapeEnabled && !isCookieProtected,
    describeLiveFact: describeCookieTheft,
  },
  {
    title: "Real world",
    explanationLines: [
      "Real sites show user text in many places. Examples: comments, names, search boxes, and chat.",
      "The cookie shows who the visitor is. An attacker with the cookie acts as the visitor.",
      "Attackers use many tags. This image tag has a wrong address. The browser then runs the onerror code.",
    ],
    taskText: `Turn off Escape output and Cookie protection. Set Comment to ${COMMENT_TEXT_BY_NAME.imageTag}.`,
    isTaskDone: ({ commentText, isEscapeEnabled, isCookieProtected }) =>
      commentText === COMMENT_TEXT_BY_NAME.imageTag && !isEscapeEnabled && !isCookieProtected,
    describeLiveFact: describeCookieTheft,
  },
  {
    title: "Compare escape",
    explanationLines: [
      "Use the same comment. Change only Escape output.",
      "Escape output changes < to &lt; and > to &gt;.",
      "The browser shows these as text. It never runs them.",
    ],
    taskText: `Set Comment to ${COMMENT_TEXT_BY_NAME.scriptTag}. Turn on Escape output.`,
    isTaskDone: ({ commentText, isEscapeEnabled }) =>
      commentText === COMMENT_TEXT_BY_NAME.scriptTag && isEscapeEnabled,
    describeLiveFact: describeEscapeComparison,
  },
  {
    title: "Limits and defence",
    explanationLines: [
      "Escape output is the main fix. Use it every time the site shows user text.",
      "Cookie protection is a second layer. A script can still run. It cannot read the cookie.",
      "A filter that removes the word script is weak. The image tag still works.",
    ],
    taskText: `Turn off Escape output. Turn on Cookie protection. Set Comment to ${COMMENT_TEXT_BY_NAME.imageTag}.`,
    isTaskDone: ({ commentText, isEscapeEnabled, isCookieProtected }) =>
      commentText === COMMENT_TEXT_BY_NAME.imageTag && !isEscapeEnabled && isCookieProtected,
    describeLiveFact: describeDefence,
  },
];

export const XSS_GLOSSARY_ENTRIES: readonly GlossaryEntry[] = [
  { term: "XSS", meaning: "Cross-site scripting. An attack that makes a site send a script to the browsers of other visitors." },
  { term: "Browser", meaning: "The program that shows web pages." },
  { term: "HTML", meaning: "The code that tells a browser how to show a page." },
  { term: "Tag", meaning: "A word between < and >, such as <b>. A browser reads it as code." },
  { term: "Script", meaning: "A small program that runs in a browser." },
  { term: "Cookie", meaning: "A small piece of data that a site keeps in your browser. A session cookie shows who you are." },
  { term: "Escape output", meaning: "Change < and > to safe text, such as &lt;. The browser shows the text and does not run it." },
  { term: "Cookie protection", meaning: "A cookie setting, also called HttpOnly. Scripts cannot read the cookie." },
];
