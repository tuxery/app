import { describe, expect, it } from "vitest";
import { toSummary } from "~/app-summary";

const row = (iconUrl: unknown) => ({
  id: "demo",
  name: "Demo",
  short_description: "A demo app",
  category: "Utilities",
  icon_url: iconUrl,
  packages_json: JSON.stringify([{ source: "pacman-aur", name: "demo" }]),
});

describe("toSummary", () => {
  it("keeps an http(s) icon and drops anything else", () => {
    expect(toSummary(row("https://demo.example/icon.png")).iconUrl).toBe(
      "https://demo.example/icon.png",
    );
    expect(toSummary(row("javascript:alert(1)")).iconUrl).toBeUndefined();
    expect(toSummary(row("data:image/svg+xml,<svg onload=alert(1)>")).iconUrl).toBeUndefined();
    expect(toSummary(row(null)).iconUrl).toBeUndefined();
  });
});
