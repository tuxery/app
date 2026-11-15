import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  cacheName,
  isCacheableRequest,
  isSharedCacheable,
  normalizeRequestUrl,
  NOT_FOUND_CACHE_CONTROL,
  PAGE_QUERY_PARAMS,
  withCacheStatus,
  withNoStore,
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

  it("accepts a request carrying cookies, which no page reads", () => {
    expect(
      isCacheableRequest(get("https://tuxery.store/", { headers: { Cookie: "__cf_bm=abc" } })),
    ).toBe(true);
  });

  it("refuses local hosts, ports, credentials and other methods", () => {
    expect(isCacheableRequest(get("http://localhost:8788/"))).toBe(false);
    expect(isCacheableRequest(get("http://127.0.0.1/"))).toBe(false);
    expect(isCacheableRequest(get("https://tuxery.store:8443/"))).toBe(false);
    expect(
      isCacheableRequest(get("https://tuxery.store/", { headers: { Authorization: "x" } })),
    ).toBe(false);
    expect(isCacheableRequest(get("https://tuxery.store/", { method: "POST" }))).toBe(false);
  });
});

const normalized = (url: string, init?: RequestInit) => normalizeRequestUrl(get(url, init));
const loader = "q-loader-AbC123.d4e5f6.json";

describe("normalizeRequestUrl", () => {
  it("drops every parameter a page doesn't read", () => {
    for (const url of [
      "https://tuxery.store/app/gimp/?x=1",
      "https://tuxery.store/app/gimp/?x=2&utm_source=news",
      "https://tuxery.store/app/gimp/?q=zen&page=3",
      "https://tuxery.store/app/gimp/?",
      "https://tuxery.store/app/gimp/#install",
    ]) {
      expect(normalized(url)).toEqual({
        url: "https://tuxery.store/app/gimp/",
        cacheKey: "https://tuxery.store/app/gimp/",
      });
    }
    expect(normalized("https://tuxery.store/?fbclid=abc").url).toBe("https://tuxery.store/");
    expect(normalized("https://tuxery.store/nowhere/?a=b").url).toBe(
      "https://tuxery.store/nowhere/",
    );
  });

  it("keeps the parameters the page reads, sorted", () => {
    expect(normalized("https://tuxery.store/browse/?type=game&x=1&q=zen").url).toBe(
      "https://tuxery.store/browse/?q=zen&type=game",
    );
    expect(normalized("https://tuxery.store/browse/?q=zen&type=game&utm_medium=x").url).toBe(
      "https://tuxery.store/browse/?q=zen&type=game",
    );
    expect(normalized("https://tuxery.store/settings/?tab=os&q=zen").url).toBe(
      "https://tuxery.store/settings/?tab=os",
    );
    expect(normalized("https://tuxery.store/feedback/?from=%2Fapp%2Fgimp%2F").url).toBe(
      "https://tuxery.store/feedback/?from=%2Fapp%2Fgimp%2F",
    );
    expect(normalized("https://tuxery.store/claim/?app=gimp&ref=x").url).toBe(
      "https://tuxery.store/claim/?app=gimp",
    );
  });

  it("keeps the first value of a repeated parameter, the one the page reads", () => {
    expect(normalized("https://tuxery.store/browse/?q=zen&q=other&q=more").url).toBe(
      "https://tuxery.store/browse/?q=zen",
    );
  });

  it("knows a page without its trailing slash, as the search forms post it", () => {
    expect(normalized("https://tuxery.store/browse?q=zen&x=1").url).toBe(
      "https://tuxery.store/browse?q=zen",
    );
  });

  it("keeps a search as the visitor typed it", () => {
    expect(normalized("https://tuxery.store/browse/?q=c%2B%2B+100%25%20%26co").url).toBe(
      "https://tuxery.store/browse/?q=c%2B%2B+100%25+%26co",
    );
    expect(
      new URL(normalized("https://tuxery.store/browse/?q=c%2B%2B+100%25").url).searchParams.get(
        "q",
      ),
    ).toBe("c++ 100%");
  });

  it("gives a loader request the parameters of the page it belongs to", () => {
    expect(normalized(`https://tuxery.store/browse/${loader}?type=game&q=zen&x=1`)).toEqual({
      url: `https://tuxery.store/browse/${loader}?q=zen&type=game`,
      cacheKey: `https://tuxery.store/browse/${loader}?q=zen&type=game`,
    });
    expect(normalized(`https://tuxery.store/app/gimp/${loader}?x=1`).url).toBe(
      `https://tuxery.store/app/gimp/${loader}`,
    );
  });

  it("keys a layout's loader request on the page it is asked for", () => {
    const forPage = (page: string, search = "") =>
      normalized(`https://tuxery.store/${loader}${search}`, {
        headers: { "X-Qwik-fullpath": page },
      });
    expect(forPage("/browse/", "?q=zen&x=1")).toEqual({
      url: `https://tuxery.store/${loader}?q=zen`,
      cacheKey: `https://tuxery.store/${loader}?q=zen&x-qwik-fullpath=%2Fbrowse%2F`,
    });
    expect(forPage("/app/gimp/", "?q=zen")).toEqual({
      url: `https://tuxery.store/${loader}`,
      cacheKey: `https://tuxery.store/${loader}?x-qwik-fullpath=%2Fapp%2Fgimp%2F`,
    });
    expect(forPage("/app/gimp/").cacheKey).not.toBe(forPage("/app/krita/").cacheKey);
  });

  it("lets no request choose the loader page part of its key through the URL", () => {
    expect(normalized(`https://tuxery.store/${loader}?x-qwik-fullpath=%2Fapp%2Fgimp%2F`)).toEqual({
      url: `https://tuxery.store/${loader}`,
      cacheKey: `https://tuxery.store/${loader}`,
    });
    // The header means something on a loader request only.
    expect(
      normalized("https://tuxery.store/app/gimp/", { headers: { "X-Qwik-fullpath": "/browse/" } })
        .cacheKey,
    ).toBe("https://tuxery.store/app/gimp/");
  });
});

