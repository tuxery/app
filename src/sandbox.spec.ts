import { describe, expect, it } from "vitest";
import { permissionNotes, sandboxSummary } from "~/sandbox";

const texts = (args: string[]) => permissionNotes(args).map((note) => note.text);

describe("permissionNotes", () => {
  it("leaves out the plumbing every graphical app carries", () => {
    expect(
      texts([
        "--socket=wayland",
        "--socket=fallback-x11",
        "--device=dri",
        "--share=ipc",
        "--filesystem=xdg-config/gtk-3.0:ro",
        "--own-name=org.example.App",
        "--talk-name=org.freedesktop.Notifications",
        "--persist=.mozilla",
      ]),
    ).toEqual([]);
  });

  it("names the folder and whether it is read-only", () => {
    expect(texts(["--filesystem=xdg-download"])).toEqual([
      "Reads and changes your Downloads folder",
    ]);
    expect(texts(["--filesystem=xdg-documents:ro"])).toEqual(["Reads your Documents folder"]);
  });

  it("flags the whole home folder and the whole filesystem as broad", () => {
    expect(permissionNotes(["--filesystem=home"])[0]).toEqual({
      weight: "broad",
      text: "Reads and changes your whole home folder",
    });
    expect(permissionNotes(["--filesystem=host:ro"])[0]?.text).toBe("Reads all your files");
  });

  it("only mentions X11 when the app has no Wayland", () => {
    expect(texts(["--socket=x11", "--socket=wayland"])).toEqual([]);
    expect(texts(["--socket=x11"])).toHaveLength(1);
  });

  it("recognises the ways out of the sandbox", () => {
    expect(permissionNotes(["--talk-name=org.freedesktop.Flatpak"])[0]?.weight).toBe("broad");
    expect(permissionNotes(["--socket=session-bus"])[0]?.weight).toBe("broad");
    expect(permissionNotes(["--allow=devel"])[0]?.weight).toBe("broad");
  });

  it("ignores arguments that only take access away, and unknown ones", () => {
    expect(texts(["--nosocket=x11", "--unshare=network", "--env=FOO=bar", "--mystery=x"])).toEqual(
      [],
    );
  });

  it("lists the broadest first, without duplicates", () => {
    const notes = permissionNotes([
      "--share=network",
      "--device=all",
      "--filesystem=home:ro",
      "--device=all",
    ]);
    expect(notes.map((note) => note.weight)).toEqual(["broad", "notable", "info"]);
  });
});

describe("sandboxSummary", () => {
  it("has no summary when the permissions are unknown", () => {
    expect(sandboxSummary(undefined)).toBeUndefined();
  });

  it("calls a closed sandbox limited, not unknown", () => {
    expect(sandboxSummary([])?.level).toBe("limited");
  });

  it("reads a browser-like app as some access, not wide", () => {
    const summary = sandboxSummary([
      "--share=network",
      "--share=ipc",
      "--socket=x11",
      "--socket=wayland",
      "--socket=pulseaudio",
      "--device=all",
      "--filesystem=xdg-download",
      "--filesystem=xdg-config/gtk-3.0:ro",
      "--talk-name=org.gtk.vfs.*",
    ]);
    expect(summary?.level).toBe("some");
    expect(summary?.label).toBe("Some access");
  });

  it("reads a calendar-like app as limited", () => {
    expect(
      sandboxSummary(["--share=ipc", "--share=network", "--device=dri", "--socket=wayland"])?.level,
    ).toBe("limited");
  });

  it("reads home or Flatpak-escape access as wide, without calling it unsafe", () => {
    const summary = sandboxSummary(["--filesystem=home"]);
    expect(summary?.level).toBe("wide");
    expect(summary?.explanation).toContain("not what it does");
    expect(`${summary?.label} ${summary?.explanation}`.toLowerCase()).not.toContain("unsafe");
  });
});
