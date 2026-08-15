import type { RequestHandler } from "@builder.io/qwik-city";
import { searchApps } from "~/catalog";

/** Backs the homepage's search-as-you-type — called via `fetch` from `routes/index.tsx`'s `useVisibleTask$`. */
export const onGet: RequestHandler = async (requestEvent) => {
  const query = requestEvent.url.searchParams.get("q") ?? "";
  const apps = await searchApps(query);
  requestEvent.json(200, apps);
};
