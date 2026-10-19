import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOGO_PATHS } from "~/data/logos";
import { logoSprite } from "./logo-sprite";

describe("logoSprite", () => {
  it("makes one symbol per logo", () => {
    const sprite = logoSprite({ debian: "M0 0h1", fedora: "M1 1h2" });
    expect(sprite).toContain('<symbol id="debian" viewBox="0 0 24 24"><path d="M0 0h1"/></symbol>');
    expect(sprite).toContain('<symbol id="fedora" viewBox="0 0 24 24"><path d="M1 1h2"/></symbol>');
  });

  it("is what public/logos.svg holds (run `pnpm sync:logos` after changing a logo)", () => {
    const committed = readFileSync(new URL("../public/logos.svg", import.meta.url), "utf8");
    expect(committed).toBe(logoSprite(LOGO_PATHS));
  });
});
