import { describe, expect, it } from "vitest";
import { deviceBadges } from "./device-support";

const ids = (requirements: string | undefined) => deviceBadges(requirements).map(({ id }) => id);

describe("deviceBadges", () => {
  it("reads a phone-sized screen and touch from GNOME's usual line", () => {
    expect(
      ids(
        "Requires: a screen with its shortest side at least 360 px. Recommends: an internet connection. Supports: keyboard, mouse or touchpad, touch screen.",
      ),
    ).toEqual(["phone", "touch"]);
  });

  it("tells a bigger minimum screen from a phone", () => {
    const [badge] = deviceBadges(
      "Requires: a screen with its shortest side at least 768 px. Recommends: keyboard, mouse or touchpad.",
    );
    expect(badge).toMatchObject({ id: "screen", label: "Screen ≥ 768 px" });
  });

  it("finds a gamepad in any list", () => {
    expect(ids("Recommends: gamepad.")).toEqual(["gamepad"]);
    expect(ids("Requires: gamepad. Supports: keyboard.")).toEqual(["gamepad"]);
  });

  it("says Needs internet only when the app requires it", () => {
    expect(ids("Requires: an internet connection.")).toEqual(["online"]);
    expect(ids("Recommends: an internet connection.")).toEqual([]);
    expect(ids("Requires: internet on first run.")).toEqual(["first-run"]);
    expect(ids("Supports: offline use only.")).toEqual(["offline"]);
  });

  it("keeps a fixed order", () => {
    expect(
      ids(
        "Requires: an internet connection, a screen with its shortest side at least 320 px. Supports: gamepad, touch screen.",
      ),
    ).toEqual(["phone", "touch", "gamepad", "online"]);
  });

  it("gives nothing for a line it can't use", () => {
    expect(deviceBadges(undefined)).toEqual([]);
    expect(deviceBadges("")).toEqual([]);
    expect(ids("Recommends: mouse or touchpad, keyboard.")).toEqual([]);
    expect(ids("Requires: at least 2048 MiB of memory.")).toEqual([]);
  });
});
