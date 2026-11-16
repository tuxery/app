import { component$ } from "@qwik.dev/core";
import { useDocumentHead, useLocation } from "@qwik.dev/router";
import { canonicalUrl, robotsMeta, socialMeta } from "~/seo";

/**
 * The RouterHead component is placed inside of the document `<head>` element.
 */
export const RouterHead = component$(() => {
  const head = useDocumentHead();
  const loc = useLocation();
  const canonical = canonicalUrl(loc.url.pathname);
  const robots = robotsMeta(loc.url.pathname, loc.url.hostname);
  // Open Graph and X card tags for link previews, from the page's own
  // title, description and image (`~/seo`'s `socialMeta`).
  const social = socialMeta({ title: head.title, url: canonical, metas: head.meta });

  return (
    <>
      <title>{head.title}</title>

      <link rel="canonical" href={canonical} />
      {robots && <meta name="robots" content={robots} />}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

      {head.meta.map((m) => (
        <meta key={m.key} {...m} />
      ))}

      {social.map((m) => (
        <meta key={m.property ?? m.name} {...m} />
      ))}

      {head.links.map((l) => (
        <link key={l.key} {...l} />
      ))}

      {head.styles.map((s) => (
        <style
          key={s.key}
          {...s.props}
          {...(s.props?.dangerouslySetInnerHTML ? {} : { dangerouslySetInnerHTML: s.style })}
        />
      ))}

      {head.scripts.map((s) => (
        <script
          key={s.key}
          {...s.props}
          {...(s.props?.dangerouslySetInnerHTML ? {} : { dangerouslySetInnerHTML: s.script })}
        />
      ))}
    </>
  );
});
