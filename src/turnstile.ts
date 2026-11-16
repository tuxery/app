// Cloudflare Turnstile on /feedback: the form carries the widget's token in
// `cf-turnstile-response`, and the Worker checks it with Cloudflare's
// siteverify endpoint before filing anything. Enabled only where both keys
// are configured (production): TURNSTILE_SITE_KEY is a public wrangler var,
// TURNSTILE_SECRET_KEY a secret. Without them (local dev, pull-request
// Previews) the form works as before, guarded by its honeypot alone.
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

export const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js";
export const TURNSTILE_RESPONSE_FIELD = "cf-turnstile-response";
/** Ties a token to this form: one minted for another action is refused. */
export const TURNSTILE_ACTION = "feedback";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
// Turnstile's tokens are at most 2048 characters.
const TOKEN_MAX = 2048;
// Cloudflare's test keys answer with this hostname and no action.
const TEST_HOSTNAME = "example.com";

export type TurnstileVerdict = { ok: true } | { ok: false; reason: string };

interface SiteverifyAnswer {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
  /** Set by Cloudflare when the secret is one of its public test secrets. */
  metadata?: { result_with_testing_key?: boolean };
}

/** Whether a siteverify hostname is this site, a Preview of it, or the test key's. */
function isOurHostname(hostname: string | undefined): boolean {
  if (!hostname) return false;
  return /(^|\.)tuxery\.store$/.test(hostname) || hostname === TEST_HOSTNAME;
}

/**
 * Asks Cloudflare whether `token` is a fresh, valid answer to this site's
 * widget. Any doubt (no token, network error, unexpected action or
 * hostname) is a refusal: the caller shows an error and sends nothing.
 */
export async function verifyTurnstile(
  token: unknown,
  secret: string,
  remoteIp: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<TurnstileVerdict> {
  if (typeof token !== "string" || token.length === 0 || token.length > TOKEN_MAX)
    return { ok: false, reason: "missing-token" };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  let answer: SiteverifyAnswer;
  try {
    const response = await fetchImpl(SITEVERIFY, { method: "POST", body });
    if (!response.ok) return { ok: false, reason: `siteverify-http-${response.status}` };
    answer = (await response.json()) as SiteverifyAnswer;
  } catch {
    return { ok: false, reason: "siteverify-unreachable" };
  }
  if (answer.success !== true)
    return { ok: false, reason: answer["error-codes"]?.join(",") || "rejected" };
  // Only a test secret (local checks) gets answers without an action.
  const testing = answer.metadata?.result_with_testing_key === true;
  if (!testing && answer.action !== TURNSTILE_ACTION) return { ok: false, reason: "wrong-action" };
  if (!isOurHostname(answer.hostname)) return { ok: false, reason: "wrong-hostname" };
  return { ok: true };
}
