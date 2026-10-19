import type { RequestHandler } from "@qwik.dev/router";
import { getHomeRowsJson } from "~/catalog";
import { isCatalogUnavailable } from "~/catalog-status";
import { resolveServerEnv } from "~/server-env";

// The homepage's rows (see `~/home-rows`), fetched by the browser. Cached at
// the edge for an hour, served stale for a day while it refreshes: the data
// only changes when the catalog is published, and the homepage asks for it
// with the dataset's generation in the URL (`?g=`), so a publish gets a new
// URL rather than waiting for this cache.
export const onGet: RequestHandler = async ({
  cacheControl,
  headers,
  platform,
  send,
  sharedMap,
}) => {
  headers.set("Content-Type", "application/json; charset=utf-8");
  const json = isCatalogUnavailable(sharedMap)
    ? undefined
    : await getHomeRowsJson(resolveServerEnv(platform));
  if (!json) {
    cacheControl({ noStore: true });
    send(503, "{}");
    return;
  }
  cacheControl({ public: true, maxAge: 300, sMaxAge: 3600, staleWhileRevalidate: 86400 });
  send(200, json);
};
