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
import {
  cacheName,
  isCacheableRequest,
  isSharedCacheable,
  withNotFoundCacheControl,
} from "./edge-cache";
import render from "./entry.ssr";

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
// named per build, takes its place.
const withoutRouterCache = (request: Request) => {
  const headers = new Headers(request.headers);
  headers.set("Authorization", "skip-router-cache");
  return new Request(request, { headers });
};

const fetch = async (request: Request, env: RouterEnv, ctx: RouterContext) => {
  const url = new URL(request.url);
  if (isStaticPath(request.method, url) || !isCacheableRequest(request)) {
    return router(request, env, ctx);
  }
  const cache = await caches.open(cacheName(APP_COMMIT));
  const key = new Request(request.url, request);
  const hit = await cache.match(key);
  if (hit) return hit;

  const response = withNotFoundCacheControl(await router(withoutRouterCache(request), env, ctx));
  if (isSharedCacheable(response)) ctx.waitUntil(cache.put(key, response.clone()));
  return response;
};

export { fetch };
