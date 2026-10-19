import { describe, expect, it } from "vitest";
import {
  cacheName,
  isCacheableRequest,
  isSharedCacheable,
  NOT_FOUND_CACHE_CONTROL,
  withNotFoundCacheControl,
} from "./edge-cache";

const get = (url: string, init?: RequestInit) => new Request(url, init);
const reply = (status: number, cacheControl?: string, extra: Record<string, string> = {}) =>
  new Response("x", {
    status,
    headers: { ...(cacheControl ? { "Cache-Control": cacheControl } : {}), ...extra },
  });

describe("cacheName", () => {
  it("differs per build, so a deploy starts from an empty cache", () => {
    expect(cacheName("a1b2c3d")).not.toBe(cacheName("e4f5a6b"));
  });
});

describe("isCacheableRequest", () => {
  it("accepts an anonymous GET on the real host", () => {
    expect(isCacheableRequest(get("https://tuxery.store/app/gimp/"))).toBe(true);
    expect(isCacheableRequest(get("https://pr-1.preview.tuxery.store/"))).toBe(true);
  });

  it("refuses local hosts, ports, cookies, credentials and other methods", () => {
    expect(isCacheableRequest(get("http://localhost:8788/"))).toBe(false);
    expect(isCacheableRequest(get("http://127.0.0.1/"))).toBe(false);
    expect(isCacheableRequest(get("https://tuxery.store:8443/"))).toBe(false);
    expect(isCacheableRequest(get("https://tuxery.store/", { headers: { Cookie: "a=b" } }))).toBe(
      false,
    );
    expect(
      isCacheableRequest(get("https://tuxery.store/", { headers: { Authorization: "x" } })),
    ).toBe(false);
    expect(isCacheableRequest(get("https://tuxery.store/", { method: "POST" }))).toBe(false);
  });
});

describe("isSharedCacheable", () => {
  it("keeps public 200s and 404s", () => {
    expect(isSharedCacheable(reply(200, "max-age=60, s-maxage=3600, public"))).toBe(true);
    expect(isSharedCacheable(reply(404, "max-age=60, s-maxage=3600, public"))).toBe(true);
  });

  it("drops private, no-store, no-cache, cookies and other statuses", () => {
    expect(isSharedCacheable(reply(200, "private"))).toBe(false);
    expect(isSharedCacheable(reply(200, "no-store"))).toBe(false);
    expect(isSharedCacheable(reply(200, "public, no-cache"))).toBe(false);
    expect(isSharedCacheable(reply(200, "public, max-age=60", { "Set-Cookie": "a=b" }))).toBe(
      false,
    );
    expect(isSharedCacheable(reply(200))).toBe(false);
    expect(isSharedCacheable(reply(503, "public, max-age=60"))).toBe(false);
    expect(isSharedCacheable(reply(500, "public, max-age=60"))).toBe(false);
  });
});

describe("withNotFoundCacheControl", () => {
  it("gives a bare 404 a Cache-Control", () => {
    const response = withNotFoundCacheControl(reply(404));
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe(NOT_FOUND_CACHE_CONTROL);
    expect(isSharedCacheable(response)).toBe(true);
  });

  it("leaves everything else as it is", () => {
    const own = reply(404, "no-store");
    expect(withNotFoundCacheControl(own)).toBe(own);
    const ok = reply(200);
    expect(withNotFoundCacheControl(ok)).toBe(ok);
  });
});
