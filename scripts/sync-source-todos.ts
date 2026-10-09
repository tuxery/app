// Regenerates src/data/source-todos.json — the docs' per-source to-do page
// (/docs/coverage/) — from tuxery/catalog's open issues labelled
// `source:<PackageSourceId>`. One issue per missing piece, so the page is
// never edited by hand: open, label or close an issue there, then rerun
//
//   pnpm sync:source-todos
//
// and commit the JSON. Committed rather than fetched at request time:
// GitHub's unauthenticated API allows 60 requests an hour per IP, shared
// by every Worker in a datacenter. Reads GITHUB_TOKEN or GH_TOKEN when set
// (the devcontainer has the latter), anonymous otherwise.

import { writeFile } from "node:fs/promises";

const REPO = "tuxery/catalog";
const LABEL_PREFIX = "source:";
const OUTPUT = new URL("../src/data/source-todos.json", import.meta.url);

interface GitHubIssue {
  number: number;
  title: string;
  html_url: string;
  labels: { name: string }[];
  pull_request?: unknown;
}

const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
const headers: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

const issues: GitHubIssue[] = [];
for (let page = 1; ; page++) {
  // Sequential: each page tells whether there's a next one.
  // eslint-disable-next-line no-await-in-loop
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/issues?state=open&per_page=100&page=${page}`,
    { headers },
  );
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  // eslint-disable-next-line no-await-in-loop
  const batch = (await response.json()) as GitHubIssue[];
  issues.push(...batch);
  if (batch.length < 100) break;
}

const items = issues
  .filter((issue) => !issue.pull_request)
  .map((issue) => ({
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    sources: issue.labels
      .map((label) => label.name)
      .filter((name) => name.startsWith(LABEL_PREFIX))
      .map((name) => name.slice(LABEL_PREFIX.length))
      .sort(),
  }))
  .filter((item) => item.sources.length > 0)
  .sort((a, b) => a.number - b.number);

await writeFile(
  OUTPUT,
  `${JSON.stringify({ syncedAt: new Date().toISOString(), repo: REPO, items }, null, 2)}\n`,
);
console.log(`${items.length} per-source to-do items written to ${OUTPUT.pathname}`);