/** Every `.ts`/`.tsx` source under `dir` that isn't a test. */
function sourceFiles(dir: URL): URL[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return sourceFiles(new URL(`${entry.name}/`, dir));
    return /\.tsx?$/.test(entry.name) && !/\.spec\.tsx?$/.test(entry.name)
      ? [new URL(entry.name, dir)]
      : [];
  });
}

describe("PAGE_QUERY_PARAMS", () => {
  // The Worker drops every parameter that isn't listed, the Vite dev server
  // drops none: a route reading an unlisted one would work in `pnpm dev` and
  // not once deployed.
  it("lists every query parameter the routes read", () => {
    const src = new URL("./", import.meta.url);
    const routes = new URL("./routes/", import.meta.url);
    const read: Record<string, Set<string>> = {};
    for (const file of sourceFiles(src)) {
      const source = readFileSync(file, "utf8");
      const names = [
        ...[...source.matchAll(/searchParams\s*\.(?:get|getAll|has)\(\s*["'`]([^"'`]+)["'`]/g)].map(
          (match) => match[1],
        ),
        ...[...source.matchAll(/\bsearch:\s*\[([^\]]*)\]/g)].flatMap((match) =>
          [...match[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map((name) => name[1]),
        ),
      ];
      if (names.length === 0) continue;
      // A page's own file (`routes/browse/index.tsx` is `/browse/`); anything
      // else (a layout, a component, a route with a `[parameter]`) reads the
      // query string of pages this table can't name.
      const page = file.href.startsWith(routes.href)
        ? `/${file.href.slice(routes.href.length).replace(/index\.tsx?$/, "")}`
        : file.href.slice(src.href.length);
      read[page] = new Set([...(read[page] ?? []), ...names]);
    }
    const listed = Object.fromEntries(
      Object.entries(PAGE_QUERY_PARAMS).map(([page, names]) => [page, new Set(names)]),
    );
    expect(read).toEqual(listed);
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

describe("withCacheStatus", () => {
  it("adds the header and keeps the rest", async () => {
    const response = withCacheStatus(reply(404, "public, max-age=60"), "hit");
    expect(response.headers.get("X-Tuxery-Cache")).toBe("hit");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=60");
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("x");
  });
});

describe("withNoStore", () => {
  it("replaces a public Cache-Control and keeps the status and body", async () => {
    const response = withNoStore(reply(404, "public, max-age=60, s-maxage=3600"));
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toBe("x");
    expect(isSharedCacheable(response)).toBe(false);
  });
});
