// A Flatpak's sandbox permissions (its `finish-args`: `--share=network`,
// `--filesystem=home:ro`, `--talk-name=...`) in plain words, plus an overall
// "how much access" reading. Pure, unit-tested in sandbox.spec.ts.
//
// The wording is deliberate: a permission says what the app *can* reach, not
// what it does — a browser legitimately holds "all devices", a file manager
// "your whole home folder". So the levels describe the breadth of access,
// never call an app unsafe, and the harmless plumbing every GUI app carries
// (graphics acceleration, Wayland, its own D-Bus names, theme settings) is
// left out rather than listed as if it mattered.

/** `info` is shown but doesn't weigh on the level; `notable` reaches your data or devices; `broad` weakens or bypasses the sandbox's main protections. */
export type PermissionWeight = "info" | "notable" | "broad";

export interface PermissionNote {
  weight: PermissionWeight;
  text: string;
}

export type SandboxLevel = "limited" | "some" | "wide";

export interface SandboxSummary {
  level: SandboxLevel;
  label: string;
  /** One sentence under the label: what the level means, and what it doesn't. */
  explanation: string;
  /** Plain-language permissions, broadest first. Empty for a fully closed sandbox. */
  notes: PermissionNote[];
}

const FOLDERS: Record<string, string> = {
  "xdg-download": "Downloads",
  "xdg-documents": "Documents",
  "xdg-pictures": "Pictures",
  "xdg-music": "Music",
  "xdg-videos": "Videos",
  "xdg-desktop": "Desktop",
};

const SOCKET_NOTES: Record<string, PermissionNote | null> = {
  pulseaudio: { weight: "info", text: "Plays and records audio" },
  "ssh-auth": { weight: "notable", text: "Can use your SSH keys through the SSH agent" },
  "gpg-agent": { weight: "notable", text: "Can use your GPG keys through the GPG agent" },
  pcsc: { weight: "info", text: "Talks to smart-card readers" },
  cups: { weight: "info", text: "Can print" },
  // Unfiltered access to the whole message bus: it can reach any service.
  "session-bus": { weight: "broad", text: "Unrestricted access to other apps' services" },
  "system-bus": { weight: "broad", text: "Unrestricted access to system services" },
  // Plumbing, or the fallback of an app that already speaks Wayland.
  wayland: null,
  "fallback-x11": null,
  "inherit-wayland-socket": null,
};

/** Notes for one `--filesystem=` value, `undefined` when it is plumbing not worth a line. */
function filesystemNote(value: string): PermissionNote | undefined {
  const [path, mode = "rw"] = value.split(":");
  const readOnly = mode === "ro";
  const access = readOnly ? "Reads" : "Reads and changes";
  if (path === "host" || path === "host-os" || path === "host-etc") {
    // host-os / host-etc expose system files, read-only: wide, but not your data.
    if (path !== "host") {
      return { weight: "notable", text: "Reads system files outside its sandbox" };
    }
    return readOnly
      ? { weight: "broad", text: "Reads all your files" }
      : { weight: "broad", text: "Reads and changes all your files" };
  }
  if (path === "home" || path === "~") {
    return readOnly
      ? { weight: "broad", text: "Reads your whole home folder" }
      : { weight: "broad", text: "Reads and changes your whole home folder" };
  }
  const folder = FOLDERS[path];
  if (folder) return { weight: "notable", text: `${access} your ${folder} folder` };
  // Settings and cache folders (theme, fonts, its own data) and runtime
  // sockets: ordinary desktop integration, not user data.
  if (/^(xdg-(config|data|cache|run|state)|~?\/?\.)/.test(path)) return undefined;
  if (path.startsWith("/")) {
    return { weight: "notable", text: `${access} files in ${path}` };
  }
  return undefined;
}

