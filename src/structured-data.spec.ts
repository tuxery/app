import { describe, expect, it } from "vitest";
import { applicationCategory, jsonLdScript, softwareApplication } from "./structured-data";

const URL = "https://tuxery.store/app/org.mozilla.firefox/";

describe("softwareApplication", () => {
  it("describes the app with what the catalog knows", () => {
    expect(
      softwareApplication(
        {
          name: "Firefox",
          shortDescription: "Fast, Private & Safe Web Browser",
          iconUrl: "https://example.org/firefox.png",
          screenshots: ["https://example.org/1.png", "https://example.org/2.png"],
          homepage: "https://www.mozilla.org/firefox/",
          category: "Internet & Communication",
          licenseSpdx: "MPL-2.0",
        },
        URL,
      ),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Firefox",
      description: "Fast, Private & Safe Web Browser",
      url: URL,
      operatingSystem: "Linux",
      applicationCategory: "CommunicationApplication",
      image: "https://example.org/firefox.png",
      screenshot: ["https://example.org/1.png", "https://example.org/2.png"],
      license: "https://spdx.org/licenses/MPL-2.0.html",
      sameAs: "https://www.mozilla.org/firefox/",
    });
  });

  it("leaves out what it doesn't know, and never claims a price or a rating", () => {
    const data = softwareApplication(
      {
        name: "tool",
        shortDescription: "",
        category: "To Classify",
        licenseSpdx: "GPL-2.0-or-later OR MIT",
      },
      URL,
    );
    expect(data).toEqual({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "tool",
      url: URL,
      operatingSystem: "Linux",
    });
    expect(data).not.toHaveProperty("offers");
    expect(data).not.toHaveProperty("aggregateRating");
  });

  it("lists a few screenshots at most", () => {
    const screenshots = Array.from({ length: 9 }, (_, i) => `https://example.org/${i}.png`);
    const data = softwareApplication(
      { name: "x", shortDescription: "x", category: "Utilities", screenshots },
      URL,
    );
    expect(data.screenshot).toHaveLength(5);
  });
});

describe("applicationCategory", () => {
  it("makes every game a game, whatever its category", () => {
    expect(applicationCategory({ category: "Puzzle", contentType: "game" })).toBe(
      "GameApplication",
    );
    expect(applicationCategory({ category: "Developer Tools", contentType: "game" })).toBe(
      "GameApplication",
    );
  });

  it("maps the categories with a clear match only", () => {
    expect(applicationCategory({ category: "Developer Tools" })).toBe("DeveloperApplication");
    expect(applicationCategory({ category: "Science" })).toBeUndefined();
    expect(applicationCategory({ category: "To Classify" })).toBeUndefined();
  });
});

describe("jsonLdScript", () => {
  it("can't close its script element early", () => {
    const text = jsonLdScript({ description: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("<");
    expect(JSON.parse(text)).toEqual({ description: "</script><script>alert(1)</script>" });
  });
});
