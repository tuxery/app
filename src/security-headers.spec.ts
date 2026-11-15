import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { applySecurityHeaders, SECURITY_HEADERS, withSecurityHeaders } from "./security-headers";

const value = (name: string) => SECURITY_HEADERS.find(([header]) => header === name)?.[1];

describe("SECURITY_HEADERS", () => {
  it("forbids sniffing and framing, and limits the referrer", () => {
    expect(value("X-Content-Type-Options")).toBe("nosniff");
    expect(value("X-Frame-Options")).toBe("DENY");
    expect(value("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("has a policy that can't break inline scripts or hot-linked media", () => {
    const directives = (value("Content-Security-Policy") ?? "")
      .split(";")
      .map((directive) => directive.trim());
    expect(directives).toEqual([
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
    ]);
  });

  it("leaves the features the site uses alone", () => {
    const policy = value("Permissions-Policy") ?? "";
    expect(policy).toContain("camera=()");
    expect(policy).toContain("geolocation=()");
    expect(policy).toContain("microphone=()");
    for (const used of ["clipboard-write", "clipboard-read", "autoplay", "fullscreen"]) {
      expect(policy).not.toContain(used);
    }
  });

  it("leaves HSTS to the Cloudflare zone", () => {
    expect(value("Strict-Transport-Security")).toBeUndefined();
  });
});

describe("applySecurityHeaders", () => {
  it("sets every header and keeps the others", () => {
    const headers = new Headers({ "X-Robots-Tag": "noindex", "X-Frame-Options": "SAMEORIGIN" });
    applySecurityHeaders(headers);
    for (const [name, expected] of SECURITY_HEADERS) expect(headers.get(name)).toBe(expected);
    expect(headers.get("X-Robots-Tag")).toBe("noindex");
  });
});

describe("withSecurityHeaders", () => {
  it("keeps the status, the body and the response's own headers", async () => {
    const response = withSecurityHeaders(
      new Response("not here", { status: 404, headers: { "Cache-Control": "public, max-age=60" } }),
    );
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("not here");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=60");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
  });

  it("accepts a response without a body", () => {
    const redirect = withSecurityHeaders(
      new Response(null, { status: 301, headers: { Location: "https://tuxery.store/" } }),
    );
    expect(redirect.status).toBe(301);
    expect(redirect.headers.get("Location")).toBe("https://tuxery.store/");
    expect(redirect.headers.get("X-Frame-Options")).toBe("DENY");
  });
});

describe("public/_headers", () => {
  it("gives static files the same headers", () => {
    const file = readFileSync(new URL("../public/_headers", import.meta.url), "utf8");
    const everyFile = file.slice(
      file.indexOf("\n/*\n"),
      file.indexOf("\n\n", file.indexOf("\n/*\n")),
    );
    for (const [name, expected] of SECURITY_HEADERS) {
      expect(everyFile).toContain(`\n  ${name}: ${expected}`);
    }
  });
});
