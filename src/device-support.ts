// What an app says about the devices it works on, read from the one line the
// catalog keeps of AppStream's `<requires>`/`<recommends>`/`<supports>`
// (`tuxery/catalog`'s `summarizeRelations`): "Requires: a screen with its
// shortest side at least 360 px. Recommends: gamepad. Supports: touch
// screen." Like the kudos (`~/accessibility-hints`), these are the
// developer's own claims, so the page words them as such. Pure and
// string-based on purpose: the catalog's wording is the contract, and a
// line that doesn't match gives no badge rather than a wrong one.

export interface DeviceBadge {
  id: "phone" | "screen" | "touch" | "gamepad" | "online" | "offline" | "first-run";
  label: string;
  /** One sentence for the badge's tooltip. */
  tip: string;
}

type Section = "Requires" | "Recommends" | "Supports";

const SECTION = /(Requires|Recommends|Supports): (.+?)\.(?=\s|$)/g;

/** The line split into its three lists of relations (each a lowercase phrase); sections it doesn't have are empty. */
function sections(requirements: string): Record<Section, string[]> {
  const found: Record<Section, string[]> = { Requires: [], Recommends: [], Supports: [] };
  for (const [, section, list] of requirements.matchAll(SECTION)) {
    found[section as Section].push(...list.split(", ").map((item) => item.trim().toLowerCase()));
  }
  return found;
}

/**
 * The smallest screen the app asks for, in pixels on its shortest side:
 * AppStream's `display_length` (the catalog words it "a screen with its
 * shortest side at least 360 px"). 360 is the figure GNOME and Flathub use
 * for "fits a phone".
 */
const MIN_SCREEN = /a screen with its shortest side at least (\d+) px/;
const PHONE_SCREEN_PX = 360;

/** The badges an app's requirements line earns, in a fixed order; empty when it says nothing usable. */
export function deviceBadges(requirements: string | undefined): DeviceBadge[] {
  if (!requirements) return [];
  const { Requires, Recommends, Supports } = sections(requirements);
  const all = [...Requires, ...Recommends, ...Supports];
  const badges: DeviceBadge[] = [];

  const minScreen = Requires.map((item) => MIN_SCREEN.exec(item)?.[1]).find(Boolean);
  if (minScreen) {
    const px = Number(minScreen);
    badges.push(
      px <= PHONE_SCREEN_PX
        ? {
            id: "phone",
            label: "Works on phones",
            tip: `Fits a screen as small as ${px} px on its shortest side, a phone's.`,
          }
        : {
            id: "screen",
            label: `Screen ≥ ${px} px`,
            tip: `Needs a screen at least ${px} px on its shortest side: a tablet or a computer, not a phone.`,
          },
    );
  }
  if (all.includes("touch screen")) {
    badges.push({ id: "touch", label: "Touch", tip: "Can be used with a touch screen." });
  }
  if (all.includes("gamepad")) {
    badges.push({ id: "gamepad", label: "Gamepad", tip: "Can be played with a gamepad." });
  }
  if (Requires.includes("an internet connection")) {
    badges.push({
      id: "online",
      label: "Needs internet",
      tip: "Doesn't work without a connection.",
    });
  } else if (Requires.includes("internet on first run")) {
    badges.push({
      id: "first-run",
      label: "Internet on first run",
      tip: "Needs a connection the first time it runs, not after.",
    });
  } else if (all.includes("offline use only")) {
    badges.push({ id: "offline", label: "Works offline", tip: "Never needs a connection." });
  }
  return badges;
}
