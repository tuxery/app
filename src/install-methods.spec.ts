import { describe, expect, it } from "vitest";
import type { SourcedPackage } from "~/catalog-types";
import { installCommand, installWebsiteLink, pageAttribution } from "~/install-methods";

describe("pageAttribution", () => {
  const hub = {
    source: "appimagehub",
    name: "demo",
    homepage: "https://www.appimagehub.com/p/1",
  } as SourcedPackage;
  const flathub = { source: "flatpak-flathub", name: "demo" } as SourcedPackage;

  it("credits the source wherever it sits among an app's packages, with its page", () => {
    expect(pageAttribution([flathub, hub])).toEqual({
      text: "Source: AppImageHub",
      url: "https://www.appimagehub.com/p/1",
    });
  });

  it("owes nothing for sources that don't ask for a credit", () => {
    expect(pageAttribution([flathub])).toBeUndefined();
  });
});

const brave = {
  source: "vendor-repos",
  name: "brave-browser",
  homepage: "https://brave.com/linux/",
} as SourcedPackage;

describe("vendor-repos install method", () => {
  it("links to the vendor's install page instead of an apt command", () => {
    expect(installCommand(brave)).toBeUndefined();
    expect(installWebsiteLink(brave)).toEqual({ url: "https://brave.com/linux/", label: "Vendor" });
  });

  it("shows no link when the vendor has no homepage", () => {
    expect(installWebsiteLink({ ...brave, homepage: undefined })).toBeUndefined();
  });
});

// Firefox's attributes in nixpkgs all share pname "firefox".
const nix = (appId: string) =>
  ({ source: "nix-nixpkgs", name: "firefox", appId }) as SourcedPackage;

describe("nixpkgs install method", () => {
  it("installs the attribute, not the pname the attributes share", () => {
    expect(installCommand(nix("firefox"))).toBe("nix profile install nixpkgs#firefox");
    expect(installCommand(nix("firefox-esr"))).toBe("nix profile install nixpkgs#firefox-esr");
    expect(installCommand(nix("firefox-mobile"))).toBe(
      "nix profile install nixpkgs#firefox-mobile",
    );
  });
});

describe("Homebrew install method", () => {
  const formula = { source: "brew-homebrew", name: "ripgrep", appId: "ripgrep" } as SourcedPackage;
  const cask = {
    source: "brew-homebrew",
    name: "Heroic Games Launcher",
    appId: "cask/heroic",
  } as SourcedPackage;

  it("installs a formula by name", () => {
    expect(installCommand(formula)).toBe("brew install ripgrep");
    expect(installWebsiteLink(formula)).toEqual({
      url: "https://formulae.brew.sh/formula/ripgrep",
      label: "Homebrew",
    });
  });

  it("installs a cask by its token, not its display name", () => {
    expect(installCommand(cask)).toBe("brew install --cask heroic");
    expect(installWebsiteLink(cask)).toEqual({
      url: "https://formulae.brew.sh/cask/heroic",
      label: "Homebrew",
    });
  });
});
