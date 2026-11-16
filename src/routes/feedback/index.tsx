import { component$, isBrowser, useTask$ } from "@qwik.dev/core";
import { Form, routeAction$, routeLoader$, useLocation, type DocumentHead } from "@qwik.dev/router";
import { LuCheckCircle, LuMessageSquare } from "@qwikest/icons/lucide";
import {
  buildFeedbackIssue,
  FEEDBACK_KINDS,
  FEEDBACK_REPO,
  MESSAGE_MAX,
  MESSAGE_MIN,
  normalizePage,
  parseFeedback,
} from "~/feedback";
import { resolveServerEnv } from "~/server-env";
import {
  TURNSTILE_ACTION,
  TURNSTILE_RESPONSE_FIELD,
  TURNSTILE_SCRIPT,
  verifyTurnstile,
} from "~/turnstile";

type FeedbackResult = { sent: true } | { sent: false; error: string };

/** The Turnstile site key when both of its keys are configured, else null (no widget). */
export const useTurnstileSiteKey = routeLoader$(({ platform }) => {
  const env = resolveServerEnv(platform);
  return env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY ? env.TURNSTILE_SITE_KEY : null;
});

// Posts the tester's message as an issue in the private feedback repository
// (see ~/feedback). Without FEEDBACK_GITHUB_TOKEN (local dev, pull-request
// Previews) the form says so instead of pretending to send. Before that:
// at most FEEDBACK_RATE_LIMITER's quota per IP address, and a Turnstile
// check where Turnstile is configured (see ~/turnstile).
export const useSendFeedback = routeAction$(
  async (form, { platform, request }): Promise<FeedbackResult> => {
    const parsed = parseFeedback(form);
    if (!parsed.ok) return parsed.spam ? { sent: true } : { sent: false, error: parsed.error };

    const env = resolveServerEnv(platform);
    const token = env.FEEDBACK_GITHUB_TOKEN;
    if (!token) {
      return {
        sent: false,
        error:
          "Feedback can't be sent from this copy of the site. Please write to info@tuxery.store.",
      };
    }

    const ip = request.headers.get("cf-connecting-ip");
    const limiter = (platform?.env as Partial<Env> | undefined)?.FEEDBACK_RATE_LIMITER;
    if (limiter && ip && !(await limiter.limit({ key: ip })).success) {
      return {
        sent: false,
        error: "Too many messages in a short time. Please wait a minute and try again.",
      };
    }

    if (env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY) {
      const verdict = await verifyTurnstile(
        form[TURNSTILE_RESPONSE_FIELD],
        env.TURNSTILE_SECRET_KEY,
        ip,
      );
      if (!verdict.ok) {
        console.warn(`[feedback] Turnstile refused: ${verdict.reason}`);
        return {
          sent: false,
          error:
            "We couldn't check that you're not a robot. Please complete the check above the Send button and try again.",
        };
      }
    }

    const issue = buildFeedbackIssue(parsed.input, APP_COMMIT.slice(0, 7));
    try {
      const response = await fetch(`https://api.github.com/repos/${FEEDBACK_REPO}/issues`, {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "tuxery-web-feedback",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify(issue),
      });
      if (response.ok) return { sent: true };
      console.error(`[feedback] GitHub answered ${response.status}: ${await response.text()}`);
    } catch (err) {
      console.error("[feedback] GitHub request failed", err);
    }
    return {
      sent: false,
      error: "Your message couldn't be sent. Please try again, or write to info@tuxery.store.",
    };
  },
);

export default component$(() => {
  const action = useSendFeedback();
  const turnstileSiteKey = useTurnstileSiteKey();
  const loc = useLocation();
  // A Turnstile token is single-use: after an answer that didn't send the
  // message, the widget needs a fresh one before the next try.
  useTask$(({ track }) => {
    track(() => action.value);
    if (isBrowser && action.value && !action.value.sent)
      (window as { turnstile?: { reset: () => void } }).turnstile?.reset();
  });
  // `?from=` is whatever the link that led here says: only a path on this
  // site becomes the "back" link's `href` and the form's prefilled page.
  const from = normalizePage(loc.url.searchParams.get("from")) ?? "";
  const result = action.value;

  if (result?.sent) {
    return (
      <div class="flex flex-col gap-4 max-w-2xl">
        <h1 class="text-3xl font-bold flex items-center gap-3">
          <LuCheckCircle class="text-success" /> Thank you!
        </h1>
        <p>Your message reached us. Every one is read.</p>
        <p class="flex gap-4">
          {from && (
            <a href={from} class="link link-primary">
              ← Back to where you were
            </a>
          )}
          <a href="/feedback/" class="link link-primary">
            Send another
          </a>
        </p>
      </div>
    );
  }

  return (
    <div class="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 class="text-3xl font-bold mb-2 flex items-center gap-3">
          <LuMessageSquare /> Send feedback
        </h1>
        <p class="text-base-content/70">
          Tuxery is in a private beta: thank you for trying it. Tell us what's broken, what's wrong
          in an app's data, or what you'd like to see. Messages are read by the person who builds
          Tuxery and are never published.
        </p>
      </div>

      <Form action={action} class="flex flex-col gap-4">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">What is it about?</legend>
          <select name="kind" class="select w-full" aria-label="What is it about?">
            {FEEDBACK_KINDS.map((kind) => (
              <option key={kind.id} value={kind.id}>
                {kind.label}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Your message</legend>
          <textarea
            name="message"
            required
            minLength={MESSAGE_MIN}
            maxLength={MESSAGE_MAX}
            rows={7}
            class="textarea w-full"
            aria-label="Your message"
            placeholder="What happened, on which page, what you expected…"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Page (optional)</legend>
          <input
            type="text"
            name="page"
            value={from}
            class="input w-full"
            aria-label="Page"
            placeholder="/app/gimp/"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">How to reach you (optional)</legend>
          <input
            type="text"
            name="contact"
            maxLength={200}
            class="input w-full"
            aria-label="How to reach you"
            placeholder="An email address or a handle, only if you want an answer"
          />
          <p class="label whitespace-normal">
            Kept with your message only, to answer you. See the{" "}
            <a href="/docs/legal/" class="link">
              privacy notice
            </a>
            .
          </p>
        </fieldset>

        {/* Honeypot: hidden from people and screen readers, filled by bots. */}
        <div aria-hidden="true" class="hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {turnstileSiteKey.value && (
          <>
            <div
              class="cf-turnstile"
              data-sitekey={turnstileSiteKey.value}
              data-action={TURNSTILE_ACTION}
              data-theme="auto"
              data-size="flexible"
            />
            <script src={TURNSTILE_SCRIPT} async defer />
          </>
        )}

        {result && !result.sent && (
          <p role="alert" class="alert alert-error">
            {result.error}
          </p>
        )}

        <button type="submit" class="btn btn-primary self-start" disabled={action.isRunning}>
          {action.isRunning ? "Sending…" : "Send"}
        </button>
      </Form>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Send feedback — Tuxery",
  meta: [
    {
      name: "description",
      content:
        "Tell Tuxery what's broken, what's wrong in an app's data, or what you'd like to see.",
    },
  ],
};
