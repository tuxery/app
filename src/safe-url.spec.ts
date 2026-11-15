import { describe, expect, it } from "vitest";
import { httpLinks, httpUrl, httpUrls } from "~/safe-url";

describe("httpUrl", () => {
  it("keeps an absolute http(s) URL as written", () => {
    expect(httpUrl("https://example.org/")).toBe("https://example.org/");
    expect(httpUrl("http://example.org/a?b=c#d")).toBe("http://example.org/a?b=c#d");
    expect(httpUrl("HTTPS://Example.org")).toBe("HTTPS://Example.org");
    expect(httpUrl("  https://example.org/  ")).toBe("https://example.org/");
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://example.org/pub/",
    "mailto:dev@example.org",
    "about:blank",
    "git+https://example.org/repo",
    "hhttps://example.org/",
  ])("drops another scheme: %s", (url) => {
    expect(httpUrl(url)).toBeUndefined();
  });

  it("drops a value a browser would resolve against this site", () => {
    expect(httpUrl("www.example.org")).toBeUndefined();
    expect(httpUrl("//example.org/")).toBeUndefined();
    expect(httpUrl("/app/gimp/")).toBeUndefined();
    expect(httpUrl("https:example.org")).toBeUndefined();
    expect(httpUrl("https:\\\\example.org")).toBeUndefined();
  });

  it("drops a URL with no host, or with whitespace or control characters in it", () => {
    expect(httpUrl("https://")).toBeUndefined();
    expect(httpUrl("https://exa mple.org/")).toBeUndefined();
    expect(httpUrl("https://example.org/\njavascript:alert(1)")).toBeUndefined();
    expect(httpUrl("https://example.org/\u0000")).toBeUndefined();
  });

  it("drops what isn't a string", () => {
    expect(httpUrl(undefined)).toBeUndefined();
    expect(httpUrl(null)).toBeUndefined();
    expect(httpUrl(42)).toBeUndefined();
    expect(httpUrl({ toString: () => "https://example.org/" })).toBeUndefined();
    expect(httpUrl("")).toBeUndefined();
  });
});

describe("httpUrls", () => {
  it("keeps the http(s) entries, in order", () => {
    expect(
      httpUrls(["https://a.example/1.png", "javascript:alert(1)", "​", "http://b.example/2"]),
    ).toEqual(["https://a.example/1.png", "http://b.example/2"]);
  });

  it("is undefined without a list", () => {
    expect(httpUrls(undefined)).toBeUndefined();
    expect(httpUrls("https://a.example/")).toBeUndefined();
  });
});

describe("httpLinks", () => {
  it("keeps the http(s) links of a record", () => {
    expect(
      httpLinks({
        bugtracker: "https://bugs.example/",
        donation: "javascript:alert(1)",
        contact: "mailto:dev@example.org",
      }),
    ).toEqual({ bugtracker: "https://bugs.example/" });
  });

  it("is undefined without a record", () => {
    expect(httpLinks(undefined)).toBeUndefined();
    expect(httpLinks(null)).toBeUndefined();
  });
});
