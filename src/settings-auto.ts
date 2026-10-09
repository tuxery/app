// What "Auto" resolves to, in words, for the settings page's tri-state
// controls — "Auto" alone said nothing about whether a source would be
// shown or a setup assumed done. Same resolution rules as `~/settings`'s
// `isGroupEffectivelyShown`/`isRepoEffectivelyActivated`; pure, so the
// wording is unit-tested (settings-auto.spec.ts).

/** For a Hide/Auto/Show control left on Auto: whether the group shows, and why. */
export function autoShownNote(
  groupId: string,
  recommended: Set<string> | undefined,
  osLabel: string | undefined,
): string {
  // No OS picked: the tab's intro says so once, rather than every row.
  if (!recommended || !osLabel) return "Auto: shown";
  return recommended.has(groupId)
    ? `Auto: shown — used on ${osLabel}`
    : `Auto: hidden — not used on ${osLabel}`;
}

/** For a No/Auto/Done control left on Auto: whether the setup counts as done, and why. */
export function autoActivatedNote(
  repoId: string,
  preActivated: Set<string> | undefined,
  osLabel: string | undefined,
): string {
  if (!preActivated || !osLabel) return "Auto: not set up yet";
  return preActivated.has(repoId)
    ? `Auto: done — ${osLabel} comes with it`
    : `Auto: not set up — ${osLabel} doesn't include it`;
}
