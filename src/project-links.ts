// The upstream project's own links the catalog carries beyond its homepage
// (AppStream's `<url type="...">`), as labelled actions for the product
// page — in an order that reads as "get involved": report, code, help,
// give. Pure, unit-tested in project-links.spec.ts.

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

/** Only http(s) links: AppStream also allows mailto: and others, which shouldn't open as a page. */
const WEB_LINK = /^https?:\/\//i;

export function projectLinks(
  links: ProjectLinks | undefined,
): { type: ProjectLinkType; label: string; href: string }[] {
  if (!links) return [];
  return LABELS.flatMap(([type, label]) => {
    const href = links[type];
    return href && WEB_LINK.test(href) ? [{ type, label, href }] : [];
  });
}