// D-Bus names whose access is worth a sentence; every other `--talk-name`
// is ordinary desktop integration (notifications, file chooser, a11y...).
const BUS_NOTES: Record<string, PermissionNote> = {
  // Lets the app run commands outside the sandbox: it can lift its own limits.
  "org.freedesktop.Flatpak": {
    weight: "broad",
    text: "Can run programs outside its sandbox",
  },
  "org.freedesktop.secrets": {
    weight: "notable",
    text: "Can read passwords stored in your keyring",
  },
  "org.gnome.keyring.SystemPrompter": {
    weight: "info",
    text: "Can ask for your keyring password",
  },
  "org.freedesktop.PackageKit": {
    weight: "notable",
    text: "Can install or remove system software",
  },
  "org.freedesktop.login1": {
    weight: "notable",
    text: "Can shut down, reboot or suspend the system",
  },
};

const WEIGHT_ORDER: Record<PermissionWeight, number> = { broad: 0, notable: 1, info: 2 };

/**
 * Reads a list of `finish-args` into plain-language notes. Unknown or
 * purely technical arguments are dropped, never guessed at.
 */
export function permissionNotes(finishArgs: readonly string[]): PermissionNote[] {
  const notes = new Map<string, PermissionNote>();
  const add = (note: PermissionNote | undefined) => {
    if (note) notes.set(note.text, note);
  };
  const wayland = finishArgs.includes("--socket=wayland");

  for (const arg of finishArgs) {
    const match = /^--(no-)?([a-z-]+)=(.+)$/.exec(arg);
    if (!match || match[1]) continue; // `--nosocket=` etc. only take away
    const [, , kind, value] = match;
    switch (kind) {
      case "share":
        if (value === "network") add({ weight: "info", text: "Uses the internet" });
        break;
      case "socket":
        if (value === "x11") {
          if (!wayland) {
            add({
              weight: "info",
              text: "Uses the older X11 display system, which doesn't isolate windows from each other",
            });
          }
        } else {
          add(SOCKET_NOTES[value] ?? undefined);
        }
        break;
      case "device":
        if (value === "all") {
          add({ weight: "notable", text: "Can access all devices, including cameras and USB" });
        } else if (value === "usb") {
          add({ weight: "notable", text: "Can access USB devices" });
        } else if (value === "input") {
          add({ weight: "notable", text: "Can read game controllers and input devices" });
        } else if (value === "kvm") {
          add({ weight: "info", text: "Can run virtual machines" });
        }
        // dri (graphics acceleration) and shm are on nearly every app.
        break;
      case "filesystem":
        add(filesystemNote(value));
        break;
      case "talk-name":
        add(BUS_NOTES[value]);
        break;
      case "system-talk-name":
        if (value === "org.freedesktop.Flatpak") add(BUS_NOTES[value]);
        break;
      case "allow":
        if (value === "devel") {
          add({ weight: "broad", text: "Can inspect and debug other processes (developer tools)" });
        } else if (value === "bluetooth") {
          add({ weight: "notable", text: "Can use Bluetooth" });
        }
        break;
      default:
        break;
    }
  }
  return [...notes.values()].toSorted((a, b) => WEIGHT_ORDER[a.weight] - WEIGHT_ORDER[b.weight]);
}

const EXPLANATIONS: Record<SandboxLevel, string> = {
  limited:
    "Runs in a sandbox with no access to your personal files or devices beyond what's listed.",
  some: "Runs in a sandbox, with access to some of your files or devices.",
  wide: "Runs in a sandbox, but a broad part of it is open — typical for tools that need to manage your files or system. It shows what the app is able to do, not what it does.",
};

const LABELS: Record<SandboxLevel, string> = {
  limited: "Limited access",
  some: "Some access",
  wide: "Wide access",
};

/**
 * The overall reading of a Flatpak's sandbox. `undefined` input means the
 * permissions are unknown: no summary, never a reassuring default. An empty
 * list is real information — a fully closed sandbox.
 */
export function sandboxSummary(
  finishArgs: readonly string[] | undefined,
): SandboxSummary | undefined {
  if (!finishArgs) return undefined;
  const notes = permissionNotes(finishArgs);
  const level: SandboxLevel = notes.some((note) => note.weight === "broad")
    ? "wide"
    : notes.some((note) => note.weight === "notable")
      ? "some"
      : "limited";
  return { level, label: LABELS[level], explanation: EXPLANATIONS[level], notes };
}
