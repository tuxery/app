import { component$ } from "@qwik.dev/core";
import { useLocation, type DocumentHead } from "@qwik.dev/router";
import { StatusPage } from "~/components/status-page/status-page";

// What any path no route answers shows, with status 404, inside the root
// layout (header, footer, the edge cache's Cache-Control). Pages that
// answer for a family of paths (an app, a source, a creator) say "not
// found" in their own words when the one asked for doesn't exist.
export default component$(() => {
  const location = useLocation();
  return (
    <StatusPage code={404} heading="Page not found">
      <p>
        There's no page at <code class="break-all">{location.url.pathname}</code>. It may have
        moved, or the link may have a typo.
      </p>
      <p>Search for what you were after, or start again from one of these:</p>
    </StatusPage>
  );
});

export const head: DocumentHead = {
  title: "Page not found — Tuxery",
};
