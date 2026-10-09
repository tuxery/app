import type { RequestHandler } from "@qwik.dev/router";
import { MOVED_TO_DOCS } from "~/docs-nav";

/**
 * `onGet` for a URL that moved under `/docs/` — a permanent redirect to
 * its new home (see `MOVED_TO_DOCS`), query string kept. Re-exported by
 * each old route's own `index.ts`, the only file left there.
 */
export const redirectToDocs: RequestHandler = ({ url, redirect }) => {
  const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  throw redirect(301, `${MOVED_TO_DOCS[path] ?? "/docs/"}${url.search}`);
};
