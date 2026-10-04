import { describe, expect, it } from "vitest";
import { channelLabel, formatSourceLabel, summarizeChannels } from "~/catalog-types";

describe("build channels", () => {
  it("treats catalog's explicit 'stable' channel like an unset one", () => {
    expect(formatSourceLabel({ source: "flatpak-flathub", channel: "stable" })).toBe(
      formatSourceLabel({ source: "flatpak-flathub" }),
    );
    expect(channelLabel("stable")).toBe("Stable");
    expect(summarizeChannels([{ channel: "stable" }, {}, { channel: "git" }])).toEqual([
      "Stable",
      "Git",
    ]);
  });

  it("still names a non-default channel", () => {
    expect(formatSourceLabel({ source: "pacman-aur", channel: "git" })).toMatch(/\(git build\)$/);
    expect(channelLabel("git")).toBe("Git");
  });
});
