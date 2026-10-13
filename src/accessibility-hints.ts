// What an app's developer says about how it adapts to the person using it:
// AppStream's `<kudos>` (`tuxery/catalog`'s `CatalogApp.kudos`), which a
// developer sets by hand, so these are claims, worded as such. Only the
// kudos that are about display and accessibility are shown; the others
// (`ModernToolkit`, `UserDocs`, `Notifications`, `AppMenu`,
// `SearchProvider`) say how the app is built, not how it adapts.

const HINTS: Record<string, string> = {
  HighContrast: "High-contrast mode",
  HiDpiIcon: "Sharp icon on high-resolution screens",
};

/** The hints for an app's kudos, in the order above, without duplicates; empty when none applies. */
export function accessibilityHints(kudos: readonly string[] | undefined): string[] {
  if (!kudos) return [];
  return Object.entries(HINTS)
    .filter(([kudo]) => kudos.includes(kudo))
    .map(([, hint]) => hint);
}
