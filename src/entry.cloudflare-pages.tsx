/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for Cloudflare Workers when building for production.
 *
 * Learn more about the Cloudflare Workers integration here:
 * - https://qwik.dev/docs/deployments/cloudflare-workers/
 *
 */
import {
  createQwikRouter,
  type PlatformCloudflarePages as PlatformCloudflareWorkers,
} from "@qwik.dev/router/middleware/cloudflare-pages";
import { isStaticPath } from "@qwik.dev/router/middleware/request-handler";
import { queryFailedSince } from "./catalog-status";
import {
  cacheName,
  isCacheableRequest,
  isSharedCacheable,
  normalizeRequestUrl,
  withCacheStatus,
  withNoStore,
  withNotFoundCacheControl,
} from "./edge-cache";
import render from "./entry.ssr";
import { withSecurityHeaders } from "./security-headers";

declare global {
  type QwikRouterPlatform = PlatformCloudflareWorkers;
}

const router = createQwikRouter({ render });

type RouterEnv = Parameters<typeof router>[1];
type RouterContext = Parameters<typeof router>[2];

// The router's adapter has a shared cache of its own, which every build
// shares and which never keeps a 404 (see `~/edge-cache`). It is skipped
// here — it steps aside for any request carrying credentials, so the request
// it gets says it has some (nothing in the app reads them) — and this one,
// named per build, takes its place. The same request loses its `Cookie`
// header: what is rendered for everyone can't have read anyone's cookie.
const forSharedRender = (request: Request) => {
  const headers = new Headers(request.headers);
  headers.delete("Cookie");
  headers.set("Authorization", "skip-router-cache");
  return new Request(request, { headers });
};

const respond = async (original: Request, env: RouterEnv, ctx: RouterContext) => {
  // A catalog query that fails after the layout's health check leaves the
  // page rendered from a fallback, with the layout's public Cache-Control
  // already set: such an answer is never stored, here or in the browser.
  const startedAt = Date.now();
  // Every GET is rendered from its normalized URL (see `normalizeRequestUrl`
  // for why the router never gets the original), cached or not, so a local
  // `wrangler dev` behaves like production.
  const normalized = original.method === "GET" ? normalizeRequestUrl(original) : undefined;
  const request = normalized ? new Request(normalized.url, original) : original;
  if (!normalized || !isCacheableRequest(request)) {
    const response = await router(request, env, ctx);
    return queryFailedSince(startedAt) ? withNoStore(response) : response;
  }
  const cache = await caches.open(cacheName(APP_COMMIT));
  const key = new Request(normalized.cacheKey, request);
  const hit = await cache.match(key);
  if (hit) return withCacheStatus(hit, "hit");

  const routed = await router(forSharedRender(request), env, ctx);
  if (queryFailedSince(startedAt)) return withNoStore(routed);
  const response = withNotFoundCacheControl(routed);
  if (!isSharedCacheable(response)) return response;
  ctx.waitUntil(cache.put(key, response.clone()));
  return withCacheStatus(response, "miss");
};

// Static files get their headers from `public/_headers`. Everything else
// leaves with the security headers (`~/security-headers`), whoever wrote the
// response: a route, the cache, or the router's own bare 404 and error pages.
const fetch = async (request: Request, env: RouterEnv, ctx: RouterContext) => {
  const url = new URL(request.url);
  if (isStaticPath(request.method, url)) return router(request, env, ctx);
  return withSecurityHeaders(await respond(request, env, ctx));
};

export { fetch };
