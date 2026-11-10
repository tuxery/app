import { describe, expect, it } from "vitest";
import type { SourcedPackage } from "~/catalog-types";
import { architectures, flatpakRuntimes, installedSizes, runtimeLabel } from "./technical-details";

const pkg = (extra: Partial<SourcedPackage>): SourcedPackage => ({
  source: "deb-debian",
  name: "x",
  description: "",
  version: "1",
  ...extra,
});

describe("installedSizes", () => {
  it("keeps each group's largest package, smallest group first", () => {
    const sizes = installedSizes([
      ["Debian", [pkg({ installedSizeBytes: 500 }), pkg({ installedSizeBytes: 9000 })]],
      ["Alpine Linux", [pkg({ installedSizeBytes: 1200 })]],
    ]);
    expect(sizes).toEqual([
      { group: "Alpine Linux", bytes: 1200 },
      { group: "Debian", bytes: 9000 },
    ]);
  });

  it("leaves out groups that report no size", () => {
    expect(
      installedSizes([
        ["Flathub", [pkg({})]],
        ["Fedora", [pkg({ installedSizeBytes: 0 })]],
      ]),
    ).toEqual([]);
  });
});

describe("architectures", () => {
  it("lists each architecture once, sorted", () => {
    expect(
      architectures([
        pkg({ arch: "x86_64" }),
        pkg({ arch: "aarch64" }),
        pkg({ arch: "x86_64" }),
        pkg({}),
      ]),
    ).toEqual(["aarch64", "x86_64"]);
  });

  it("is empty when no source says", () => {
    expect(architectures([pkg({})])).toEqual([]);
  });
});

describe("flatpak runtimes", () => {
  it("names a runtime as people do, and keeps an unknown id as is", () => {
    expect(runtimeLabel("org.gnome.Platform//51")).toBe("GNOME 51");
    expect(runtimeLabel("org.freedesktop.Sdk//25.08")).toBe("Freedesktop 25.08");
    expect(runtimeLabel("org.example.Platform//3")).toBe("org.example.Platform 3");
  });

  it("lists each runtime once, and nothing for other formats", () => {
    const packages = [
      { source: "flatpak-flathub", runtime: "org.kde.Platform//6.9" },
      { source: "flatpak-flathub", risk: "beta", runtime: "org.kde.Platform//6.10" },
      { source: "flatpak-appcenter", runtime: "org.kde.Platform//6.9" },
      { source: "deb-debian" },
    ] as SourcedPackage[];
    expect(flatpakRuntimes(packages)).toEqual(["KDE 6.9", "KDE 6.10"]);
    expect(flatpakRuntimes([{ source: "deb-debian" }] as SourcedPackage[])).toEqual([]);
  });
});
