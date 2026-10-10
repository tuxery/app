import { describe, expect, it } from "vitest";
import { classifyLicense } from "~/license";

describe("classifyLicense", () => {
  it("recognizes free licenses however each source spells them", () => {
    for (const license of [
      "MIT",
      "GPL",
      "GPL3",
      "GPLv3",
      "GPL-3.0-or-later",
      "GPL-2.0+",
      "LGPL2.1",
      "Apache",
      "BSD",
      "BSD-3-Clause",
      "MPL-2.0",
      "Unlicense",
      "custom:BSD-2-clause",
      "Apache-2.0 AND MIT",
      "GPL-3.0-or-later WITH GCC-exception-3.1",
      "GPL-2.0 AND OFL-1.1 AND Apache-2.0",
      "CC-BY-SA-4.0",
    ]) {
      expect(classifyLicense(license)).toBe("free");
    }
  });

  it("calls proprietary only what says so", () => {
    for (const license of [
      "EULA",
      "LicenseRef-proprietary",
      "custom:commercial",
      "Freeware",
      "custom:Brother EULA AND GPL2",
      "custom:Epson End User Software License Agreement",
    ]) {
      expect(classifyLicense(license)).toBe("proprietary");
    }
  });

  it("gives no verdict when it can't tell", () => {
    for (const license of [
      undefined,
      "",
      "custom",
      "unknown",
      "LicenseRef-custom",
      "None",
      "GNU",
      "custom AND MIT",
      "BUSL-1.1",
      "CC-BY-NC-4.0",
      "MIT OR proprietary",
    ]) {
      expect(classifyLicense(license)).toBe("unknown");
    }
  });
});
