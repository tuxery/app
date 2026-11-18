import type { RequestHandler } from "@qwik.dev/router";
import { browseApps } from "~/catalog";
import { isCatalogUnavailable } from "~/catalog-status";
import { parsePageParam } from "~/browse-page";
import { resolveServerEnv } from "~/server-env";

// The next pages of a category's or subcategory's listing, as its page
// scrolls (`~/components/category-page`): `?category=&sub=&page=` (1-based),
// the same `browseApps` the page's first one came from. Cached at the edge
// for an hour, like the category pages themselves.
export const onGet: RequestHandler = async ({
  cacheControl,
  headers,
  platform,
  send,
  sharedMap,
  url,
}) => {
  headers.set("Content-Type", "application/json; charset=utf-8");
  const category = url.searchParams.get("category") ?? "";
  if (category === "") {
    cacheControl({ noStore: true });
    send(400, "{}");
    return;
  }
  const result = isCatalogUnavailable(sharedMap)
    ? undefined
    : await browseApps(
        resolveServerEnv(platform),
        "",
        parsePageParam(url.searchParams.get("page")),
        { category, subcategory: url.searchParams.get("sub") ?? undefined },
        false,
      );
  if (!result || isCatalogUnavailable(sharedMap)) {
    cacheControl({ noStore: true });
    send(503, "{}");
    return;
  }
  cacheControl({ public: true, maxAge: 300, sMaxAge: 3600, staleWhileRevalidate: 86400 });
  send(200, JSON.stringify({ apps: result.apps }));
};
