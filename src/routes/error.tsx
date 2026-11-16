import { component$ } from "@qwik.dev/core";
import { useHttpStatus, useLocation, type DocumentHead } from "@qwik.dev/router";
import { StatusPage } from "~/components/status-page/status-page";

// What a request that failed shows, inside the root layout: Qwik Router
// renders it, with the error's status and `Cache-Control: no-store`, for
// any `error()` a handler or loader throws, and the root layout's
// `onRequest` turns any other exception into one (a 500). A catalog outage
// isn't an error here: pages then render with the layout's banner, as 503.
export default component$(() => {
  const { status, message } = useHttpStatus();
  const location = useLocation();
  const isServerError = status >= 500;
  return (
    <StatusPage
      code={status}
      heading={isServerError ? "Something went wrong" : "This request can't be answered"}
    >
      {isServerError ? (
        <p>
          Tuxery couldn't show this page. It's on our side, not yours: try{" "}
          <a
            href={location.url.pathname + location.url.search}
            class="link link-primary"
            data-reload
          >
            loading it again
          </a>{" "}
          in a moment.
        </p>
      ) : (
        // Written by the app itself (`error(status, message)`), never an
        // exception's own text: those all become a plain 500.
        <p>{message}</p>
      )}
    </StatusPage>
  );
});

export const head: DocumentHead = ({ status }) => ({
  title: `${status >= 500 ? "Something went wrong" : "Error"} — Tuxery`,
});
