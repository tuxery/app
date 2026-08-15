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
    env: { TURSO_DB_URL: string; TURSO_DB_AUTH_TOKEN?: string };
  }
}

const fetch = createQwikCity({ render, qwikCityPlan, manifest });

export { fetch };
