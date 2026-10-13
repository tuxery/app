import { describe, expect, it } from "vitest";
import { INSTALL_GROUP_LOGOS, LOGO_PATHS, OS_LOGOS, SOURCE_LOGOS } from "./logos";
import { STORE_PAGES } from "./store-pages";

describe("logos", () => {
  it("has a path for every slug any map points at", () => {
    for (const map of [SOURCE_LOGOS, OS_LOGOS, INSTALL_GROUP_LOGOS]) {
      for (const slug of Object.values(map)) expect(LOGO_PATHS).toHaveProperty(slug as string);
    }
  });

  it("has a logo for every source with a store page of its own", () => {
    for (const store of STORE_PAGES) expect(SOURCE_LOGOS[store.id]).toBeDefined();
  });
});
