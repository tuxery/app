import { describe, expect, it } from "vitest";
import { projectLinks } from "~/project-links";

describe("projectLinks", () => {
  it("lists the project's links in a fixed order, with labels", () => {
    expect(
      projectLinks({
        donation: "https://donate.example/",
        bugtracker: "https://bugs.example/",
        "vcs-browser": "https://code.example/",
      }),
    ).toEqual([
      { type: "bugtracker", label: "Report a bug", href: "https://bugs.example/" },
      { type: "vcs-browser", label: "Source code", href: "https://code.example/" },
      { type: "donation", label: "Donate", href: "https://donate.example/" },
    ]);
  });

  it("drops links that aren't web pages, and handles none", () => {
    expect(projectLinks({ contact: "mailto:dev@example.org" })).toEqual([]);
    expect(projectLinks(undefined)).toEqual([]);
  });
});
