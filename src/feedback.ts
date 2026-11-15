// Beta testers' feedback (/feedback): checks what the form sent and turns it
// into a GitHub issue in the private tuxery/beta-feedback repository. No
// third-party form service: the Worker posts the issue itself with a token
// scoped to that one repository (FEEDBACK_GITHUB_TOKEN). Pure, so it is
// unit-tested; the network call lives in routes/feedback/index.tsx.

export const FEEDBACK_REPO = "tuxery/beta-feedback";

export const FEEDBACK_KINDS = [
  { id: "bug", label: "Something is broken" },
  { id: "data", label: "Wrong or missing app data" },
  { id: "idea", label: "An idea or a wish" },
  { id: "other", label: "Anything else" },
] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]["id"];

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 5000;
const PAGE_MAX = 300;
const CONTACT_MAX = 200;
const TITLE_EXCERPT = 70;

export interface FeedbackInput {
  kind: FeedbackKind;
  message: string;
  /** Path on tuxery.store the tester was on, if any (`/app/gimp/`). */
  page?: string;
  /** How to reach the tester back, only if they chose to give one. */
  contact?: string;
}

export type FeedbackParse =
  | { ok: true; input: FeedbackInput }
  /** A bot filled the hidden field: answer as if it worked, send nothing. */
  | { ok: false; spam: true }
  | { ok: false; spam?: false; error: string };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// C0 and C1 control characters and the Unicode line and paragraph
// separators: nothing a person types into a one-line field.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
const CONTROLS = new RegExp(CONTROL.source, "g");
// The same, tab and line feed aside: what a message of several lines keeps.
// eslint-disable-next-line no-control-regex
const CONTROLS_BUT_LINES = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u2028\u2029]/g;

/**
 * Only a path on this site is kept as "page": a full URL is cut down to its
 * path, anything else (another site, a script URL) is dropped. What comes
 * out starts with exactly one `/` and has no backslash (browsers read `/\`
 * as `//`, another host) and no control character, so it is safe both as an
 * `href` (/feedback's "back to where you were" link, fed by `?from=`) and as
 * one line of the issue.
 */
export function normalizePage(value: unknown): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  let path = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (!/(^|\.)tuxery\.store$/.test(url.hostname)) return undefined;
      path = `${url.pathname}${url.search}`;
    } catch {
      return undefined;
    }
  }
  if (!path.startsWith("/") || path.startsWith("//")) return undefined;
  if (path.includes("\\") || CONTROL.test(path)) return undefined;
  return path.slice(0, PAGE_MAX);
}

/** Checks the submitted form fields. `website` is a honeypot people never see. */
export function parseFeedback(form: Record<string, unknown>): FeedbackParse {
  if (text(form.website)) return { ok: false, spam: true };

  const kind = FEEDBACK_KINDS.find((k) => k.id === text(form.kind))?.id ?? "other";
  const message = text(form.message).replace(/\r\n?/g, "\n").replace(CONTROLS_BUT_LINES, "");
  if (message.length < MESSAGE_MIN)
    return { ok: false, error: `Please write at least ${MESSAGE_MIN} characters.` };
  if (message.length > MESSAGE_MAX)
    return { ok: false, error: `Please keep it under ${MESSAGE_MAX} characters.` };

  // One line: a line break in it would let it forge the issue's other facts.
  const contact =
    text(form.contact).replace(CONTROLS, " ").trim().slice(0, CONTACT_MAX) || undefined;
  return { ok: true, input: { kind, message, page: normalizePage(form.page), contact } };
}

/**
 * Keeps a tester's text from pinging people, linking issues or rendering
 * HTML in the issue, and still readable: a zero-width space after `@` and
 * `#` is all it takes for GitHub to see neither a mention nor a reference.
 */
function neutralize(value: string): string {
  return value
    .replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;"))
    .replace(/@(?=\w)/g, "@\u200b")
    .replace(/#(?=\d)/g, "#\u200b");
}

/**
 * The page as a Markdown code span: GitHub reads nothing inside one (no
 * mention, no link, no formatting), and with its backticks percent-encoded
 * and no line break (see `normalizePage`) the text can't end the span.
 */
function pageAsCode(page: string | undefined): string {
  const path = normalizePage(page);
  return path ? `\`https://tuxery.store${path.replaceAll("`", "%60")}\`` : "not given";
}

export interface FeedbackIssue {
  title: string;
  body: string;
  labels: string[];
}

export function buildFeedbackIssue(input: FeedbackInput, appVersion?: string): FeedbackIssue {
  const kindLabel = FEEDBACK_KINDS.find((k) => k.id === input.kind)?.label ?? input.kind;
  const firstLine = input.message.split(/\r?\n/)[0].replace(/\s+/g, " ");
  const excerpt =
    firstLine.length > TITLE_EXCERPT ? `${firstLine.slice(0, TITLE_EXCERPT - 1)}…` : firstLine;
  const facts = [
    `**Kind:** ${kindLabel}`,
    `**Page:** ${pageAsCode(input.page)}`,
    `**Contact:** ${input.contact ? neutralize(input.contact) : "not given"}`,
    ...(appVersion ? [`**App version:** ${appVersion}`] : []),
  ];
  return {
    title: `[${input.kind}] ${excerpt}`,
    body: `${facts.join("  \n")}\n\n---\n\n${neutralize(input.message)}\n`,
    labels: ["feedback", input.kind],
  };
}
