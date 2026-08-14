import type { RequestHandler } from "@builder.io/qwik-city";

/**
 * Proves the R2 binding works end to end (local `wrangler pages dev`
 * simulation and, later, prod) without building any catalog UI yet — see
 * the "Homepage search UI" card on the Tuxery GitHub Project for that.
 */
export const onGet: RequestHandler = async (requestEvent) => {
  const object = await requestEvent.platform.env.CATALOG_BUCKET.get("dataset.json");
  requestEvent.json(object ? 200 : 404, { found: !!object });
};
