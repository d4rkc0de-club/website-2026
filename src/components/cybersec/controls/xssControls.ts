import { defineControls, select, toggle, type ConfigOf } from "@/lib/variantControls";

export const COMMENT_TEXT_BY_NAME = {
  normalComment: "Nice post!",
  boldTag: "<b>Nice</b> post!",
  scriptTag: "<script>steal(cookie)</script>",
  imageTag: "<img src=x onerror=steal(cookie)>",
} as const;

const COMMENT_TEXTS = Object.values(COMMENT_TEXT_BY_NAME);

export const XSS_CONTROLS = defineControls([
  select("commentText", "Comment", COMMENT_TEXTS, COMMENT_TEXT_BY_NAME.normalComment),
  toggle("isEscapeEnabled", "Escape output", false),
  toggle("isCookieProtected", "Cookie protection", false),
]);

export type XssConfig = ConfigOf<typeof XSS_CONTROLS>;
