// Links that open a GitHub issue already filled in as far as we can, so
// contributing takes one click and a sentence, not a hunt for the right
// repo and form. GitHub issue forms prefill a field from the query
// parameter named after its `id` — the ids below mirror the forms in
// tuxery/catalog's and tuxery/app's `.github/ISSUE_TEMPLATE/`; rename a
// field there and its link here stops prefilling (the form still opens).
// Pure, unit-tested in contribute-links.spec.ts.

const CATALOG_NEW_ISSUE = "https://github.com/tuxery/catalog/issues/new";
const APP_NEW_ISSUE = "https://github.com/tuxery/app/issues/new";

function withParams(base: string, params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  return `${base}?${query.toString()}`;
}

/** catalog's "Report a data problem" form, optionally about one app page. */
export function reportDataProblemUrl(app?: { name: string; pageUrl: string }): string {
  return withParams(CATALOG_NEW_ISSUE, {
    template: "report-problem.yml",
    title: app ? `[data] ${app.name}` : undefined,
    link: app?.pageUrl,
  });
}

/** catalog's "Add a distro, source, or app/game" form. */
export function requestAdditionUrl(name?: string): string {
  return withParams(CATALOG_NEW_ISSUE, {
    template: "add-something.yml",
    title: name ? `[add] ${name}` : undefined,
    name,
  });
}

/** app's "Website problem" form, optionally about one page. */
export function reportWebsiteProblemUrl(pageUrl?: string): string {
  return withParams(APP_NEW_ISSUE, { template: "website-problem.yml", page: pageUrl });
}

/** Open issues across the org carrying `label`, for picking up work. */
export function labelledIssuesUrl(label: string): string {
  const query = `org:tuxery is:issue is:open label:"${label}"`;
  return `https://github.com/search?${new URLSearchParams({ q: query, type: "issues" })}`;
}
