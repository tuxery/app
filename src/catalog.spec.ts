import { describe, expect, it } from "vitest";
import { toCatalogApp } from "~/catalog";

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "demo",
  name: "Demo",
  short_description: "A demo app",
  category: "Utilities",
  packages_json: "[]",
  ...overrides,
});

describe("toCatalogApp", () => {
  it("keeps the http(s) URLs a source published", () => {
    const app = toCatalogApp(
      row({
        homepage: "https://demo.example/",
        icon_url: "https://demo.example/icon.png",
        screenshots_json: JSON.stringify(["https://demo.example/1.png"]),
        videos_json: JSON.stringify(["https://demo.example/1.webm"]),
        links_json: JSON.stringify({ bugtracker: "https://demo.example/bugs" }),
        packages_json: JSON.stringify([
          { source: "pacman-aur", name: "demo", homepage: "http://demo.example/aur" },
        ]),
      }),
    );
    expect(app.homepage).toBe("https://demo.example/");
    expect(app.iconUrl).toBe("https://demo.example/icon.png");
    expect(app.screenshots).toEqual(["https://demo.example/1.png"]);
    expect(app.videos).toEqual(["https://demo.example/1.webm"]);
    expect(app.links).toEqual({ bugtracker: "https://demo.example/bugs" });
    expect(app.packages[0]?.homepage).toBe("http://demo.example/aur");
  });

  it("hands no page a URL that isn't http(s)", () => {
    const app = toCatalogApp(
      row({
        homepage: "javascript:alert(document.domain)",
        icon_url: "data:image/svg+xml,<svg onload=alert(1)>",
        screenshots_json: JSON.stringify(["javascript:alert(1)", "https://demo.example/1.png"]),
        videos_json: JSON.stringify(["data:text/html,x"]),
        links_json: JSON.stringify({ donation: "javascript:alert(1)", help: "www.demo.example" }),
        packages_json: JSON.stringify([
          { source: "pacman-aur", name: "demo", homepage: "javascript:alert(1)" },
          { source: "vendor-repos", name: "demo", homepage: "www.demo.example" },
          { source: "deb-debian", name: "demo" },
        ]),
      }),
    );
    expect(app.homepage).toBeUndefined();
    expect(app.iconUrl).toBeUndefined();
    expect(app.screenshots).toEqual(["https://demo.example/1.png"]);
    expect(app.videos).toEqual([]);
    expect(app.links).toEqual({});
    expect(app.packages.map((pkg) => pkg.homepage)).toEqual([undefined, undefined, undefined]);
    expect(app.packages.map((pkg) => pkg.name)).toEqual(["demo", "demo", "demo"]);
  });

  it("reads empty columns as absent", () => {
    const app = toCatalogApp(row({ homepage: null, icon_url: null }));
    expect(app.homepage).toBeUndefined();
    expect(app.screenshots).toBeUndefined();
    expect(app.links).toBeUndefined();
    expect(app.packages).toEqual([]);
  });
});
