import { describe, expect, it } from "vitest";
import type { SourcedPackage } from "~/catalog-types";
import { installCommand, installWebsiteLink } from "~/install-methods";

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
