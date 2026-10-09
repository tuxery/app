import { describe, expect, it } from "vitest";
import {
  labelledIssuesUrl,
  reportDataProblemUrl,
  reportWebsiteProblemUrl,
  requestAdditionUrl,
} from "~/contribute-links";

const params = (url: string) => Object.fromEntries(new URL(url).searchParams);

describe("contribute links", () => {
  it("opens catalog's data-problem form, prefilled for one app", () => {
    expect(reportDataProblemUrl()).toBe(
      "https://github.com/tuxery/catalog/issues/new?template=report-problem.yml",
    );
    expect(
      params(
        reportDataProblemUrl({ name: "Firefox", pageUrl: "https://tuxery.store/app/firefox/" }),
      ),
    ).toEqual({
      template: "report-problem.yml",
      title: "[data] Firefox",
      link: "https://tuxery.store/app/firefox/",
    });
  });

  it("opens catalog's addition form, with the name when known", () => {
    expect(params(requestAdditionUrl())).toEqual({ template: "add-something.yml" });
    expect(params(requestAdditionUrl("Manjaro"))).toEqual({
      template: "add-something.yml",
      title: "[add] Manjaro",
      name: "Manjaro",
    });
  });

  it("opens app's website-problem form", () => {
    expect(params(reportWebsiteProblemUrl("https://tuxery.store/docs/"))).toEqual({
      template: "website-problem.yml",
      page: "https://tuxery.store/docs/",
    });
  });

  it("searches open issues across the org by label", () => {
    expect(params(labelledIssuesUrl("good first issue"))).toEqual({
      q: 'org:tuxery is:issue is:open label:"good first issue"',
      type: "issues",
    });
  });
});
