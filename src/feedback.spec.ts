import { describe, expect, it } from "vitest";
import { buildFeedbackIssue, MESSAGE_MAX, normalizePage, parseFeedback } from "./feedback";

describe("parseFeedback", () => {
  it("accepts a message and trims every field", () => {
    expect(
      parseFeedback({
        kind: "bug",
        message: "  The GIMP page shows no screenshots.  ",
        page: "/app/gimp/",
        contact: " me@example.org ",
      }),
    ).toEqual({
      ok: true,
      input: {
        kind: "bug",
        message: "The GIMP page shows no screenshots.",
        page: "/app/gimp/",
        contact: "me@example.org",
      },
    });
  });

  it("files an unknown kind under 'other' and leaves out empty optional fields", () => {
    const parsed = parseFeedback({ kind: "nope", message: "Nice site, thanks a lot" });
    expect(parsed).toEqual({
      ok: true,
      input: {
        kind: "other",
        message: "Nice site, thanks a lot",
        page: undefined,
        contact: undefined,
      },
    });
  });

  it("refuses a message that is too short or too long", () => {
    expect(parseFeedback({ message: "hi" })).toMatchObject({
      ok: false,
      error: expect.any(String),
    });
    expect(parseFeedback({ message: "x".repeat(MESSAGE_MAX + 1) })).toMatchObject({ ok: false });
  });

  it("keeps the contact on one line and the message free of control characters", () => {
    const parsed = parseFeedback({
      message: "First line\r\nSecond\u0000 line\u2028\twith a tab",
      contact: "me@example.org\n**App version:** forged",
    });
    expect(parsed).toMatchObject({
      ok: true,
      input: {
        message: "First line\nSecond line\twith a tab",
        contact: "me@example.org **App version:** forged",
      },
    });
  });

  it("drops a page that isn't a path on this site", () => {
    const parsed = parseFeedback({
      message: "Nice site, thanks a lot",
      page: "/app/gimp/\n@octocat",
    });
    expect(parsed).toMatchObject({ ok: true, input: { page: undefined } });
  });

  it("flags a filled honeypot as spam", () => {
    expect(parseFeedback({ message: "Buy cheap things now!!", website: "http://spam" })).toEqual({
      ok: false,
      spam: true,
    });
  });
});

describe("normalizePage", () => {
  it("keeps a path on this site", () => {
    expect(normalizePage("/browse/?q=gimp")).toBe("/browse/?q=gimp");
    expect(normalizePage("https://tuxery.store/app/gimp/")).toBe("/app/gimp/");
  });

  it("drops anything that isn't a page of this site", () => {
    expect(normalizePage("https://example.org/app/gimp/")).toBeUndefined();
    expect(normalizePage("//example.org/")).toBeUndefined();
    expect(normalizePage("javascript:alert(1)")).toBeUndefined();
    expect(normalizePage("")).toBeUndefined();
  });

  it("drops what a browser would read as another site or a script", () => {
    expect(normalizePage("/\\example.org/")).toBeUndefined();
    expect(normalizePage("\\\\example.org/")).toBeUndefined();
    expect(normalizePage("/app\\..\\example.org")).toBeUndefined();
    expect(normalizePage("https://tuxery.store//example.org/")).toBeUndefined();
    expect(normalizePage("https://tuxery.store.example.org/")).toBeUndefined();
    expect(normalizePage("https://tuxery.store@example.org/")).toBeUndefined();
    expect(normalizePage("JavaScript:alert(1)")).toBeUndefined();
    expect(normalizePage("data:text/html,x")).toBeUndefined();
    expect(normalizePage("app/gimp/")).toBeUndefined();
  });

  it("drops a path carrying a line break or another control character", () => {
    expect(normalizePage("/app/gimp/\n@octocat")).toBeUndefined();
    expect(normalizePage("/app/\tgimp/")).toBeUndefined();
    expect(normalizePage("/app/gimp/\u0000")).toBeUndefined();
    expect(normalizePage("/app/\u2028gimp/")).toBeUndefined();
    expect(normalizePage("/\r/example.org")).toBeUndefined();
  });

  it("caps the length", () => {
    expect(normalizePage(`/${"a".repeat(1000)}`)).toHaveLength(300);
  });
});

/** The issue's "Page" line for a given page. */
const pageLine = (page: string) =>
  buildFeedbackIssue({ kind: "bug", message: "Something is off here", page }).body.split("\n")[1];

describe("buildFeedbackIssue", () => {
  it("titles the issue with the kind and the message's first line", () => {
    const issue = buildFeedbackIssue(
      {
        kind: "data",
        message: "Wrong license for Krita\nIt says proprietary.",
        page: "/app/krita/",
      },
      "2026.11.15",
    );
    expect(issue.title).toBe("[data] Wrong license for Krita");
    expect(issue.labels).toEqual(["feedback", "data"]);
    expect(issue.body).toContain("**Page:** `https://tuxery.store/app/krita/`");
    expect(issue.body).toContain("**App version:** 2026.11.15");
    expect(issue.body).toContain("It says proprietary.");
  });

  it("shortens a long first line", () => {
    const issue = buildFeedbackIssue({ kind: "idea", message: "a".repeat(200) });
    expect(issue.title.length).toBeLessThanOrEqual("[idea] ".length + 70);
    expect(issue.title.endsWith("…")).toBe(true);
  });

  it("keeps the tester's text from mentioning people, linking issues or injecting HTML", () => {
    const issue = buildFeedbackIssue({
      kind: "other",
      message: "Ping @octocat about #12 <img src=x>",
      contact: "@someone",
    });
    expect(issue.body).not.toMatch(/@octocat|@someone|#12|<img/);
    expect(issue.body).toContain("&lt;img src=x&gt;");
    // Still readable: only an invisible character was added.
    expect(issue.body.replaceAll("\u200b", "")).toContain("Ping @octocat about #12");
  });

  it("writes the page as a code span nothing can get out of", () => {
    expect(pageLine("/browse/?q=`@octocat` **bold**")).toBe(
      "**Page:** `https://tuxery.store/browse/?q=%60@octocat%60 **bold**`  ",
    );
    // A page that got here without going through `parseFeedback`.
    expect(pageLine("/app/gimp/\n\n@octocat")).toBe("**Page:** not given  ");
    expect(pageLine("//example.org/")).toBe("**Page:** not given  ");
  });
});
