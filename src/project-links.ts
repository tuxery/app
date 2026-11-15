// The upstream project's own links the catalog carries beyond its homepage
// (AppStream's `<url type="...">`), as labelled actions for the product
// page — in an order that reads as "get involved": report, code, help,
// give. Pure, unit-tested in project-links.spec.ts.

import { httpUrl } from "~/safe-url";

/** Mirrors `tuxery/catalog`'s `PROJECT_LINK_TYPES`. */
export type ProjectLinkType =
  | "bugtracker"
  | "vcs-browser"
  | "donation"
  | "translate"
  | "contribute"
  | "help"
  | "faq"
  | "contact";

export type ProjectLinks = Partial<Record<ProjectLinkType, string>>;

const LABELS: [ProjectLinkType, string][] = [
  ["bugtracker", "Report a bug"],
  ["vcs-browser", "Source code"],
  ["contribute", "Contribute"],
  ["translate", "Help translate"],
  ["donation", "Donate"],
  ["help", "Documentation"],
  ["faq", "FAQ"],
  ["contact", "Contact"],
];

export function projectLinks(
  links: ProjectLinks | undefined,
): { type: ProjectLinkType; label: string; href: string }[] {
  if (!links) return [];
  return LABELS.flatMap(([type, label]) => {
    // Only http(s) links: AppStream also allows mailto: and others, which
    // shouldn't open as a page.
    const href = httpUrl(links[type]);
    return href ? [{ type, label, href }] : [];
  });
}
