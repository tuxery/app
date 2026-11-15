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
});

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
    expect(issue.body).toContain("https://tuxery.store/app/krita/");
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
  });
});
