import { cloudflarePagesAdapter as cloudflareWorkersAdapter } from "@qwik.dev/router/adapters/cloudflare-pages/vite";
import { extendConfig } from "@qwik.dev/router/vite";
import baseConfig from "../../vite.config";

export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["src/entry.cloudflare-pages.tsx", "@qwik-router-config"],
      },
    },
    // No static generation: every page reads the catalog, so none is
    // prerendered, and its by-product, a sitemap.xml of the prerendered
    // pages (an empty one), would shadow the Worker's own /sitemap.xml.
    plugins: [cloudflareWorkersAdapter({ ssg: null })],
  };
});
