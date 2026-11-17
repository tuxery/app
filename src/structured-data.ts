// The JSON-LD an app page carries, so search engines can tell it describes
// a piece of Linux software. Only what the catalog actually knows goes in,
// nothing derived by guessing. Two of Google's software-app fields are left
// out on purpose:
// - `offers`: the catalog has no price. A free-software license says what
//   one may do with the program, not that every build of it costs nothing.
// - `aggregateRating`: Tuxery's ratings are collected by other sites
//   (Flathub, ODRS, ...), and Google's review-snippet guidelines only accept
//   ratings a site collects from its own users.
// Without those two Google shows no rich result, but still reads the rest.
// Pure, unit-tested in structured-data.spec.ts.

import type { CatalogApp } from "~/catalog-types";

/**
 * The application types Google accepts for `applicationCategory`, per
 * Tuxery category. Categories without a clear match (AI, Networking, Science,
 * Productivity, Gaming Tools, To Classify...) get none rather than a wrong one.
 */
const APPLICATION_CATEGORIES: Readonly<Record<string, string>> = {
  "Books & Reference": "ReferenceApplication",
  Business: "BusinessApplication",
  "Developer Tools": "DeveloperApplication",
  Education: "EducationalApplication",
  Email: "CommunicationApplication",
  Finance: "FinanceApplication",
  "Graphics & Design": "DesignApplication",
  "Messaging & Calls": "CommunicationApplication",
  "Music & Audio": "MultimediaApplication",
  "Photo & Video": "MultimediaApplication",
  Security: "SecurityApplication",
  Settings: "UtilitiesApplication",
  "Social Media": "SocialNetworkingApplication",
  "System Tools": "UtilitiesApplication",
  "Travel & Navigation": "TravelApplication",
  Utilities: "UtilitiesApplication",
  "Web Browsers": "BrowserApplication",
};

/** Google's application type for an app: every game is a `GameApplication`; an app by its category, when one fits. */
export function applicationCategory(
  app: Pick<CatalogApp, "category" | "contentType">,
): string | undefined {
  if (app.contentType === "game") return "GameApplication";
  return APPLICATION_CATEGORIES[app.category];
}

/** A single SPDX license id (not an expression such as "MIT OR Apache-2.0") as its spdx.org page. */
function spdxLicenseUrl(spdx: string | undefined): string | undefined {
  return spdx && /^[A-Za-z0-9.+-]+$/.test(spdx)
    ? `https://spdx.org/licenses/${spdx}.html`
    : undefined;
}

const MAX_SCREENSHOTS = 5;

/**
 * The `SoftwareApplication` of an app page, `pageUrl` being its canonical
 * URL. Fields the app has no value for are left out, never filled with a
 * placeholder.
 */
export function softwareApplication(
  app: Pick<
    CatalogApp,
    | "name"
    | "shortDescription"
    | "iconUrl"
    | "screenshots"
    | "homepage"
    | "category"
    | "contentType"
    | "licenseSpdx"
  >,
  pageUrl: string,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    description: app.shortDescription || undefined,
    url: pageUrl,
    operatingSystem: "Linux",
    applicationCategory: applicationCategory(app),
    image: app.iconUrl,
    screenshot: app.screenshots?.length ? app.screenshots.slice(0, MAX_SCREENSHOTS) : undefined,
    license: spdxLicenseUrl(app.licenseSpdx),
    sameAs: app.homepage,
  };
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

/**
 * `data` as the text of a `<script type="application/ld+json">`. `<` is
 * escaped, so text from the catalog (a description holding `</script>`)
 * can't end the element early; JSON reads `<` back as `<`.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
