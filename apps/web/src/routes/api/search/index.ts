import type { RequestHandler } from "@builder.io/qwik-city";
import { searchApps } from "~/catalog";

/**
 * Backs the homepage's search-as-you-type — called via `fetch` from
 * `routes/index.tsx`'s `useVisibleTask$`. A plain REST endpoint rather
 * than `server$`: this Qwik version doesn't cleanly tree-shake `server$`'s
 * server-only body out of the client bundle under this repo's single-pass
 * adapter build (`vite build -c adapters/cloudflare-pages/vite.config.ts`,
 * not the full `qwik build` pipeline), which broke QRL symbol resolution
 * at runtime (Qwik error Code(31)) — a plain endpoint has no such split to
 * get wrong.
 */
export const onGet: RequestHandler = async (requestEvent) => {
  const query = requestEvent.url.searchParams.get("q") ?? "";
  const apps = await searchApps(requestEvent.platform.env, query);
  requestEvent.json(200, apps);
};
