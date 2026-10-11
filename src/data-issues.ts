// What we know is missing or imprecise on an app's page, as a short list
// anyone can help fix — each entry links catalog's "Suggest a fix" form,
// prefilled. Only gaps the data itself proves: a field that's absent, a
// license that isn't a precise SPDX id, sources that contradict each
// other. Pure, unit-tested in data-issues.spec.ts.

import type { CatalogApp } from "~/catalog-types";
import { classifyLicense } from "~/license";

/** Values of the "What could be better?" dropdown in catalog's `suggest-fix.yml`. */
export type FixField =
  | "License"
  | "Name"
  | "Description"
  | "Category"
  | "Icon or screenshots"
  | "Homepage or other links";

export interface DataIssue {
  id: string;
  field: FixField;
  title: string;
  /** Why it matters, or what would help. */
  detail: string;
  /** What the page shows today, for the form's "What Tuxery shows today". */
  current?: string;
}

const TO_CLASSIFY = "To Classify";

type IssueInput = Pick<
  CatalogApp,
  | "license"
  | "licenseSpdx"
  | "licenseKind"
  | "shortDescription"
  | "category"
  | "iconUrl"
  | "screenshots"
  | "homepage"
  | "kind"
  | "dataConfidence"
>;

/** Why a raw license string isn't one precise license, in its own terms. */
function whyImprecise(license: string): string {
  const name = license.replace(/^custom:\s*/i, "").toUpperCase();
  if (/^(A|L)?GPL/.test(name)) {
    return `"${license}" doesn't say whether it's "only" this version or "or later" (GPL-3.0-only vs GPL-3.0-or-later).`;
  }
  if (name.startsWith("BSD"))
    return `"${license}" doesn't say how many clauses (BSD-2-Clause, BSD-3-Clause...).`;
  if (/^(APACHE|MPL)/.test(name)) return `"${license}" doesn't say which version.`;
  return `"${license}" isn't a license id everyone reads the same way.`;
}

export function dataIssues(app: IssueInput): DataIssue[] {
  const issues: DataIssue[] = [];
  const signals = new Set(app.dataConfidence?.signals.map((s) => s.signal));

  if (!app.license?.trim()) {
    issues.push({
      id: "license-missing",
      field: "License",
      title: "No license information",
      detail:
        "None of the sources says under which license this is published. The project's LICENSE file or website usually does.",
    });
  } else {
    // `licenseKind` is only set on a dataset that also computes `licenseSpdx`:
    // on an older one, a missing SPDX form says nothing.
    if (app.licenseKind !== undefined && !app.licenseSpdx) {
      issues.push({
        id: "license-not-spdx",
        field: "License",
        title: "License isn't a precise SPDX identifier",
        detail: `${whyImprecise(app.license)} The exact SPDX id tells you precisely what you may do.`,
        current: app.license,
      });
    }
    if ((app.licenseKind ?? classifyLicense(app.license)) === "unknown") {
      issues.push({
        id: "license-unclear",
        field: "License",
        title: "Can't tell if it's free software",
        detail: `"${app.license}" doesn't name a known free or proprietary license.`,
        current: app.license,
      });
    }
  }
  if (signals.has("license-family-conflict")) {
    issues.push({
      id: "license-conflict",
      field: "License",
      title: "Sources disagree on the license",
      detail: "Two sources report licenses of different families: one of them is likely wrong.",
      current: app.license,
    });
  }
  if (signals.has("name-disagreement")) {
    issues.push({
      id: "name-conflict",
      field: "Name",
      title: "Sources disagree on the name",
      detail: "Which name does the project itself use?",
    });
  }
  if (!app.shortDescription?.trim()) {
    issues.push({
      id: "description-missing",
      field: "Description",
      title: "No description",
      detail: "One sentence on what it does would help people find it.",
    });
  }
  if (app.category === TO_CLASSIFY) {
    issues.push({
      id: "category-missing",
      field: "Category",
      title: "Not categorized yet",
      detail: "Which category fits it best?",
    });
  }
  if (!app.iconUrl) {
    issues.push({
      id: "icon-missing",
      field: "Icon or screenshots",
      title: "No icon",
      detail: "A link to the project's official icon would do.",
    });
  }
  // Screenshots only matter for an app with a window.
  if (app.kind === "gui" && !app.screenshots?.length) {
    issues.push({
      id: "screenshots-missing",
      field: "Icon or screenshots",
      title: "No screenshots",
      detail: "Links to official screenshots help people see what they'd install.",
    });
  }
  if (!app.homepage) {
    issues.push({
      id: "homepage-missing",
      field: "Homepage or other links",
      title: "No project homepage",
      detail: "Where does the project live? Its website or repository.",
    });
  }
  return issues;
}
