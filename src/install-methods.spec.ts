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
