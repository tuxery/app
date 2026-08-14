/// <reference types="@cloudflare/workers-types" />
import {
  createQwikCity,
  type PlatformCloudflarePages,
} from "@builder.io/qwik-city/middleware/cloudflare-pages";
import qwikCityPlan from "@qwik-city-plan";
import { manifest } from "@qwik-client-manifest";
import render from "./entry.ssr";

declare global {
  interface QwikCityPlatform extends PlatformCloudflarePages {
    env: { CATALOG_BUCKET: R2Bucket };
  }
}

const fetch = createQwikCity({ render, qwikCityPlan, manifest });

export { fetch };
